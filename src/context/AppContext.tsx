import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  AppStateData,
  Task,
  TaskStatus,
  CalendarEvent,
  JournalEntry,
  Habit,
  Project,
  Goal,
  LifeArea,
  DailyReview,
  WeeklyReview,
  UserPreferences,
} from '../types';
import { storageService } from '../storage/storageService';
import { calculateNextRecurrenceDate, getTodayKey } from '../lib/dateUtils';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AppContextType {
  state: AppStateData;
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  saveErrorMessage?: string;
  // Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  duplicateTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;

  // Calendar
  addEvent: (event: Omit<CalendarEvent, 'id'>) => CalendarEvent;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  deleteEventSeries: (recurrenceGroupId: string) => void;
  toggleEventCompleted: (id: string) => void;
  associateTaskToCalendar: (task: Task, date: string, startTime: string, durationMinutes?: number) => CalendarEvent;

  // Journal
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'date'> & { date?: string }) => JournalEntry;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;

  // Habits
  addHabit: (habit: Omit<Habit, 'id' | 'history'>) => Habit;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  recordHabitStatus: (id: string, date: string, status: 'completed' | 'skipped' | 'failed') => void;

  // Projects & Goals
  addProject: (project: Omit<Project, 'id'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  // Life Areas
  addArea: (name: string, color: string) => LifeArea;
  updateArea: (id: string, updates: Partial<LifeArea>) => void;
  deleteArea: (id: string) => void;

  // Reviews
  saveDailyReview: (review: DailyReview) => void;
  saveWeeklyReview: (review: WeeklyReview) => void;

  // Preferences & Quick Actions
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  setFocusTaskIds: (ids: string[]) => void;
  setCurrentMood: (mood: UserPreferences['currentMood']) => void;
  toggleTheme: () => void;

  // Backup & Storage
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string, mode?: 'replace' | 'merge') => { success: boolean; error?: string };
  exportJournalMD: () => string;
  resetAllData: () => void;

  // UI Navigation
  currentView: string;
  setCurrentView: (view: string) => void;
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
  quickAddDefaultTab: 'task' | 'event' | 'journal' | 'habit' | 'project';
  openQuickAdd: (tab?: 'task' | 'event' | 'journal' | 'habit' | 'project') => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppStateData>(() => storageService.load());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(() => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | undefined>(undefined);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [quickAddOpen, setQuickAddOpen] = useState<boolean>(false);
  const [quickAddDefaultTab, setQuickAddDefaultTab] = useState<'task' | 'event' | 'journal' | 'habit' | 'project'>('task');
  const [searchOpen, setSearchOpen] = useState<boolean>(false);

  // Load latest state from IndexedDB on startup if available
  useEffect(() => {
    let isMounted = true;
    storageService.initAsync().then((idbData) => {
      if (isMounted && idbData) {
        setState(idbData);
      }
    }).catch((err) => {
      console.warn('initAsync aviso:', err);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Flush any pending state when user is about to close or navigate away
  useEffect(() => {
    const handleBeforeUnload = () => {
      storageService.saveSync(state);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state]);

  // Persist state updates with explicit transactional status and error handling
  const updateState = useCallback((updater: (prev: AppStateData) => AppStateData) => {
    setState((prev) => {
      const next = updater(prev);
      setSaveStatus('saving');
      
      // Save synchronously first to localStorage (immediate insurance)
      const syncOk = storageService.saveSync(next);
      
      // Asynchronously persist to IndexedDB
      storageService.save(next).then((ok) => {
        if (ok || syncOk) {
          setSaveStatus('saved');
          setSaveErrorMessage(undefined);
          setLastSavedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        } else {
          setSaveStatus('error');
          setSaveErrorMessage('Falha ao persistir no armazenamento do navegador (espaço cheio ou restrição).');
        }
      }).catch((err) => {
        if (syncOk) {
          setSaveStatus('saved');
        } else {
          setSaveStatus('error');
          setSaveErrorMessage(err?.message || 'Erro inesperado na gravação.');
        }
      });

      return next;
    });
  }, []);

  // Auto-sync theme to DOM
  useEffect(() => {
    const isDark =
      state.preferences.theme === 'dark' ||
      (state.preferences.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.preferences.theme]);

  // Keyboard shortcut listener (Cmd/Ctrl + K for search, Cmd/Ctrl + N for quick add)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setQuickAddDefaultTab('task');
        setQuickAddOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- TASK ACTIONS ---
  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt'>): Task => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    updateState((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));
    return newTask;
  }, [updateState]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  }, [updateState]);

  const deleteTask = useCallback((id: string) => {
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
      preferences: {
        ...prev.preferences,
        focusTaskIds: prev.preferences.focusTaskIds.filter((tid) => tid !== id),
      },
    }));
  }, [updateState]);

  const duplicateTask = useCallback((id: string) => {
    updateState((prev) => {
      const existing = prev.tasks.find((t) => t.id === id);
      if (!existing) return prev;
      const copy: Task = {
        ...existing,
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: `${existing.title} (Cópia)`,
        createdAt: new Date().toISOString(),
        status: 'pending',
        completedAt: undefined,
      };
      return {
        ...prev,
        tasks: [copy, ...prev.tasks],
      };
    });
  }, [updateState]);

  const toggleTaskStatus = useCallback((id: string) => {
    updateState((prev) => {
      const task = prev.tasks.find((t) => t.id === id);
      if (!task) return prev;

      const isCompleted = task.status === 'completed';
      const newStatus: TaskStatus = isCompleted ? 'pending' : 'completed';
      const completedAt = isCompleted ? undefined : new Date().toISOString();

      let updatedTasks = prev.tasks.map((t) =>
        t.id === id ? { ...t, status: newStatus, completedAt } : t
      );

      // Handle recurrence when completing
      if (!isCompleted && task.recurrence && task.recurrence !== 'none') {
        const nextDueDate = calculateNextRecurrenceDate(
          task.dueDate || getTodayKey(),
          task.recurrence
        );
        const recurringTask: Task = {
          ...task,
          id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          dueDate: nextDueDate,
          status: 'pending',
          completedAt: undefined,
          createdAt: new Date().toISOString(),
          subtasks: task.subtasks.map((st) => ({ ...st, completed: false })),
        };
        updatedTasks = [recurringTask, ...updatedTasks];
      }

      return {
        ...prev,
        tasks: updatedTasks,
      };
    });
  }, [updateState]);

  // --- CALENDAR ACTIONS ---
  const addEvent = useCallback((eventData: Omit<CalendarEvent, 'id'>): CalendarEvent => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    updateState((prev) => ({
      ...prev,
      events: [...prev.events, newEvent],
    }));
    return newEvent;
  }, [updateState]);

  const updateEvent = useCallback((id: string, updates: Partial<CalendarEvent>) => {
    updateState((prev) => ({
      ...prev,
      events: prev.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  }, [updateState]);

  const deleteEvent = useCallback((id: string) => {
    updateState((prev) => ({
      ...prev,
      events: prev.events.filter((e) => e.id !== id),
    }));
  }, [updateState]);

  const deleteEventSeries = useCallback((recurrenceGroupId: string) => {
    updateState((prev) => ({
      ...prev,
      events: prev.events.filter((e) => e.recurrenceGroupId !== recurrenceGroupId),
    }));
  }, [updateState]);

  const toggleEventCompleted = useCallback((id: string) => {
    updateState((prev) => ({
      ...prev,
      events: prev.events.map((e) =>
        e.id === id ? { ...e, completed: !e.completed } : e
      ),
    }));
  }, [updateState]);

  const associateTaskToCalendar = useCallback((
    task: Task,
    date: string,
    startTime: string,
    durationMinutes: number = 45
  ): CalendarEvent => {
    const [h, m] = startTime.split(':').map(Number);
    const startMins = h * 60 + m;
    const endMins = startMins + durationMinutes;
    const endH = Math.floor(endMins / 60);
    const endM = endMins % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    const newEvent: CalendarEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: task.title,
      description: task.description,
      date,
      startTime,
      endTime,
      category: task.category,
      taskId: task.id,
      projectId: task.projectId,
      isFixed: false,
      completed: task.status === 'completed',
    };

    updateState((prev) => ({
      ...prev,
      events: [...prev.events, newEvent],
      tasks: prev.tasks.map((t) =>
        t.id === task.id ? { ...t, plannedTime: startTime, dueDate: date } : t
      ),
    }));

    return newEvent;
  }, [updateState]);

  // --- JOURNAL ACTIONS ---
  const addJournalEntry = useCallback((
    entryData: Omit<JournalEntry, 'id' | 'date'> & { date?: string }
  ): JournalEntry => {
    const words = entryData.content.trim().split(/\s+/).filter(Boolean).length;
    const newEntry: JournalEntry = {
      ...entryData,
      id: `jrn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: entryData.date || new Date().toISOString(),
      wordCount: words,
    };
    updateState((prev) => ({
      ...prev,
      journal: [newEntry, ...prev.journal],
    }));
    return newEntry;
  }, [updateState]);

  const updateJournalEntry = useCallback((id: string, updates: Partial<JournalEntry>) => {
    updateState((prev) => ({
      ...prev,
      journal: prev.journal.map((j) => {
        if (j.id !== id) return j;
        const newContent = updates.content !== undefined ? updates.content : j.content;
        const wordCount = newContent.trim().split(/\s+/).filter(Boolean).length;
        return { ...j, ...updates, wordCount };
      }),
    }));
  }, [updateState]);

  const deleteJournalEntry = useCallback((id: string) => {
    updateState((prev) => ({
      ...prev,
      journal: prev.journal.filter((j) => j.id !== id),
    }));
  }, [updateState]);

  // --- HABIT ACTIONS ---
  const addHabit = useCallback((habitData: Omit<Habit, 'id' | 'history'>): Habit => {
    const newHabit: Habit = {
      ...habitData,
      id: `hb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      history: {},
    };
    updateState((prev) => ({
      ...prev,
      habits: [...prev.habits, newHabit],
    }));
    return newHabit;
  }, [updateState]);

  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    updateState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    }));
  }, [updateState]);

  const deleteHabit = useCallback((id: string) => {
    updateState((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== id),
    }));
  }, [updateState]);

  const recordHabitStatus = useCallback((
    id: string,
    date: string,
    status: 'completed' | 'skipped' | 'failed'
  ) => {
    updateState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id !== id) return h;
        const currentVal = h.history[date];
        const nextHistory = { ...h.history };
        if (currentVal === status) {
          delete nextHistory[date]; // toggle off
        } else {
          nextHistory[date] = status;
        }
        return { ...h, history: nextHistory };
      }),
    }));
  }, [updateState]);

  // --- PROJECTS & GOALS ACTIONS ---
  const addProject = useCallback((projectData: Omit<Project, 'id'>): Project => {
    const newProject: Project = {
      ...projectData,
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    updateState((prev) => ({
      ...prev,
      projects: [...prev.projects, newProject],
    }));
    return newProject;
  }, [updateState]);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    updateState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  }, [updateState]);

  const deleteProject = useCallback((id: string) => {
    updateState((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
      tasks: prev.tasks.map((t) => (t.projectId === id ? { ...t, projectId: undefined } : t)),
    }));
  }, [updateState]);

  const addGoal = useCallback((goalData: Omit<Goal, 'id'>): Goal => {
    const newGoal: Goal = {
      ...goalData,
      id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    updateState((prev) => ({
      ...prev,
      goals: [...prev.goals, newGoal],
    }));
    return newGoal;
  }, [updateState]);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    updateState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
  }, [updateState]);

  const deleteGoal = useCallback((id: string) => {
    updateState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }));
  }, [updateState]);

  // --- LIFE AREAS ACTIONS ---
  const addArea = useCallback((name: string, color: string): LifeArea => {
    const newArea: LifeArea = {
      id: `area-${Date.now()}`,
      name,
      color,
    };
    updateState((prev) => ({
      ...prev,
      areas: [...prev.areas, newArea],
    }));
    return newArea;
  }, [updateState]);

  const updateArea = useCallback((id: string, updates: Partial<LifeArea>) => {
    updateState((prev) => ({
      ...prev,
      areas: prev.areas.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  }, [updateState]);

  const deleteArea = useCallback((id: string) => {
    updateState((prev) => ({
      ...prev,
      areas: prev.areas.filter((a) => a.id !== id),
    }));
  }, [updateState]);

  // --- REVIEWS ---
  const saveDailyReview = useCallback((review: DailyReview) => {
    updateState((prev) => ({
      ...prev,
      dailyReviews: {
        ...prev.dailyReviews,
        [review.date]: review,
      },
    }));
  }, [updateState]);

  const saveWeeklyReview = useCallback((review: WeeklyReview) => {
    updateState((prev) => ({
      ...prev,
      weeklyReviews: {
        ...prev.weeklyReviews,
        [review.weekKey]: review,
      },
    }));
  }, [updateState]);

  // --- PREFERENCES ---
  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    updateState((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        ...updates,
      },
    }));
  }, [updateState]);

  const setFocusTaskIds = useCallback((ids: string[]) => {
    updatePreferences({ focusTaskIds: ids.slice(0, 3) });
  }, [updatePreferences]);

  const setCurrentMood = useCallback((mood: UserPreferences['currentMood']) => {
    updatePreferences({ currentMood: mood });
  }, [updatePreferences]);

  const toggleTheme = useCallback(() => {
    const next = state.preferences.theme === 'dark' ? 'light' : 'dark';
    updatePreferences({ theme: next });
  }, [state.preferences.theme, updatePreferences]);

  // --- BACKUP & EXPORT ---
  const exportDataJSON = useCallback(() => {
    return storageService.exportJSON();
  }, []);

  const importDataJSON = useCallback((jsonStr: string, mode: 'replace' | 'merge' = 'replace') => {
    const res = storageService.importJSON(jsonStr, { mode });
    if (res.success && res.data) {
      setState(res.data);
      setSaveStatus('saved');
      setLastSavedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }
    return res;
  }, []);

  const exportJournalMD = useCallback(() => {
    return storageService.exportJournalMarkdown();
  }, []);

  const resetAllData = useCallback(() => {
    storageService.clear();
    const fresh = storageService.load();
    setState(fresh);
  }, []);

  const openQuickAdd = useCallback((tab: 'task' | 'event' | 'journal' | 'habit' | 'project' = 'task') => {
    setQuickAddDefaultTab(tab);
    setQuickAddOpen(true);
  }, []);

  const contextValue = useMemo<AppContextType>(
    () => ({
      state,
      saveStatus,
      lastSavedAt,
      saveErrorMessage,
      addTask,
      updateTask,
      deleteTask,
      duplicateTask,
      toggleTaskStatus,
      addEvent,
      updateEvent,
      deleteEvent,
      deleteEventSeries,
      toggleEventCompleted,
      associateTaskToCalendar,
      addJournalEntry,
      updateJournalEntry,
      deleteJournalEntry,
      addHabit,
      updateHabit,
      deleteHabit,
      recordHabitStatus,
      addProject,
      updateProject,
      deleteProject,
      addGoal,
      updateGoal,
      deleteGoal,
      addArea,
      updateArea,
      deleteArea,
      saveDailyReview,
      saveWeeklyReview,
      updatePreferences,
      setFocusTaskIds,
      setCurrentMood,
      toggleTheme,
      exportDataJSON,
      importDataJSON,
      exportJournalMD,
      resetAllData,
      currentView,
      setCurrentView,
      quickAddOpen,
      setQuickAddOpen,
      quickAddDefaultTab,
      openQuickAdd,
      searchOpen,
      setSearchOpen,
    }),
    [
      state,
      saveStatus,
      lastSavedAt,
      saveErrorMessage,
      addTask,
      updateTask,
      deleteTask,
      duplicateTask,
      toggleTaskStatus,
      addEvent,
      updateEvent,
      deleteEvent,
      deleteEventSeries,
      toggleEventCompleted,
      associateTaskToCalendar,
      addJournalEntry,
      updateJournalEntry,
      deleteJournalEntry,
      addHabit,
      updateHabit,
      deleteHabit,
      recordHabitStatus,
      addProject,
      updateProject,
      deleteProject,
      addGoal,
      updateGoal,
      deleteGoal,
      addArea,
      updateArea,
      deleteArea,
      saveDailyReview,
      saveWeeklyReview,
      updatePreferences,
      setFocusTaskIds,
      setCurrentMood,
      toggleTheme,
      exportDataJSON,
      importDataJSON,
      exportJournalMD,
      resetAllData,
      currentView,
      quickAddOpen,
      quickAddDefaultTab,
      openQuickAdd,
      searchOpen,
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser utilizado dentro de um AppProvider');
  }
  return context;
};
