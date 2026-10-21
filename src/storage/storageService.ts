import { AppStateData, Task, CalendarEvent, JournalEntry } from '../types';
import { INITIAL_DEMO_DATA } from './initialData';
import { indexedDBAdapter } from './indexedDBAdapter';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedData?: AppStateData;
}

export interface ImportOptions {
  mode: 'replace' | 'merge';
}

export interface StorageService {
  load(): AppStateData;
  initAsync(): Promise<AppStateData | null>;
  save(data: AppStateData): Promise<boolean>;
  saveSync(data: AppStateData): boolean;
  clear(): Promise<void>;
  exportJSON(): string;
  validateBackup(jsonString: string): ValidationResult;
  importJSON(jsonString: string, options?: ImportOptions): { success: boolean; error?: string; data?: AppStateData };
  exportJournalMarkdown(): string;
}

const STORAGE_KEY = 'life_os_state_v1';
export const CURRENT_SCHEMA_VERSION = 2;

/**
 * Validates and sanitizes unknown JSON data to ensure structural and type integrity.
 * Never throws; returns a clear ValidationResult.
 */
export function validateAppStateData(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, error: 'O backup fornecido não é um objeto JSON válido.' };
  }

  const obj = raw as Record<string, unknown>;

  // Check required core collections
  if (!Array.isArray(obj.tasks)) {
    return { valid: false, error: 'Estrutura inválida: lista de tarefas ("tasks") não encontrada ou corrompida.' };
  }
  if (!Array.isArray(obj.events)) {
    return { valid: false, error: 'Estrutura inválida: lista de eventos ("events") não encontrada ou corrompida.' };
  }

  // Sanitize tasks: verify elements have at least id and title
  const sanitizedTasks: Task[] = [];
  for (const t of obj.tasks) {
    if (t && typeof t === 'object' && typeof (t as any).id === 'string' && typeof (t as any).title === 'string') {
      const task = t as Task;
      sanitizedTasks.push({
        ...task,
        subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
        tags: Array.isArray(task.tags) ? task.tags : [],
        status: task.status === 'completed' || task.status === 'in_progress' ? task.status : 'pending',
        priority: task.priority || 'normal',
        category: task.category || 'Geral',
        recurrence: task.recurrence || 'none',
        createdAt: task.createdAt || new Date().toISOString(),
      });
    }
  }

  // Sanitize events
  const sanitizedEvents: CalendarEvent[] = [];
  for (const e of obj.events) {
    if (e && typeof e === 'object' && typeof (e as any).id === 'string' && typeof (e as any).title === 'string') {
      const evt = e as CalendarEvent;
      sanitizedEvents.push({
        ...evt,
        date: typeof evt.date === 'string' ? evt.date : new Date().toISOString().slice(0, 10),
        startTime: evt.startTime || '09:00',
        endTime: evt.endTime || '10:00',
        category: evt.category || 'Geral',
        isFixed: Boolean(evt.isFixed),
        completed: Boolean(evt.completed),
      });
    }
  }

  // Sanitize journal
  const sanitizedJournal: JournalEntry[] = [];
  if (Array.isArray(obj.journal)) {
    for (const j of obj.journal) {
      if (j && typeof j === 'object' && typeof (j as any).id === 'string') {
        const entry = j as JournalEntry;
        sanitizedJournal.push({
          ...entry,
          content: typeof entry.content === 'string' ? entry.content : '',
          date: entry.date || new Date().toISOString(),
          tags: Array.isArray(entry.tags) ? entry.tags : [],
          wordCount: typeof entry.wordCount === 'number' ? entry.wordCount : (entry.content || '').split(/\s+/).filter(Boolean).length,
        });
      }
    }
  }

  // Construct validated object preserving versioning and any custom fields
  const sanitized: AppStateData = {
    ...INITIAL_DEMO_DATA,
    ...(obj as any),
    version: CURRENT_SCHEMA_VERSION,
    lastUpdated: typeof obj.lastUpdated === 'string' ? obj.lastUpdated : new Date().toISOString(),
    tasks: sanitizedTasks,
    events: sanitizedEvents,
    journal: sanitizedJournal,
    habits: Array.isArray(obj.habits) ? (obj.habits as any) : INITIAL_DEMO_DATA.habits,
    projects: Array.isArray(obj.projects) ? (obj.projects as any) : INITIAL_DEMO_DATA.projects,
    goals: Array.isArray(obj.goals) ? (obj.goals as any) : INITIAL_DEMO_DATA.goals,
    areas: Array.isArray(obj.areas) ? (obj.areas as any) : INITIAL_DEMO_DATA.areas,
    dailyReviews: (obj.dailyReviews && typeof obj.dailyReviews === 'object') ? (obj.dailyReviews as any) : {},
    weeklyReviews: (obj.weeklyReviews && typeof obj.weeklyReviews === 'object') ? (obj.weeklyReviews as any) : {},
    preferences: {
      ...INITIAL_DEMO_DATA.preferences,
      ...((obj.preferences && typeof obj.preferences === 'object') ? (obj.preferences as any) : {}),
    },
  };

  return { valid: true, sanitizedData: sanitized };
}

/**
 * Merge two AppStateData objects without duplicating IDs or losing data.
 */
export function mergeAppStateData(current: AppStateData, incoming: AppStateData): AppStateData {
  const existingTaskIds = new Set(current.tasks.map((t) => t.id));
  const mergedTasks = [...current.tasks];
  for (const t of incoming.tasks) {
    if (!existingTaskIds.has(t.id)) {
      mergedTasks.push(t);
      existingTaskIds.add(t.id);
    }
  }

  const existingEventIds = new Set(current.events.map((e) => e.id));
  const mergedEvents = [...current.events];
  for (const e of incoming.events) {
    if (!existingEventIds.has(e.id)) {
      mergedEvents.push(e);
      existingEventIds.add(e.id);
    }
  }

  const existingJournalIds = new Set(current.journal.map((j) => j.id));
  const mergedJournal = [...current.journal];
  for (const j of incoming.journal) {
    if (!existingJournalIds.has(j.id)) {
      mergedJournal.push(j);
      existingJournalIds.add(j.id);
    }
  }

  const existingHabitIds = new Set(current.habits.map((h) => h.id));
  const mergedHabits = [...current.habits];
  for (const h of incoming.habits) {
    if (!existingHabitIds.has(h.id)) {
      mergedHabits.push(h);
      existingHabitIds.add(h.id);
    }
  }

  return {
    ...current,
    version: CURRENT_SCHEMA_VERSION,
    lastUpdated: new Date().toISOString(),
    tasks: mergedTasks,
    events: mergedEvents,
    journal: mergedJournal,
    habits: mergedHabits,
    dailyReviews: {
      ...current.dailyReviews,
      ...incoming.dailyReviews,
    },
    weeklyReviews: {
      ...current.weeklyReviews,
      ...incoming.weeklyReviews,
    },
  };
}

class HybridStorageService implements StorageService {
  /**
   * Synchronous load for initial React mount from localStorage.
   */
  load(): AppStateData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        this.saveSync(INITIAL_DEMO_DATA);
        // Also replicate to IndexedDB asynchronously
        indexedDBAdapter.set(INITIAL_DEMO_DATA).catch(() => {});
        return INITIAL_DEMO_DATA;
      }
      const parsed = JSON.parse(stored);
      const validation = validateAppStateData(parsed);
      if (validation.valid && validation.sanitizedData) {
        return validation.sanitizedData;
      }
      console.warn('Dados no localStorage com divergências estruturais; usando dados limpos.');
      return INITIAL_DEMO_DATA;
    } catch (err) {
      console.error('Falha ao ler dados de inicialização do localStorage:', err);
      return INITIAL_DEMO_DATA;
    }
  }

  /**
   * Asynchronous check with IndexedDB on mount. If IndexedDB contains newer/richer data, returns it.
   */
  async initAsync(): Promise<AppStateData | null> {
    try {
      const idbData = await indexedDBAdapter.get();
      if (idbData) {
        const val = validateAppStateData(idbData);
        if (val.valid && val.sanitizedData) {
          // Keep localStorage in sync if idb has newer version
          this.saveSync(val.sanitizedData);
          return val.sanitizedData;
        }
      } else {
        // First time IndexedDB is opened: seed it from current localStorage
        const currentLocal = this.load();
        await indexedDBAdapter.set(currentLocal);
      }
    } catch (err) {
      console.warn('Erro ao conectar com IndexedDB durante initAsync:', err);
    }
    return null;
  }

  /**
   * Synchronous fast save to localStorage. Returns true if successful.
   */
  saveSync(data: AppStateData): boolean {
    try {
      const updatedData: AppStateData = {
        ...data,
        version: CURRENT_SCHEMA_VERSION,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      return true;
    } catch (err) {
      console.error('Erro de gravação no localStorage (possível quota excedida):', err);
      return false;
    }
  }

  /**
   * Dual-layer transactional save: saves to localStorage and IndexedDB in parallel.
   */
  async save(data: AppStateData): Promise<boolean> {
    const updatedData: AppStateData = {
      ...data,
      version: CURRENT_SCHEMA_VERSION,
      lastUpdated: new Date().toISOString(),
    };

    let localSuccess = false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      localSuccess = true;
    } catch (err) {
      console.warn('Falha ao gravar no localStorage (possível quota):', err);
    }

    let idbSuccess = false;
    try {
      idbSuccess = await indexedDBAdapter.set(updatedData);
    } catch (err) {
      console.warn('Falha ao gravar no IndexedDB:', err);
    }

    // Success if at least one durable engine committed the state successfully
    return localSuccess || idbSuccess;
  }

  async clear(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('Erro ao remover do localStorage:', err);
    }
    try {
      await indexedDBAdapter.clear();
    } catch (err) {
      console.warn('Erro ao limpar IndexedDB:', err);
    }
  }

  exportJSON(): string {
    const data = this.load();
    const payload = {
      ...data,
      app: 'Life OS',
      exportDate: new Date().toISOString(),
      version: CURRENT_SCHEMA_VERSION,
    };
    return JSON.stringify(payload, null, 2);
  }

  validateBackup(jsonString: string): ValidationResult {
    try {
      const parsed = JSON.parse(jsonString);
      return validateAppStateData(parsed);
    } catch (err: any) {
      return {
        valid: false,
        error: `Formato de arquivo corrompido ou JSON inválido: ${err?.message || 'sintaxe incorreta'}`,
      };
    }
  }

  importJSON(
    jsonString: string,
    options: ImportOptions = { mode: 'replace' }
  ): { success: boolean; error?: string; data?: AppStateData } {
    const validation = this.validateBackup(jsonString);
    if (!validation.valid || !validation.sanitizedData) {
      return { success: false, error: validation.error || 'Arquivo de backup inválido.' };
    }

    const current = this.load();
    const finalData =
      options.mode === 'merge'
        ? mergeAppStateData(current, validation.sanitizedData)
        : validation.sanitizedData;

    const savedLocal = this.saveSync(finalData);
    indexedDBAdapter.set(finalData).catch((err) => console.warn('Erro idb import sync:', err));

    if (!savedLocal) {
      return {
        success: false,
        error: 'Não foi possível gravar os dados importados no armazenamento local (armazenamento cheio ou bloqueado).',
      };
    }

    return { success: true, data: finalData };
  }

  exportJournalMarkdown(): string {
    const data = this.load();
    if (!data.journal || data.journal.length === 0) {
      return '# Diário Pessoal\n\nNenhuma entrada registrada até o momento.';
    }

    const sorted = [...data.journal].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let md = `# Diário Pessoal — Life OS\n*Exportado em: ${new Date().toLocaleString('pt-BR')}*\n*Total de registros: ${sorted.length}*\n\n---\n\n`;

    sorted.forEach((entry) => {
      const dateStr = new Date(entry.date).toLocaleString('pt-BR', {
        dateStyle: 'full',
        timeStyle: 'short',
      });
      md += `## ${entry.title || 'Sem título'}\n`;
      md += `*${dateStr}* ${entry.mood ? `— Humor: ${entry.mood}` : ''}\n\n`;
      if (entry.tags && entry.tags.length > 0) {
        md += `Tags: ${entry.tags.map((t) => `#${t}`).join(' ')}\n\n`;
      }
      md += `${entry.content}\n\n`;
      if (entry.learnings) {
        md += `> **Aprendizado:** ${entry.learnings}\n\n`;
      }
      if (entry.highlights) {
        md += `> **Destaque:** ${entry.highlights}\n\n`;
      }
      md += `---\n\n`;
    });

    return md;
  }
}

export const storageService = new HybridStorageService();
