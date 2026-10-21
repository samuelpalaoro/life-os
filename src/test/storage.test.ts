import { describe, it, expect, beforeEach } from 'vitest';
import { storageService, validateAppStateData, mergeAppStateData } from '../storage/storageService';
import { INITIAL_DEMO_DATA } from '../storage/initialData';
import { AppStateData } from '../types';

describe('Life OS - Persistence & Data Integrity Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads initial demo data when storage is empty', () => {
    const data = storageService.load();
    expect(data.tasks.length).toBeGreaterThan(0);
    expect(data.events.length).toBeGreaterThan(0);
    expect(data.areas.length).toBeGreaterThan(0);
    expect(data.version).toBe(2);
  });

  it('exports and validates imported JSON data with versioning', () => {
    const exportedJSON = storageService.exportJSON();
    expect(typeof exportedJSON).toBe('string');

    const result = storageService.importJSON(exportedJSON);
    expect(result.success).toBe(true);
    expect(result.data?.tasks.length).toBeGreaterThan(0);
    expect(result.data?.version).toBe(2);
  });

  it('rejects corrupt or invalid JSON imports gracefully without throwing', () => {
    const invalidSyntax = storageService.importJSON('{ invalid json syntax');
    expect(invalidSyntax.success).toBe(false);
    expect(invalidSyntax.error).toBeDefined();

    const wrongStructureRes = storageService.importJSON(JSON.stringify({ someField: 123 }));
    expect(wrongStructureRes.success).toBe(false);
    expect(wrongStructureRes.error).toContain('tasks');

    const nonObjectRes = storageService.importJSON(JSON.stringify(['item1', 'item2']));
    expect(nonObjectRes.success).toBe(false);
  });

  it('merges backup data correctly without duplicating IDs', () => {
    const current = storageService.load();
    const originalTaskCount = current.tasks.length;

    // Create an incoming backup with 1 new task and 1 duplicate task
    const incoming: AppStateData = {
      ...current,
      tasks: [
        current.tasks[0], // Duplicate ID
        {
          id: 'new-unique-task-999',
          title: 'Nova Tarefa do Backup',
          createdAt: new Date().toISOString(),
          status: 'pending',
          priority: 'high',
          category: 'Trabalho',
          recurrence: 'none',
          tags: ['backup'],
          subtasks: [],
        },
      ],
      journal: [
        {
          id: 'new-unique-journal-999',
          title: 'Pensamento Novo',
          content: 'Conteúdo vindo de outro dispositivo',
          date: new Date().toISOString(),
          tags: [],
        },
      ],
    };

    const merged = mergeAppStateData(current, incoming);
    // Should have only added the 1 unique task
    expect(merged.tasks.length).toBe(originalTaskCount + 1);
    expect(merged.tasks.find((t) => t.id === 'new-unique-task-999')).toBeDefined();
    expect(merged.journal.find((j) => j.id === 'new-unique-journal-999')).toBeDefined();
  });

  it('validates and sanitizes missing or malformed fields safely', () => {
    const malformed = {
      tasks: [
        { id: 't1', title: 'Tarefa 1' }, // Missing optional properties
        { bad: 'sem id nem title' }, // Should be dropped
      ],
      events: [
        { id: 'e1', title: 'Reunião' },
      ],
      journal: [
        { id: 'j1', content: 'Nota rápida' },
      ],
    };

    const result = validateAppStateData(malformed);
    expect(result.valid).toBe(true);
    expect(result.sanitizedData?.tasks.length).toBe(1);
    expect(result.sanitizedData?.tasks[0].id).toBe('t1');
    expect(result.sanitizedData?.tasks[0].status).toBe('pending');
    expect(result.sanitizedData?.events.length).toBe(1);
    expect(result.sanitizedData?.version).toBe(2);
  });

  it('generates markdown export of journal entries correctly', () => {
    const md = storageService.exportJournalMarkdown();
    expect(md).toContain('# Diário Pessoal');
    expect(md).toContain('Life OS');
  });
});
