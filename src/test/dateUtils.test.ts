import { describe, it, expect } from 'vitest';
import {
  isTaskOverdue,
  calculateNextRecurrenceDate,
  timeToMinutes,
  minutesToTime,
  checkEventsOverlap,
} from '../lib/dateUtils';
import { Task } from '../types';

describe('Life OS - Date and Time Utilities', () => {
  it('converts time strings to minutes and back accurately', () => {
    expect(timeToMinutes('08:30')).toBe(510);
    expect(timeToMinutes('14:45')).toBe(885);
    expect(minutesToTime(510)).toBe('08:30');
    expect(minutesToTime(885)).toBe('14:45');
  });

  it('detects overlapping calendar events correctly', () => {
    const eventA = { startTime: '09:00', endTime: '10:00', date: '2026-10-20' };
    const eventB = { startTime: '09:30', endTime: '10:30', date: '2026-10-20' };
    const eventC = { startTime: '10:00', endTime: '11:00', date: '2026-10-20' };
    const eventOtherDay = { startTime: '09:00', endTime: '10:00', date: '2026-10-21' };

    expect(checkEventsOverlap(eventA, eventB)).toBe(true);
    expect(checkEventsOverlap(eventA, eventC)).toBe(false); // Adjacent is not overlap
    expect(checkEventsOverlap(eventA, eventOtherDay)).toBe(false);
  });

  it('calculates overdue tasks correctly', () => {
    const refDate = new Date('2026-10-20T12:00:00Z');

    const pastTask: Task = {
      id: 't-past',
      title: 'Tarefa passada',
      dueDate: '2026-10-18',
      status: 'pending',
      priority: 'normal',
      category: 'Geral',
      createdAt: '2026-10-10',
      tags: [],
      subtasks: [],
      recurrence: 'none',
    };

    const completedTask: Task = {
      ...pastTask,
      id: 't-comp',
      status: 'completed',
    };

    const futureTask: Task = {
      ...pastTask,
      id: 't-future',
      dueDate: '2026-10-22',
    };

    expect(isTaskOverdue(pastTask, refDate)).toBe(true);
    expect(isTaskOverdue(completedTask, refDate)).toBe(false); // Completed tasks are never overdue
    expect(isTaskOverdue(futureTask, refDate)).toBe(false);
  });

  it('calculates next recurrence dates without corrupting records', () => {
    // Daily
    expect(calculateNextRecurrenceDate('2026-10-20', 'daily')).toBe('2026-10-21');
    // Weekly
    expect(calculateNextRecurrenceDate('2026-10-20', 'weekly')).toBe('2026-10-27');
    // Weekdays skips weekends: 2026-10-23 is Friday -> next should be 2026-10-26 (Monday)
    expect(calculateNextRecurrenceDate('2026-10-23', 'weekdays')).toBe('2026-10-26');
  });
});
