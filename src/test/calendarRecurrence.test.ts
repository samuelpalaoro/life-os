import { describe, it, expect } from 'vitest';
import { CalendarEvent } from '../types';
import { checkEventsOverlap, findEventConflicts } from '../lib/dateUtils';

describe('Calendar Recurrence & Conflict Tests', () => {
  it('detects time overlap between events on the same date', () => {
    const event1 = {
      id: 'e1',
      title: 'Reunião Matinal',
      date: '2026-10-21',
      startTime: '09:00',
      endTime: '10:30',
      category: 'Trabalho',
      isFixed: true,
    };

    const event2 = {
      id: 'e2',
      title: 'Daily Standup',
      date: '2026-10-21',
      startTime: '10:00',
      endTime: '11:00',
      category: 'Trabalho',
      isFixed: true,
    };

    const overlaps = checkEventsOverlap(event1, event2);
    expect(overlaps).toBe(true);

    const conflicts = findEventConflicts(event1 as CalendarEvent, [event1 as CalendarEvent, event2 as CalendarEvent]);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].id).toBe('e2');
  });

  it('does not detect overlap between adjacent or different-day events', () => {
    const event1 = {
      id: 'e1',
      title: 'Bloco A',
      date: '2026-10-21',
      startTime: '09:00',
      endTime: '10:00',
      category: 'Trabalho',
      isFixed: false,
    };

    // Exactly contiguous
    const eventContiguous = {
      id: 'e2',
      title: 'Bloco B',
      date: '2026-10-21',
      startTime: '10:00',
      endTime: '11:00',
      category: 'Trabalho',
      isFixed: false,
    };

    // Different day
    const eventDifferentDay = {
      id: 'e3',
      title: 'Bloco C',
      date: '2026-10-22',
      startTime: '09:30',
      endTime: '10:30',
      category: 'Trabalho',
      isFixed: false,
    };

    expect(checkEventsOverlap(event1, eventContiguous)).toBe(false);
    expect(checkEventsOverlap(event1, eventDifferentDay)).toBe(false);
  });

  it('filters event series accurately by recurrenceGroupId', () => {
    const seriesId = 'rec-series-123456';
    const otherSeriesId = 'rec-series-789012';

    const events: CalendarEvent[] = [
      {
        id: 'e1',
        title: 'Daily Sync',
        date: '2026-10-21',
        startTime: '09:00',
        endTime: '09:30',
        category: 'Trabalho',
        isFixed: true,
        recurrence: 'daily',
        recurrenceGroupId: seriesId,
      },
      {
        id: 'e2',
        title: 'Daily Sync (Edição pontual)',
        date: '2026-10-22',
        startTime: '09:30',
        endTime: '10:00',
        category: 'Trabalho',
        isFixed: true,
        recurrence: 'daily',
        recurrenceGroupId: seriesId,
      },
      {
        id: 'e3',
        title: 'Weekly 1:1',
        date: '2026-10-21',
        startTime: '14:00',
        endTime: '15:00',
        category: 'Trabalho',
        isFixed: true,
        recurrence: 'weekly',
        recurrenceGroupId: otherSeriesId,
      },
      {
        id: 'e4',
        title: 'Almoço Avulso',
        date: '2026-10-21',
        startTime: '12:00',
        endTime: '13:00',
        category: 'Pessoal',
        isFixed: false,
      },
    ];

    // Simulating deleteEventSeries for seriesId
    const remainingAfterSeriesDelete = events.filter((e) => e.recurrenceGroupId !== seriesId);

    expect(remainingAfterSeriesDelete.length).toBe(2);
    expect(remainingAfterSeriesDelete.find((e) => e.id === 'e1')).toBeUndefined();
    expect(remainingAfterSeriesDelete.find((e) => e.id === 'e2')).toBeUndefined();
    expect(remainingAfterSeriesDelete.find((e) => e.id === 'e3')).toBeDefined();
    expect(remainingAfterSeriesDelete.find((e) => e.id === 'e4')).toBeDefined();
  });
});
