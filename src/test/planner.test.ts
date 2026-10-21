import { describe, it, expect } from 'vitest';
import { planMyDay } from '../lib/planner';
import { Task, CalendarEvent } from '../types';

describe('Life OS - Day Planner Algorithm', () => {
  it('schedules tasks into available free windows and flags overload', () => {
    const fixedEvents: CalendarEvent[] = [
      {
        id: 'evt-fixed',
        title: 'Reunião Fixa',
        date: '2026-10-20',
        startTime: '09:00',
        endTime: '10:00',
        category: 'Trabalho',
        isFixed: true,
      },
    ];

    const tasks: Task[] = [
      {
        id: 'task-urgent',
        title: 'Tarefa Urgente',
        status: 'pending',
        priority: 'urgent',
        estimatedDuration: 60,
        category: 'Trabalho',
        createdAt: '2026-10-20',
        tags: [],
        subtasks: [],
        recurrence: 'none',
      },
      {
        id: 'task-normal',
        title: 'Tarefa Normal',
        status: 'pending',
        priority: 'normal',
        estimatedDuration: 60,
        category: 'Estudos',
        createdAt: '2026-10-20',
        tags: [],
        subtasks: [],
        recurrence: 'none',
      },
    ];

    // Work window: 08:00 to 12:00 (4 hours total = 240 mins).
    // Busy: 09:00-10:00 (60 mins). Free: 08:00-09:00 (60 mins), 10:00-12:00 (120 mins). Available = 180 mins.
    const result = planMyDay(tasks, fixedEvents, '2026-10-20', 8, 12, 60);

    expect(result.availableWorkMinutes).toBe(180);
    expect(result.scheduledSlots.length).toBe(2);
    expect(result.isOverloaded).toBe(false);

    // Urgent task should be prioritized first
    expect(result.scheduledSlots[0].task.id).toBe('task-urgent');
    expect(result.scheduledSlots[0].startTime).toBe('08:00');
    expect(result.scheduledSlots[0].endTime).toBe('09:00');

    // Next task fills slot after meeting (10:00)
    expect(result.scheduledSlots[1].task.id).toBe('task-normal');
    expect(result.scheduledSlots[1].startTime).toBe('10:00');
    expect(result.scheduledSlots[1].endTime).toBe('11:00');
  });

  it('detects when tasks exceed available hours and produces overload warning', () => {
    const tasks: Task[] = Array.from({ length: 10 }, (_, i) => ({
      id: `task-${i}`,
      title: `Tarefa ${i}`,
      status: 'pending',
      priority: 'high',
      estimatedDuration: 60,
      category: 'Geral',
      createdAt: '2026-10-20',
      tags: [],
      subtasks: [],
      recurrence: 'none',
    }));

    // Work window: 08:00 to 11:00 (3 hours = 180 mins). 10 tasks = 600 mins.
    const result = planMyDay(tasks, [], '2026-10-20', 8, 11, 60);

    expect(result.isOverloaded).toBe(true);
    expect(result.overloadMessage).toBeDefined();
    expect(result.scheduledSlots.length).toBe(3); // only 3 fit
    expect(result.unscheduledTasks.length).toBe(7); // 7 left out
  });
});
