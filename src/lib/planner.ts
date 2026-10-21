import { Task, CalendarEvent } from '../types';
import { timeToMinutes, minutesToTime, checkEventsOverlap } from './dateUtils';

export interface PlanSlotSuggestion {
  task: Task;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export interface DayPlanResult {
  scheduledSlots: PlanSlotSuggestion[];
  unscheduledTasks: Task[];
  availableWorkMinutes: number;
  totalTasksMinutes: number;
  isOverloaded: boolean;
  overloadMessage?: string;
}

const PRIORITY_SCORES: Record<string, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
};

/**
 * Deterministic day planner:
 * Analyzes fixed appointments & current events on the day, calculates free blocks,
 * ranks pending tasks by priority and due date, and assigns optimal time slots.
 */
export const planMyDay = (
  tasks: Task[],
  existingEvents: CalendarEvent[],
  targetDate: string,
  startHour: number = 8,
  endHour: number = 19,
  defaultDurationMinutes: number = 45
): DayPlanResult => {
  const dayEvents = existingEvents
    .filter((e) => e.date === targetDate)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const startDayMinutes = startHour * 60;
  const endDayMinutes = endHour * 60;
  const totalWorkWindow = endDayMinutes - startDayMinutes;

  // Compute busy blocks
  const busyBlocks: { start: number; end: number }[] = [];
  dayEvents.forEach((e) => {
    const s = Math.max(startDayMinutes, timeToMinutes(e.startTime));
    const end = Math.min(endDayMinutes, timeToMinutes(e.endTime));
    if (s < end) {
      busyBlocks.push({ start: s, end });
    }
  });

  // Calculate free time slots
  const freeSlots: { start: number; end: number; duration: number }[] = [];
  let currentPointer = startDayMinutes;

  busyBlocks.forEach((block) => {
    if (block.start > currentPointer) {
      freeSlots.push({
        start: currentPointer,
        end: block.start,
        duration: block.start - currentPointer,
      });
    }
    currentPointer = Math.max(currentPointer, block.end);
  });

  if (currentPointer < endDayMinutes) {
    freeSlots.push({
      start: currentPointer,
      end: endDayMinutes,
      duration: endDayMinutes - currentPointer,
    });
  }

  const availableWorkMinutes = freeSlots.reduce((acc, slot) => acc + slot.duration, 0);

  // Filter tasks eligible for today
  const eligibleTasks = tasks
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => {
      const scoreA = PRIORITY_SCORES[a.priority] || 1;
      const scoreB = PRIORITY_SCORES[b.priority] || 1;
      if (scoreA !== scoreB) return scoreB - scoreA;
      // Due date precedence
      if (a.dueDate && b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      return a.dueDate ? -1 : 1;
    });

  const totalTasksMinutes = eligibleTasks.reduce(
    (acc, t) => acc + (t.estimatedDuration || defaultDurationMinutes),
    0
  );

  const isOverloaded = totalTasksMinutes > availableWorkMinutes;
  const overloadMessage = isOverloaded
    ? `Você possui ${Math.round(totalTasksMinutes / 60)}h${totalTasksMinutes % 60}m de tarefas para apenas ${Math.round(availableWorkMinutes / 60)}h${availableWorkMinutes % 60}m de horários livres hoje. Algumas tarefas precisarão ser adiadas.`
    : undefined;

  const scheduledSlots: PlanSlotSuggestion[] = [];
  const unscheduledTasks: Task[] = [];

  // Clone free slots to allocate
  const remainingSlots = freeSlots.map((s) => ({ ...s }));

  for (const task of eligibleTasks) {
    const taskDuration = task.estimatedDuration || defaultDurationMinutes;
    let scheduled = false;

    // If task already has a plannedTime and fits without conflict
    if (task.plannedTime) {
      const plannedStart = timeToMinutes(task.plannedTime);
      const plannedEnd = plannedStart + taskDuration;

      const hasConflict = dayEvents.some((evt) =>
        checkEventsOverlap(
          { startTime: task.plannedTime!, endTime: minutesToTime(plannedEnd), date: targetDate },
          evt
        )
      );

      if (!hasConflict && plannedStart >= startDayMinutes && plannedEnd <= endDayMinutes) {
        scheduledSlots.push({
          task,
          startTime: task.plannedTime,
          endTime: minutesToTime(plannedEnd),
          durationMinutes: taskDuration,
        });
        scheduled = true;
        continue;
      }
    }

    // Find first fitting free slot
    for (const slot of remainingSlots) {
      if (slot.duration >= taskDuration) {
        const slotStart = slot.start;
        const slotEnd = slotStart + taskDuration;

        scheduledSlots.push({
          task,
          startTime: minutesToTime(slotStart),
          endTime: minutesToTime(slotEnd),
          durationMinutes: taskDuration,
        });

        // Update remaining slot
        slot.start = slotEnd;
        slot.duration = slot.end - slot.start;
        scheduled = true;
        break;
      }
    }

    if (!scheduled) {
      unscheduledTasks.push(task);
    }
  }

  return {
    scheduledSlots,
    unscheduledTasks,
    availableWorkMinutes,
    totalTasksMinutes,
    isOverloaded,
    overloadMessage,
  };
};
