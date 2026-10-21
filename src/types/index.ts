export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  createdAt: string; // ISO string
  startDate?: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  plannedTime?: string; // HH:mm
  estimatedDuration?: number; // minutes
  priority: Priority;
  category: string; // e.g. "Trabalho", "Estudos", "Saúde", "Pessoal"
  projectId?: string;
  tags: string[];
  subtasks: Subtask[];
  status: TaskStatus;
  completedAt?: string;
  recurrence: RecurrenceType;
  notes?: string;
}

export type EventRecurrenceType = 'none' | 'daily' | 'weekly';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  category: string;
  color?: string;
  location?: string;
  taskId?: string; // Linked task
  projectId?: string;
  isFixed: boolean; // true = fixed appointment, false = time-block work
  completed?: boolean;
  // Recurrence fields (optional – old records default to 'none')
  recurrence?: EventRecurrenceType;
  recurrenceEndDate?: string; // YYYY-MM-DD
  recurrenceGroupId?: string; // shared ID for all occurrences of the same series
}

export interface JournalEntry {
  id: string;
  title?: string;
  content: string;
  date: string; // ISO string with timestamp
  mood?: 'great' | 'good' | 'neutral' | 'tired' | 'stressed' | 'down';
  tags: string[];
  learnings?: string;
  highlights?: string;
  projectId?: string;
  wordCount?: number;
}

export type HabitFrequency = 'daily' | 'weekdays' | 'custom';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: string;
  frequency: HabitFrequency;
  customDays?: number[]; // 0=Sunday, 1=Monday...
  preferredTime?: string; // HH:mm
  startDate: string; // YYYY-MM-DD
  archived?: boolean;
  history: Record<string, 'completed' | 'skipped' | 'failed'>; // key: YYYY-MM-DD
}

export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived';

export interface ProjectMilestone {
  id: string;
  title: string;
  dueDate?: string;
  completed: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  category: string; // Life area
  startDate: string; // YYYY-MM-DD
  targetDate?: string; // YYYY-MM-DD
  status: ProjectStatus;
  mainGoal: string;
  milestones: ProjectMilestone[];
  notes?: string;
  color?: string;
}

export interface LifeArea {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  timeframe: 'quarterly' | 'yearly' | 'long_term';
  category: string;
  targetDate?: string;
  projectIds: string[];
  completed: boolean;
}

export interface DailyReview {
  date: string; // YYYY-MM-DD
  completedTaskIds: string[];
  pendingTaskIds: string[];
  plannedMinutes: number;
  actualMinutes?: number;
  highlights: string;
  notes: string;
  nextDayPriorities: string[];
  updatedAt: string;
}

export interface WeeklyReview {
  weekKey: string; // e.g. "2026-W42"
  startDate: string;
  endDate: string;
  completedTasksCount: number;
  habitsScore: number; // percentage
  reflection: string;
  nextWeekGoals: string[];
  updatedAt: string;
}

export interface UserPreferences {
  userName: string;
  workStartHour: number; // default 8 (08:00)
  workEndHour: number; // default 18 (18:00)
  defaultTaskDuration: number; // default 30 mins
  focusTaskIds: string[]; // up to 3 task IDs for "Foco de hoje"
  currentMood?: 'great' | 'good' | 'neutral' | 'tired' | 'stressed' | 'down';
  theme: 'light' | 'dark' | 'system';
}

export interface AppStateData {
  version: number;
  lastUpdated: string;
  tasks: Task[];
  events: CalendarEvent[];
  journal: JournalEntry[];
  habits: Habit[];
  projects: Project[];
  goals: Goal[];
  areas: LifeArea[];
  dailyReviews: Record<string, DailyReview>;
  weeklyReviews: Record<string, WeeklyReview>;
  preferences: UserPreferences;
}
