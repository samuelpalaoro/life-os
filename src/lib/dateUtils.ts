import { format, parseISO, isAfter, isBefore, startOfDay, addDays, addWeeks, addMonths, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Task, CalendarEvent, RecurrenceType } from '../types';

export const formatDateBR = (date: Date | string, formatStr: string = 'dd/MM/yyyy'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: ptBR });
};

export const getTodayKey = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

export const isTaskOverdue = (task: Task, referenceDate: Date = new Date()): boolean => {
  if (task.status === 'completed' || !task.dueDate) return false;
  const dueDate = parseISO(task.dueDate);
  return isBefore(dueDate, startOfDay(referenceDate));
};

export const isTaskDueToday = (task: Task, referenceDate: Date = new Date()): boolean => {
  if (!task.dueDate) return false;
  const dueDate = parseISO(task.dueDate);
  return isToday(dueDate);
};

export const calculateNextRecurrenceDate = (currentDateStr: string, recurrence: RecurrenceType): string => {
  const date = parseISO(currentDateStr);
  let nextDate = date;

  switch (recurrence) {
    case 'daily':
      nextDate = addDays(date, 1);
      break;
    case 'weekdays': {
      let d = addDays(date, 1);
      // Skip Saturday (6) and Sunday (0)
      while (d.getDay() === 0 || d.getDay() === 6) {
        d = addDays(d, 1);
      }
      nextDate = d;
      break;
    }
    case 'weekly':
      nextDate = addWeeks(date, 1);
      break;
    case 'monthly':
      nextDate = addMonths(date, 1);
      break;
    default:
      return currentDateStr;
  }

  return format(nextDate, 'yyyy-MM-dd');
};

export const timeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const checkEventsOverlap = (
  event1: { startTime: string; endTime: string; date: string },
  event2: { startTime: string; endTime: string; date: string }
): boolean => {
  if (event1.date !== event2.date) return false;
  const start1 = timeToMinutes(event1.startTime);
  const end1 = timeToMinutes(event1.endTime);
  const start2 = timeToMinutes(event2.startTime);
  const end2 = timeToMinutes(event2.endTime);

  return Math.max(start1, start2) < Math.min(end1, end2);
};

export const findEventConflicts = (event: CalendarEvent, allEvents: CalendarEvent[]): CalendarEvent[] => {
  return allEvents.filter((other) => {
    if (other.id === event.id) return false;
    return checkEventsOverlap(event, other);
  });
};
