import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  Trash2,
  CalendarDays,
  X,
  RefreshCw,
  Edit3,
  AlertTriangle,
  Eye,
  EyeOff,
  GripVertical,
} from 'lucide-react';
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  eachWeekOfInterval,
  getYear,
  setYear,
  isSameMonth,
  isSameWeek,
  isToday,
  parseISO,
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  getDay,
  isSameDay,
  isValid,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useApp } from '../../context/AppContext';
import { getTodayKey, checkEventsOverlap, findEventConflicts, timeToMinutes } from '../../lib/dateUtils';
import { CalendarEvent, EventRecurrenceType } from '../../types';
import confetti from 'canvas-confetti';

// ─── Types ───────────────────────────────────────────────────────────────────

type ViewMode = 'day' | 'week' | 'month';

interface EventFormState {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  taskId: string;
  isFixed: boolean;
  recurrence: EventRecurrenceType;
  recurrenceEndDate: string;
}

// ─── Recurrence helpers ───────────────────────────────────────────────────────

function generateRecurringOccurrences(
  baseEvent: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  const { recurrence, recurrenceEndDate, recurrenceGroupId } = baseEvent;
  if (!recurrence || recurrence === 'none' || !recurrenceGroupId) return [];

  const results: CalendarEvent[] = [];
  const endBound = recurrenceEndDate ? parseISO(recurrenceEndDate) : rangeEnd;
  const clampedEnd = endBound < rangeEnd ? endBound : rangeEnd;

  let cursor = parseISO(baseEvent.date);
  // Advance past the base event date itself (it is stored as a concrete record)
  if (recurrence === 'daily') cursor = addDays(cursor, 1);
  else if (recurrence === 'weekly') cursor = addWeeks(cursor, 1);

  let safety = 0;
  while (cursor <= clampedEnd && safety < 400) {
    safety++;
    if (cursor >= rangeStart) {
      results.push({
        ...baseEvent,
        id: `${recurrenceGroupId}-${format(cursor, 'yyyy-MM-dd')}`,
        date: format(cursor, 'yyyy-MM-dd'),
        // Virtual occurrences are never individually "base" records
        recurrenceGroupId: recurrenceGroupId,
      });
    }
    if (recurrence === 'daily') cursor = addDays(cursor, 1);
    else if (recurrence === 'weekly') cursor = addWeeks(cursor, 1);
  }
  return results;
}

/**
 * Expand stored events + virtual recurring occurrences for a given date range.
 * Deduplicates by (groupId + date) so stored individual edits take precedence.
 */
function resolveEventsInRange(
  storedEvents: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  // Separate base (recurrence-defining) events from regular events
  const baseRecurring = storedEvents.filter(
    (e) => e.recurrence && e.recurrence !== 'none' && e.recurrenceGroupId
  );

  // Virtual occurrences from recurrence patterns
  const virtual: CalendarEvent[] = [];
  for (const base of baseRecurring) {
    virtual.push(...generateRecurringOccurrences(base, rangeStart, rangeEnd));
  }

  // Build a set of real stored (date+groupId) combos to avoid duplicates
  const storedKeys = new Set(
    storedEvents
      .filter((e) => e.recurrenceGroupId)
      .map((e) => `${e.recurrenceGroupId}::${e.date}`)
  );

  // Filter virtual occurrences that don't have a stored counterpart
  const filteredVirtual = virtual.filter(
    (v) => !storedKeys.has(`${v.recurrenceGroupId}::${v.date}`)
  );

  // Combine and filter to range
  return [...storedEvents, ...filteredVirtual].filter((e) => {
    const d = parseISO(e.date);
    return d >= rangeStart && d <= rangeEnd;
  });
}

// ─── ScheduleView ─────────────────────────────────────────────────────────────

export const ScheduleView: React.FC = () => {
  const {
    state,
    addEvent,
    updateEvent,
    deleteEvent,
    deleteEventSeries,
    toggleEventCompleted,
  } = useApp();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Form state (create / edit)
  const [showAddForm, setShowAddForm] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<CalendarEvent[]>([]);
  const [conflictOverride, setConflictOverride] = useState(false);

  const defaultForm = (): EventFormState => ({
    title: '',
    date: format(currentDate, 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    taskId: '',
    isFixed: false,
    recurrence: 'none',
    recurrenceEndDate: '',
  });

  const [form, setForm] = useState<EventFormState>(defaultForm);

  // Drag & Drop state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragSourceRef = useRef<{ date: string; startTime: string; endTime: string } | null>(null);

  const yearPickerRef = useRef<HTMLDivElement>(null);
  const todayKey = getTodayKey();
  const today = new Date();
  const selectedDateStr = format(currentDate, 'yyyy-MM-dd');
  const currentYear = getYear(currentDate);

  // All months of the current year
  const months = eachMonthOfInterval({
    start: startOfYear(currentDate),
    end: endOfYear(currentDate),
  });

  // All weeks of the current year
  const weeksOfYear = eachWeekOfInterval(
    { start: startOfYear(currentDate), end: endOfYear(currentDate) },
    { weekStartsOn: 1 }
  );

  // Week interval
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Month interval
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handlePrev = () => {
    setCurrentDate((d) => {
      if (viewMode === 'day') return subDays(d, 1);
      if (viewMode === 'week') return subWeeks(d, 1);
      return subMonths(d, 1);
    });
    setShowYearPicker(false);
  };

  const handleNext = () => {
    setCurrentDate((d) => {
      if (viewMode === 'day') return addDays(d, 1);
      if (viewMode === 'week') return addWeeks(d, 1);
      return addMonths(d, 1);
    });
    setShowYearPicker(false);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setShowYearPicker(false);
  };

  const handleJumpToWeek = (weekStart: Date) => {
    setCurrentDate(weekStart);
    setShowYearPicker(false);
    setViewMode('week');
  };

  const handleYearChange = (delta: number) => {
    setCurrentDate((d) => setYear(d, getYear(d) + delta));
  };

  const handleSwitchView = (mode: ViewMode) => {
    setViewMode(mode);
    setShowYearPicker(false);
  };

  // ── Event resolving ─────────────────────────────────────────────────────────

  // Expand events for the visible range
  const visibleEvents = useMemo(() => {
    const rangeStart = viewMode === 'day' ? parseISO(selectedDateStr)
      : viewMode === 'week' ? weekStart
      : monthStart;
    const rangeEnd = viewMode === 'day' ? parseISO(selectedDateStr)
      : viewMode === 'week' ? weekEnd
      : monthEnd;
    return resolveEventsInRange(state.events, rangeStart, rangeEnd);
  }, [state.events, selectedDateStr, viewMode, weekStart, weekEnd, monthStart, monthEnd]);

  const dayEvents = useMemo(() =>
    visibleEvents
      .filter((e) => e.date === selectedDateStr)
      .filter((e) => showCompleted || !e.completed)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [visibleEvents, selectedDateStr, showCompleted]
  );

  const eventsForDay = useCallback((dateStr: string) =>
    visibleEvents
      .filter((e) => e.date === dateStr)
      .filter((e) => showCompleted || !e.completed)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [visibleEvents, showCompleted]
  );

  const completedCount = useMemo(() =>
    dayEvents.filter((e) => e.completed).length,
    [dayEvents]
  );

  // ── Conflict detection ──────────────────────────────────────────────────────

  const detectConflicts = useCallback(
    (proposed: { date: string; startTime: string; endTime: string }, excludeId?: string): CalendarEvent[] => {
      return state.events.filter((e) => {
        if (e.id === excludeId) return false;
        if (e.date !== proposed.date) return false;
        return checkEventsOverlap(e, proposed);
      });
    },
    [state.events]
  );

  // ── Form handlers ───────────────────────────────────────────────────────────

  const openCreateForm = (date?: string) => {
    setEditingEvent(null);
    setForm({ ...defaultForm(), date: date || selectedDateStr });
    setConflictWarning([]);
    setConflictOverride(false);
    setShowAddForm(true);
  };

  const openEditForm = (evt: CalendarEvent) => {
    // Virtual recurring occurrences reference real base event
    const realEvt = state.events.find((e) => e.id === evt.id) || evt;
    setEditingEvent(realEvt);
    setForm({
      title: realEvt.title,
      date: realEvt.date,
      startTime: realEvt.startTime,
      endTime: realEvt.endTime,
      taskId: realEvt.taskId || '',
      isFixed: realEvt.isFixed,
      recurrence: realEvt.recurrence || 'none',
      recurrenceEndDate: realEvt.recurrenceEndDate || '',
    });
    setConflictWarning([]);
    setConflictOverride(false);
    setShowAddForm(true);
  };

  const handleFormChange = (field: keyof EventFormState, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-push end time if start > end
      if (field === 'startTime' && typeof value === 'string') {
        const sm = timeToMinutes(value);
        const em = timeToMinutes(next.endTime);
        if (sm >= em) {
          const newEnd = sm + 60;
          const h = Math.floor(newEnd / 60) % 24;
          const m = newEnd % 60;
          next.endTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }
      }
      return next;
    });
    setConflictWarning([]);
    setConflictOverride(false);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    // Validate start < end
    if (timeToMinutes(form.startTime) >= timeToMinutes(form.endTime)) {
      setConflictWarning([]);
      return;
    }

    // Check conflicts
    const conflicts = detectConflicts(
      { date: form.date, startTime: form.startTime, endTime: form.endTime },
      editingEvent?.id
    );
    if (conflicts.length > 0 && !conflictOverride) {
      setConflictWarning(conflicts);
      return;
    }

    if (editingEvent) {
      updateEvent(editingEvent.id, {
        title: form.title.trim(),
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        taskId: form.taskId || undefined,
        isFixed: form.isFixed,
        recurrence: form.recurrence,
        recurrenceEndDate: form.recurrenceEndDate || undefined,
      });
    } else {
      const groupId =
        form.recurrence !== 'none'
          ? `rgrp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
          : undefined;
      addEvent({
        title: form.title.trim(),
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        category: 'Geral',
        isFixed: form.isFixed,
        taskId: form.taskId || undefined,
        recurrence: form.recurrence,
        recurrenceEndDate: form.recurrenceEndDate || undefined,
        recurrenceGroupId: groupId,
      });
    }

    setShowAddForm(false);
    setEditingEvent(null);
    setForm(defaultForm());
    setConflictWarning([]);
    setConflictOverride(false);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingEvent(null);
    setForm(defaultForm());
    setConflictWarning([]);
    setConflictOverride(false);
  };

  // ── Toggle completed ────────────────────────────────────────────────────────

  const handleToggleEvent = (id: string, currentlyDone?: boolean) => {
    // For virtual occurrences, we need to handle via the real stored event or toggle by ID (they share same structure)
    toggleEventCompleted(id);
    if (!currentlyDone) {
      confetti({ particleCount: 25, spread: 45, origin: { y: 0.8 }, colors: ['#754DF6', '#10B981', '#F6533C'] });
    }
  };

  // ── Delete handlers ─────────────────────────────────────────────────────────

  const handleDeleteEvent = (evt: CalendarEvent) => {
    if (evt.recurrenceGroupId && evt.recurrence && evt.recurrence !== 'none') {
      // It's the base event — ask whether to delete series or just this occurrence
      const choice = window.confirm(
        `"${evt.title}" é um evento recorrente.\n\nOK → Excluir a série inteira\nCancelar → Excluir apenas esta ocorrência`
      );
      if (choice) {
        deleteEventSeries(evt.recurrenceGroupId);
      } else {
        deleteEvent(evt.id);
      }
    } else {
      deleteEvent(evt.id);
    }
  };

  // ── Drag & Drop ─────────────────────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent, evt: CalendarEvent) => {
    setDraggingId(evt.id);
    dragSourceRef.current = { date: evt.date, startTime: evt.startTime, endTime: evt.endTime };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', evt.id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    dragSourceRef.current = null;
  }, []);

  const handleDropOnDay = useCallback(
    (e: React.DragEvent, targetDate: string, targetHour?: number) => {
      e.preventDefault();
      const evtId = e.dataTransfer.getData('text/plain');
      if (!evtId || !dragSourceRef.current) return;

      const source = dragSourceRef.current;
      const startM = timeToMinutes(source.startTime);
      const endM = timeToMinutes(source.endTime);
      const duration = endM - startM;

      let newStartM = targetHour !== undefined ? targetHour * 60 : startM;
      // Snap to 30-min grid
      newStartM = Math.round(newStartM / 30) * 30;
      const newEndM = Math.min(newStartM + duration, 24 * 60 - 1);
      const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');
      const newStart = `${pad(newStartM / 60)}:${pad(newStartM % 60)}`;
      const newEnd = `${pad(newEndM / 60)}:${pad(newEndM % 60)}`;

      // Check conflicts
      const conflicts = detectConflicts({ date: targetDate, startTime: newStart, endTime: newEnd }, evtId);
      if (conflicts.length > 0) {
        const ok = window.confirm(
          `Conflito com: ${conflicts.map((c) => c.title).join(', ')}.\nDeseja confirmar mesmo assim?`
        );
        if (!ok) return;
      }

      updateEvent(evtId, { date: targetDate, startTime: newStart, endTime: newEnd });
      setDraggingId(null);
      dragSourceRef.current = null;
    },
    [detectConflicts, updateEvent]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // ── Month calendar building ─────────────────────────────────────────────────

  const monthCalendarDays = useMemo(() => {
    const firstDay = monthStart;
    const lastDay = monthEnd;
    const firstDow = getDay(firstDay); // 0=Sun
    const startOffset = firstDow === 0 ? 6 : firstDow - 1; // Mon-based offset
    const days: Date[] = [];
    for (let i = -startOffset; i < getDaysInMonth(currentDate) + (6 - ((startOffset + getDaysInMonth(currentDate) - 1) % 7)); i++) {
      days.push(addDays(firstDay, i));
    }
    return days;
  }, [currentDate, monthStart, monthEnd]);

  // ── Dynamic header title ────────────────────────────────────────────────────

  const headerTitle = useMemo(() => {
    if (viewMode === 'day') return format(currentDate, "EEE, d 'de' MMMM", { locale: ptBR });
    if (viewMode === 'week') return `${format(weekStart, 'd MMM', { locale: ptBR })} — ${format(weekEnd, 'd MMM', { locale: ptBR })}`;
    return format(currentDate, 'MMMM yyyy', { locale: ptBR });
  }, [viewMode, currentDate, weekStart, weekEnd]);

  // ── YearPicker Panel ────────────────────────────────────────────────────────

  const YearPickerPanel = () => (
    <div
      ref={yearPickerRef}
      className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-night-surface border border-canvas-subtle dark:border-night-border rounded-2xl shadow-elevated p-4 animate-fadeIn"
    >
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => handleYearChange(-1)}
          className="p-1.5 rounded-lg hover:bg-canvas-subtle dark:hover:bg-night-card text-stone-400 hover:text-brand-500 transition-colors"
          aria-label="Ano anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold font-mono text-ink-primary dark:text-white">{currentYear}</span>
        <button
          onClick={() => handleYearChange(1)}
          className="p-1.5 rounded-lg hover:bg-canvas-subtle dark:hover:bg-night-card text-stone-400 hover:text-brand-500 transition-colors"
          aria-label="Próximo ano"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
        {months.map((month) => {
          const isCurrentMonth = isSameMonth(month, currentDate);
          const isTodayMonth = isSameMonth(month, today);
          return (
            <button
              key={month.toISOString()}
              onClick={() => {
                setCurrentDate(startOfMonth(month));
                setViewMode('month');
                setShowYearPicker(false);
              }}
              className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all border ${
                isCurrentMonth
                  ? 'bg-brand-600 text-white border-brand-600 shadow-soft'
                  : isTodayMonth
                  ? 'bg-coral-50 dark:bg-coral-950/30 text-coral-600 border-coral-200 dark:border-coral-800'
                  : 'bg-canvas-subtle dark:bg-night-card text-ink-secondary dark:text-stone-400 border-canvas-subtle dark:border-night-border hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400'
              }`}
            >
              {format(month, 'MMM', { locale: ptBR }).replace('.', '')}
            </button>
          );
        })}
      </div>

      <div className="border-t border-canvas-subtle dark:border-night-border pt-3">
        <p className="text-[10px] uppercase font-mono text-stone-400 dark:text-stone-500 tracking-widest mb-2">
          Semanas de {format(currentDate, 'MMMM', { locale: ptBR })}
        </p>
        <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
          {weeksOfYear
            .filter((wk) => isSameMonth(wk, startOfMonth(currentDate)))
            .map((wk) => {
              const wkEnd = endOfWeek(wk, { weekStartsOn: 1 });
              const isActive = isSameWeek(wk, currentDate, { weekStartsOn: 1 });
              const hasTodayInWeek = isSameWeek(wk, today, { weekStartsOn: 1 });
              return (
                <button
                  key={wk.toISOString()}
                  onClick={() => handleJumpToWeek(wk)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between gap-2 ${
                    isActive
                      ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400 font-semibold border border-brand-500/30'
                      : 'hover:bg-canvas-subtle dark:hover:bg-night-card text-ink-secondary dark:text-stone-400'
                  }`}
                >
                  <span className="font-mono">
                    {format(wk, 'd MMM', { locale: ptBR })} – {format(wkEnd, 'd MMM', { locale: ptBR })}
                  </span>
                  {hasTodayInWeek && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-coral-500 text-white font-bold">hoje</span>
                  )}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );

  // ── Event Card (shared between day and week) ─────────────────────────────────

  const EventCard: React.FC<{
    evt: CalendarEvent;
    compact?: boolean;
    onClick?: () => void;
  }> = ({ evt, compact = false, onClick }) => {
    const linkedTask = state.tasks.find((t) => t.id === evt.taskId);
    const isVirtual = !state.events.find((e) => e.id === evt.id);
    const conflicts = useMemo(() => findEventConflicts(evt, visibleEvents), [evt]);

    if (compact) {
      return (
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, evt)}
          onDragEnd={handleDragEnd}
          onClick={onClick}
          className={`p-1.5 rounded-lg text-[10px] border truncate cursor-pointer transition-all ${
            evt.completed
              ? 'bg-canvas-subtle/50 dark:bg-night-card/30 border-canvas-subtle dark:border-night-border/30 opacity-50'
              : conflicts.length > 0
              ? 'bg-amber-500/10 border-amber-500/40'
              : 'bg-canvas-subtle dark:bg-night-card border-canvas-subtle dark:border-night-border hover:border-brand-500/40'
          } ${draggingId === evt.id ? 'opacity-40 scale-95' : ''}`}
        >
          <span className="font-mono font-semibold text-brand-600 dark:text-brand-400 mr-1">{evt.startTime}</span>
          <span className={evt.completed ? 'line-through text-stone-400 dark:text-stone-500' : 'text-ink-primary dark:text-stone-200'}>
            {evt.title}
          </span>
          {evt.recurrence && evt.recurrence !== 'none' && (
            <RefreshCw className="inline w-2.5 h-2.5 ml-1 text-brand-400 opacity-70" />
          )}
        </div>
      );
    }

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, evt)}
        onDragEnd={handleDragEnd}
        className={`group flex items-start sm:items-center justify-between p-3 sm:p-3.5 rounded-xl border transition-all gap-2.5 ${
          draggingId === evt.id ? 'opacity-40 scale-[0.98]' : ''
        } ${
          evt.completed
            ? 'bg-canvas-subtle/30 dark:bg-night-card/25 border-canvas-subtle dark:border-night-border/40 text-stone-400 dark:text-stone-500'
            : conflicts.length > 0
            ? 'bg-amber-500/5 border-amber-500/40 text-ink-primary dark:text-stone-100'
            : 'bg-white dark:bg-night-surface/90 border-canvas-subtle dark:border-night-border hover:border-brand-500/40 text-ink-primary dark:text-stone-100 shadow-soft'
        }`}
      >
        {/* Drag handle */}
        <GripVertical className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 flex-shrink-0 cursor-grab hidden sm:block" />

        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <button
            onClick={() => handleToggleEvent(evt.id, evt.completed)}
            className={`min-h-[36px] min-w-[36px] flex items-center justify-center -ml-1 text-stone-300 dark:text-stone-600 hover:text-mint-500 transition-colors flex-shrink-0 ${evt.completed ? 'text-mint-500' : ''}`}
            title={evt.completed ? 'Desmarcar' : 'Concluir atividade'}
            aria-label="Concluir evento"
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex-1 pt-1 sm:pt-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20 flex-shrink-0">
                {evt.startTime} — {evt.endTime}
              </span>
              <span className={`text-xs sm:text-sm font-medium break-words leading-tight ${evt.completed ? 'line-through text-stone-400 dark:text-stone-500' : ''}`}>
                {evt.title}
              </span>
              {evt.isFixed && (
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 flex-shrink-0">
                  Fixo
                </span>
              )}
              {evt.recurrence && evt.recurrence !== 'none' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase bg-brand-500/10 text-brand-500 dark:text-brand-400 border border-brand-500/20 flex-shrink-0 flex items-center gap-0.5">
                  <RefreshCw className="w-2.5 h-2.5" />
                  {evt.recurrence === 'daily' ? 'Diário' : 'Semanal'}
                </span>
              )}
              {isVirtual && (
                <span className="text-[9px] text-stone-400 font-mono">(recorrência)</span>
              )}
            </div>
            {linkedTask && (
              <p className="text-[11px] text-brand-500/90 dark:text-brand-400/90 mt-0.5 font-medium truncate">
                ↳ {linkedTask.title}
              </p>
            )}
            {conflicts.length > 0 && (
              <p className="text-[10px] text-amber-500 mt-0.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Conflito com: {conflicts.map((c) => c.title).join(', ')}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => openEditForm(evt)}
            className="min-h-[34px] min-w-[34px] flex items-center justify-center text-stone-400 hover:text-brand-400 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 rounded-lg"
            title="Editar"
            aria-label="Editar evento"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeleteEvent(evt)}
            className="min-h-[34px] min-w-[34px] flex items-center justify-center text-stone-400 hover:text-red-400 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 rounded-lg"
            title="Excluir"
            aria-label="Excluir horário"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  // ── Create/Edit Form ─────────────────────────────────────────────────────────

  const EventForm = () => (
    <form
      onSubmit={handleSubmitForm}
      className="bg-white dark:bg-night-surface/95 border border-brand-500/40 rounded-xl p-3.5 sm:p-4 shadow-elevated space-y-3 animate-fadeIn"
    >
      <div className="flex items-center justify-between pb-2 border-b border-canvas-subtle dark:border-night-border">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 font-mono">
          {editingEvent ? 'Editar Compromisso' : 'Criar Compromisso'}
        </h3>
        <button type="button" onClick={handleCancelForm} className="min-h-[36px] px-2 text-xs text-stone-400 hover:text-stone-200 font-medium">
          Cancelar
        </button>
      </div>

      <input
        type="text"
        required
        autoFocus
        placeholder="Ex: Reunião de Planejamento..."
        value={form.title}
        onChange={(e) => handleFormChange('title', e.target.value)}
        className="w-full text-xs sm:text-sm px-3 py-2.5 bg-canvas-light dark:bg-night-card border border-canvas-subtle dark:border-night-border rounded-xl text-ink-primary dark:text-stone-100 outline-none focus:border-brand-500"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="block text-[10px] font-mono text-stone-400 dark:text-stone-500 mb-1">Data</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => handleFormChange('date', e.target.value)}
            className="w-full min-h-[36px] text-xs px-2.5 py-1.5 bg-canvas-light dark:bg-night-card border border-canvas-subtle dark:border-night-border rounded-lg text-ink-primary dark:text-stone-100"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono text-stone-400 dark:text-stone-500 mb-1">Início</label>
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => handleFormChange('startTime', e.target.value)}
            className="w-full min-h-[36px] text-xs px-2.5 py-1.5 bg-canvas-light dark:bg-night-card border border-canvas-subtle dark:border-night-border rounded-lg text-ink-primary dark:text-stone-100 font-mono"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono text-stone-400 dark:text-stone-500 mb-1">Fim</label>
          <input
            type="time"
            value={form.endTime}
            onChange={(e) => handleFormChange('endTime', e.target.value)}
            className="w-full min-h-[36px] text-xs px-2.5 py-1.5 bg-canvas-light dark:bg-night-card border border-canvas-subtle dark:border-night-border rounded-lg text-ink-primary dark:text-stone-100 font-mono"
          />
        </div>
      </div>

      {/* Recurrence */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-mono text-stone-400 dark:text-stone-500 mb-1">Repetição</label>
          <select
            value={form.recurrence}
            onChange={(e) => handleFormChange('recurrence', e.target.value as EventRecurrenceType)}
            className="w-full min-h-[36px] text-xs px-2.5 py-1.5 bg-canvas-light dark:bg-night-card border border-canvas-subtle dark:border-night-border rounded-lg text-ink-primary dark:text-stone-100"
          >
            <option value="none">Não repetir</option>
            <option value="daily">Todos os dias</option>
            <option value="weekly">Toda semana</option>
          </select>
        </div>
        {form.recurrence !== 'none' && (
          <div>
            <label className="block text-[10px] font-mono text-stone-400 dark:text-stone-500 mb-1">Repetir até (opcional)</label>
            <input
              type="date"
              value={form.recurrenceEndDate}
              onChange={(e) => handleFormChange('recurrenceEndDate', e.target.value)}
              className="w-full min-h-[36px] text-xs px-2.5 py-1.5 bg-canvas-light dark:bg-night-card border border-canvas-subtle dark:border-night-border rounded-lg text-ink-primary dark:text-stone-100"
            />
          </div>
        )}
      </div>

      {/* Options row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        <div>
          <label className="block text-[10px] font-mono text-stone-400 dark:text-stone-500 mb-1">Vincular tarefa (opcional)</label>
          <select
            value={form.taskId}
            onChange={(e) => handleFormChange('taskId', e.target.value)}
            className="w-full min-h-[36px] text-xs px-2.5 py-1.5 bg-canvas-light dark:bg-night-card border border-canvas-subtle dark:border-night-border rounded-lg text-ink-primary dark:text-stone-100"
          >
            <option value="">Nenhuma tarefa vinculada</option>
            {state.tasks.filter((t) => t.status !== 'completed').map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 pt-1 sm:pt-4 min-h-[36px]">
          <input
            type="checkbox"
            id="isFixedEvt"
            checked={form.isFixed}
            onChange={(e) => handleFormChange('isFixed', e.target.checked)}
            className="w-4 h-4 rounded border-canvas-subtle text-amber-500 focus:ring-amber-400"
          />
          <label htmlFor="isFixedEvt" className="text-xs text-stone-500 dark:text-stone-400 cursor-pointer select-none">
            Compromisso fixo inadiável
          </label>
        </div>
      </div>

      {/* Conflict warning */}
      {conflictWarning.length > 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4" />
            Conflito de horário detectado
          </div>
          <ul className="text-xs text-amber-600 dark:text-amber-400 list-disc list-inside space-y-0.5">
            {conflictWarning.map((c) => (
              <li key={c.id}>{c.title} ({c.startTime}–{c.endTime})</li>
            ))}
          </ul>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setConflictOverride(true); handleSubmitForm({ preventDefault: () => {} } as any); }}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition-colors"
            >
              Confirmar mesmo assim
            </button>
            <button
              type="button"
              onClick={() => setConflictWarning([])}
              className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200 transition-colors"
            >
              Corrigir horário
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-canvas-subtle dark:border-night-border">
        <button type="button" onClick={handleCancelForm} className="px-3.5 py-1.5 text-xs text-stone-400 hover:text-stone-200 transition-colors">
          Cancelar
        </button>
        <button
          type="submit"
          className="interactive-tap min-h-[38px] px-4 py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-lg shadow-sm transition-all"
        >
          {editingEvent ? 'Salvar Alterações' : 'Salvar Horário'}
        </button>
      </div>
    </form>
  );

  // ── Month View ───────────────────────────────────────────────────────────────

  const MonthView = () => {
    const DOW_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    return (
      <div className="bg-white dark:bg-night-surface border border-canvas-subtle dark:border-night-border rounded-2xl overflow-hidden shadow-soft">
        {/* Day of week headers */}
        <div className="grid grid-cols-7 border-b border-canvas-subtle dark:border-night-border">
          {DOW_LABELS.map((d) => (
            <div key={d} className="py-2 text-center text-[10px] font-mono uppercase text-stone-400 dark:text-stone-500">
              {d}
            </div>
          ))}
        </div>
        {/* Day grid */}
        <div className="grid grid-cols-7">
          {monthCalendarDays.map((day, idx) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDay = isToday(day);
            const isSelected = dayStr === selectedDateStr;
            const dayEvts = eventsForDay(dayStr);
            const hasMore = dayEvts.length > 2;

            return (
              <div
                key={idx}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnDay(e, dayStr)}
                onClick={() => {
                  setCurrentDate(day);
                  setViewMode('day');
                }}
                className={`min-h-[80px] sm:min-h-[100px] p-1.5 border-b border-r border-canvas-subtle dark:border-night-border cursor-pointer transition-colors ${
                  !isCurrentMonth ? 'opacity-30' : ''
                } ${isSelected ? 'bg-brand-500/10 dark:bg-brand-950/30' : 'hover:bg-canvas-subtle dark:hover:bg-night-card'}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold mb-1 ${
                  isTodayDay
                    ? 'bg-coral-500 text-white'
                    : isSelected
                    ? 'bg-brand-600 text-white'
                    : 'text-ink-primary dark:text-stone-300'
                }`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {dayEvts.slice(0, 2).map((e) => (
                    <div
                      key={e.id}
                      onClick={(ev) => { ev.stopPropagation(); openEditForm(e); }}
                      className={`truncate text-[9px] sm:text-[10px] px-1 py-0.5 rounded font-medium ${
                        e.completed
                          ? 'bg-canvas-subtle dark:bg-night-card text-stone-400 line-through'
                          : 'bg-brand-500/15 text-brand-700 dark:text-brand-300'
                      }`}
                    >
                      <span className="font-mono mr-0.5">{e.startTime}</span>{e.title}
                    </div>
                  ))}
                  {hasMore && (
                    <div className="text-[9px] text-stone-400 dark:text-stone-500 pl-1">
                      +{dayEvts.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Week View ────────────────────────────────────────────────────────────────

  const WeekView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2.5">
      {weekDays.map((day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const isTodayDay = dayStr === todayKey;
        const isSelected = dayStr === selectedDateStr;
        const evts = eventsForDay(dayStr);

        return (
          <div
            key={dayStr}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnDay(e, dayStr)}
            className={`p-3 rounded-2xl border flex flex-col min-h-[140px] sm:min-h-[170px] transition-all ${
              isSelected
                ? 'border-brand-500 bg-brand-500/10 dark:bg-brand-950/30 shadow-soft'
                : isTodayDay
                ? 'border-coral-400 bg-coral-50/20 dark:bg-coral-950/20'
                : 'border-canvas-subtle dark:border-night-border bg-white dark:bg-night-surface hover:border-brand-500/30'
            }`}
          >
            <div
              className="flex items-center justify-between pb-2 mb-2 border-b border-canvas-subtle dark:border-night-border text-xs cursor-pointer"
              onClick={() => { setCurrentDate(day); setViewMode('day'); }}
            >
              <span className="font-mono uppercase text-stone-400 dark:text-stone-500 text-[10px]">
                {format(day, 'EEEE', { locale: ptBR })}
              </span>
              <span className={`font-mono font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center ${isTodayDay ? 'bg-coral-500 text-white' : 'text-ink-primary dark:text-stone-200'}`}>
                {format(day, 'd')}
              </span>
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {evts.length === 0 ? (
                <span className="text-[10px] text-stone-400/50 dark:text-stone-500/50 italic">Sem eventos</span>
              ) : (
                evts.map((e) => (
                  <EventCard
                    key={e.id}
                    evt={e}
                    compact
                    onClick={() => { setCurrentDate(day); setViewMode('day'); }}
                  />
                ))
              )}
            </div>

            <button
              onClick={(ev) => { ev.stopPropagation(); openCreateForm(dayStr); }}
              className="mt-2 w-full py-1 text-[10px] text-stone-400 hover:text-brand-500 rounded-lg border border-dashed border-transparent hover:border-brand-500/30 transition-all text-center"
            >
              <Plus className="w-3 h-3 inline mr-0.5" /> Adicionar
            </button>
          </div>
        );
      })}
    </div>
  );

  // ── Day View ─────────────────────────────────────────────────────────────────

  const DayView = () => (
    <div
      className="space-y-2"
      onDragOver={handleDragOver}
      onDrop={(e) => handleDropOnDay(e, selectedDateStr)}
    >
      {/* Completed counter + toggle */}
      {dayEvents.length > 0 && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-stone-400 dark:text-stone-500 font-mono">
            {completedCount}/{dayEvents.length} concluído{completedCount !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-brand-500 transition-colors"
            aria-label={showCompleted ? 'Ocultar concluídos' : 'Mostrar concluídos'}
          >
            {showCompleted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showCompleted ? 'Ocultar concluídos' : 'Mostrar concluídos'}
          </button>
        </div>
      )}

      {dayEvents.length === 0 ? (
        <div className="py-12 sm:py-16 text-center border border-dashed border-canvas-subtle dark:border-night-border/70 rounded-2xl bg-white/30 dark:bg-night-surface/30 p-6">
          <Clock className="w-7 h-7 text-brand-500/50 mx-auto mb-2.5" />
          <p className="text-sm font-medium text-ink-primary dark:text-stone-200">Nenhuma atividade para este dia</p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Adicione compromissos ou blocos de tempo.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dayEvents.map((evt) => (
            <EventCard key={evt.id} evt={evt} />
          ))}
        </div>
      )}
    </div>
  );

  // ── Main render ──────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-5 animate-fadeIn pb-8">
      {/* =====================================================================
          1. COMPACT NAVIGATION BAR
          ===================================================================== */}
      <div className="relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-night-surface p-2 sm:p-2.5 rounded-2xl border border-canvas-subtle dark:border-night-border shadow-soft gap-2">
          <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={handleToday}
                className="interactive-tap min-h-[36px] px-3 py-1 text-xs font-semibold bg-canvas-subtle dark:bg-night-card hover:bg-brand-500/10 text-ink-primary dark:text-stone-200 rounded-lg transition-colors border border-canvas-subtle dark:border-night-border"
              >
                Hoje
              </button>
              <div className="flex items-center">
                <button
                  onClick={handlePrev}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-stone-400 hover:text-brand-500 hover:bg-canvas-subtle dark:hover:bg-night-card transition-colors"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-stone-400 hover:text-brand-500 hover:bg-canvas-subtle dark:hover:bg-night-card transition-colors"
                  aria-label="Próximo"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dynamic title + year picker trigger */}
            <button
              onClick={() => setShowYearPicker((v) => !v)}
              className="flex items-center gap-1.5 min-h-[36px] px-2 rounded-lg hover:bg-canvas-subtle dark:hover:bg-night-card transition-colors group"
              aria-label="Abrir seletor de data"
            >
              <span className="text-xs sm:text-sm font-semibold text-ink-primary dark:text-stone-100 capitalize truncate">
                {headerTitle}
              </span>
              <CalendarDays className="w-3.5 h-3.5 text-stone-400 group-hover:text-brand-500 transition-colors flex-shrink-0" />
            </button>
          </div>

          {/* View Switcher (Day / Week / Month) */}
          <div className="flex items-center gap-1 self-stretch sm:self-auto">
            {showYearPicker && (
              <button
                onClick={() => setShowYearPicker(false)}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-stone-400 hover:text-red-400 transition-colors sm:hidden"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center justify-center flex-1 sm:flex-initial bg-canvas-subtle dark:bg-night-card p-1 rounded-xl text-xs border border-canvas-subtle dark:border-night-border">
              {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleSwitchView(mode)}
                  className={`flex-1 sm:flex-initial min-h-[32px] px-2.5 sm:px-3.5 py-1 rounded-lg transition-all ${
                    viewMode === mode
                      ? 'bg-white dark:bg-night-surface text-brand-600 dark:text-brand-400 font-semibold shadow-soft'
                      : 'text-stone-400 dark:text-stone-500 hover:text-ink-primary dark:hover:text-stone-200'
                  }`}
                >
                  {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : 'Mês'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Year / Week Picker Panel (dropdown) */}
        {showYearPicker && <YearPickerPanel />}
      </div>

      {/* Week Day Pills Strip on Mobile (Quick date switcher — day/week only) */}
      {viewMode !== 'month' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar sm:hidden">
          {weekDays.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const isSelected = dayStr === selectedDateStr;
            const isTodayDay = dayStr === todayKey;
            return (
              <button
                key={dayStr}
                onClick={() => { setCurrentDate(day); setViewMode('day'); }}
                className={`flex-1 min-w-[42px] py-2 px-1 rounded-xl flex flex-col items-center justify-center text-[10px] font-mono transition-all border ${
                  isSelected
                    ? 'bg-brand-600 text-white border-brand-600 shadow-glow-brand font-bold'
                    : isTodayDay
                    ? 'bg-coral-50 dark:bg-coral-950/30 text-coral-600 border-coral-200 dark:border-coral-800 font-bold'
                    : 'bg-white dark:bg-night-surface text-stone-400 dark:text-stone-500 border-canvas-subtle dark:border-night-border'
                }`}
              >
                <span className="uppercase text-[9px] opacity-80">{format(day, 'EEE', { locale: ptBR })[0]}</span>
                <span className="text-xs font-semibold">{format(day, 'd')}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* =====================================================================
          2. MAIN VIEW (Day / Week / Month)
          ===================================================================== */}
      {viewMode === 'day' && <DayView />}
      {viewMode === 'week' && <WeekView />}
      {viewMode === 'month' && <MonthView />}

      {/* =====================================================================
          3. ADD / EDIT FORM
          ===================================================================== */}
      {viewMode !== 'month' && (
        <section className="pt-2">
          {!showAddForm ? (
            <button
              onClick={() => openCreateForm()}
              className="interactive-tap w-full py-3 px-4 rounded-xl border border-dashed border-canvas-subtle dark:border-night-border hover:border-brand-500/60 bg-white/40 dark:bg-night-surface/50 hover:bg-brand-500/5 text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-brand-600 dark:hover:text-brand-400 flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 text-brand-500" />
              <span>Novo horário</span>
            </button>
          ) : (
            <EventForm />
          )}
        </section>
      )}

      {/* Floating add button for month view */}
      {viewMode === 'month' && !showAddForm && (
        <button
          onClick={() => openCreateForm()}
          className="interactive-tap w-full py-3 px-4 rounded-xl border border-dashed border-canvas-subtle dark:border-night-border hover:border-brand-500/60 bg-white/40 dark:bg-night-surface/50 hover:bg-brand-500/5 text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-brand-600 dark:hover:text-brand-400 flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 text-brand-500" />
          <span>Novo compromisso</span>
        </button>
      )}
      {viewMode === 'month' && showAddForm && <EventForm />}
    </div>
  );
};
