import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Flame,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, Priority } from '../../types';
import { getTodayKey, formatDateBR } from '../../lib/dateUtils';
import confetti from 'canvas-confetti';

interface ScheduleItem {
  id: string;
  source: 'event' | 'task';
  title: string;
  startTime: string; // HH:mm or '99:99' for untimed tasks
  endTime?: string;
  isCompleted: boolean;
  priority?: Priority;
  isFixed?: boolean;
  isFocus?: boolean;
  originalTask?: Task;
  originalEventId?: string;
}

export const TodayView: React.FC = () => {
  const {
    state,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    setFocusTaskIds,
    toggleEventCompleted,
    deleteEvent,
    updateEvent,
  } = useApp();

  const todayKey = getTodayKey();

  // 1. Live real-time clock updating every second
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Inline editing state for schedule items
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingTime, setEditingTime] = useState('');

  // 2. Add Task form state (located at bottom)
  const [showAddForm, setShowAddForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTime, setTaskTime] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('normal');

  // Tasks for today
  const todayTasks = state.tasks.filter(
    (t) => t.dueDate === todayKey || (!t.dueDate && t.status !== 'completed')
  );

  // Events for today
  const todayEvents = state.events.filter((e) => e.date === todayKey);

  // Unify events and tasks into one single streamlined chronological schedule
  const scheduleItems: ScheduleItem[] = [];

  // Add events
  todayEvents.forEach((evt) => {
    scheduleItems.push({
      id: `evt-${evt.id}`,
      source: 'event',
      title: evt.title,
      startTime: evt.startTime,
      endTime: evt.endTime,
      isCompleted: !!evt.completed,
      isFixed: evt.isFixed,
      originalEventId: evt.id,
    });
  });

  // Add tasks
  todayTasks.forEach((t) => {
    const isFocus = state.preferences.focusTaskIds.includes(t.id);
    scheduleItems.push({
      id: `task-${t.id}`,
      source: 'task',
      title: t.title,
      startTime: t.plannedTime || '99:99',
      isCompleted: t.status === 'completed',
      priority: t.priority,
      isFocus,
      originalTask: t,
    });
  });

  // Sort schedule items:
  // 1. Incompleted first, completed last
  // 2. Chronological by startTime (items with time come first, untimed come after)
  // 3. Priority weighting if same time
  const priorityWeight: Record<Priority, number> = { urgent: 4, high: 3, normal: 2, low: 1 };
  scheduleItems.sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    if (a.startTime !== b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }
    const weightA = a.priority ? priorityWeight[a.priority] : 2;
    const weightB = b.priority ? priorityWeight[b.priority] : 2;
    return weightB - weightA;
  });

  // Toggling completion
  const handleToggleItem = (item: ScheduleItem) => {
    if (item.source === 'task' && item.originalTask) {
      const willBeCompleted = !item.isCompleted;
      toggleTaskStatus(item.originalTask.id);
      if (willBeCompleted) {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#EA580C', '#F97316', '#10B981', '#754DF6'],
        });
      }
    } else if (item.source === 'event' && item.originalEventId) {
      const willBeCompleted = !item.isCompleted;
      toggleEventCompleted(item.originalEventId);
      if (willBeCompleted) {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#EA580C', '#F97316', '#10B981', '#754DF6'],
        });
      }
    }
  };

  // Delete item
  const handleDeleteItem = (item: ScheduleItem) => {
    if (item.source === 'task' && item.originalTask) {
      deleteTask(item.originalTask.id);
    } else if (item.source === 'event' && item.originalEventId) {
      deleteEvent(item.originalEventId);
    }
  };

  // Start inline editing
  const handleStartEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setEditingTitle(item.title);
    setEditingTime(item.startTime === '99:99' ? '' : item.startTime);
  };

  // Save inline edit
  const handleSaveEdit = (item: ScheduleItem) => {
    if (!editingTitle.trim()) return;
    if (item.source === 'task' && item.originalTask) {
      updateTask(item.originalTask.id, {
        title: editingTitle.trim(),
        plannedTime: editingTime.trim() || undefined,
      });
    } else if (item.source === 'event' && item.originalEventId) {
      updateEvent(item.originalEventId, {
        title: editingTitle.trim(),
        startTime: editingTime.trim() || item.startTime,
      });
    }
    setEditingId(null);
  };

  // Toggle priority focus
  const toggleFocus = (taskId: string) => {
    const current = state.preferences.focusTaskIds;
    if (current.includes(taskId)) {
      setFocusTaskIds(current.filter((id) => id !== taskId));
    } else {
      if (current.length >= 3) {
        setFocusTaskIds([...current.slice(1), taskId]);
      } else {
        setFocusTaskIds([...current, taskId]);
      }
    }
  };

  // Handle Quick Add Task Submit
  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    addTask({
      title: taskTitle.trim(),
      dueDate: todayKey,
      plannedTime: taskTime || undefined,
      priority: taskPriority,
      category: 'Geral',
      tags: [],
      subtasks: [],
      status: 'pending',
      recurrence: 'none',
      estimatedDuration: 30,
    });

    setTaskTitle('');
    setTaskTime('');
    setTaskPriority('normal');
    setShowAddForm(false);
  };

  const priorityBadge: Record<Priority, { label: string; class: string }> = {
    urgent: {
      label: 'Urgente',
      class: 'text-amber-500/90 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    high: {
      label: 'Alta',
      class: 'text-orange-500/90 dark:text-orange-400 bg-orange-500/10 border-orange-500/30',
    },
    normal: {
      label: 'Normal',
      class: 'text-stone-500 dark:text-stone-400 bg-stone-500/10 border-stone-500/20',
    },
    low: {
      label: 'Baixa',
      class: 'text-stone-400 dark:text-stone-500 bg-stone-500/5 border-transparent',
    },
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fadeIn pb-8">
      {/* ========================================================================= */}
      {/* 1 & 2. CENTRALIZED DATE & TIME                                           */}
      {/* Minimal, elegant, dark premium typographic hierarchy                      */}
      {/* ========================================================================= */}
      <section className="text-center pt-2 sm:pt-4 pb-2">
        {/* Date: moderate prominence, elegant, readable */}
        <p className="text-xs sm:text-sm font-medium tracking-wide text-stone-500 dark:text-stone-400 capitalize">
          {formatDateBR(currentTime, "EEEE, d 'de' MMMM 'de' yyyy")}
        </p>

        {/* Time: larger prominence, clean, live updating */}
        <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-ink-primary dark:text-stone-100 font-mono mt-1 select-none">
          {formatDateBR(currentTime, 'HH:mm')}
          <span className="text-base sm:text-lg text-brand-500/80 dark:text-brand-400/80 font-normal ml-1">
            {formatDateBR(currentTime, ':ss')}
          </span>
        </h1>
      </section>

      {/* ========================================================================= */}
      {/* 3. CRONOGRAMA LOGO ABAIXO (Main Content)                                  */}
      {/* Clear chronological sequence, subtle clean borders, no clutter            */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-semibold">
            Cronograma ({scheduleItems.filter((i) => i.isCompleted).length}/{scheduleItems.length})
          </span>
        </div>

        {/* Schedule List or Empty State */}
        {scheduleItems.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-canvas-subtle dark:border-night-border/60 bg-white/30 dark:bg-night-surface/30 p-6">
            <Clock className="w-7 h-7 text-brand-500/50 mx-auto mb-2.5" />
            <p className="text-sm font-medium text-ink-primary dark:text-stone-200">
              Nenhum compromisso ou tarefa para hoje
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
              Use o botão abaixo para organizar seu cronograma.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {scheduleItems.map((item) => {
              const isEditing = editingId === item.id;
              const hasTime = item.startTime !== '99:99';

              return (
                <div
                  key={item.id}
                  className={`group relative flex items-center justify-between p-3 sm:p-3.5 rounded-xl border transition-all duration-150 gap-3 ${
                    item.isCompleted
                      ? 'bg-canvas-subtle/30 dark:bg-night-card/25 border-canvas-subtle dark:border-night-border/40 text-stone-400 dark:text-stone-500'
                      : 'bg-white dark:bg-night-surface/90 border-canvas-subtle dark:border-night-border hover:border-brand-500/40 text-ink-primary dark:text-stone-100 shadow-soft'
                  }`}
                >
                  {isEditing ? (
                    // Inline Edit Mode
                    <div className="flex items-center gap-2 flex-1 w-full min-w-0">
                      <input
                        type="time"
                        value={editingTime}
                        onChange={(e) => setEditingTime(e.target.value)}
                        className="text-xs font-mono px-2 py-1 bg-canvas-light dark:bg-night-card border border-canvas-subtle dark:border-night-border rounded-lg text-ink-primary dark:text-stone-100 outline-none w-20"
                      />
                      <input
                        type="text"
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(item);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="flex-1 text-xs sm:text-sm px-2.5 py-1 bg-canvas-light dark:bg-night-card border border-brand-500/50 rounded-lg text-ink-primary dark:text-stone-100 outline-none"
                      />
                      <button
                        onClick={() => handleSaveEdit(item)}
                        className="p-1.5 text-mint-500 hover:text-mint-600 rounded-lg"
                        title="Salvar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 text-stone-400 hover:text-stone-300 rounded-lg"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    // Standard Row
                    <>
                      {/* Left: Checkbox + Time + Title */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          onClick={() => handleToggleItem(item)}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center -ml-1 text-stone-300 dark:text-stone-600 hover:text-mint-500 transition-colors flex-shrink-0"
                          aria-label={item.isCompleted ? 'Desmarcar' : 'Concluir'}
                        >
                          {item.isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-mint-500" />
                          ) : (
                            <Circle className="w-5 h-5 hover:text-brand-500 transition-colors" />
                          )}
                        </button>

                        {/* Chronological Time Badge */}
                        <span
                          className={`font-mono text-xs px-2 py-0.5 rounded-md border flex-shrink-0 ${
                            hasTime
                              ? 'text-brand-600 dark:text-brand-400 bg-brand-500/10 border-brand-500/20 font-semibold'
                              : 'text-stone-400 dark:text-stone-600 bg-transparent border-transparent text-[11px]'
                          }`}
                        >
                          {hasTime
                            ? item.endTime
                              ? `${item.startTime} — ${item.endTime}`
                              : item.startTime
                            : 'Hoje'}
                        </span>

                        {/* Title and tags */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs sm:text-sm font-medium break-words leading-tight ${
                                item.isCompleted
                                  ? 'line-through text-stone-400 dark:text-stone-500'
                                  : 'text-ink-primary dark:text-stone-100'
                              }`}
                            >
                              {item.title}
                            </span>

                            {/* Priority / Fixed Badge */}
                            {item.isFixed && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono uppercase bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
                                Fixo
                              </span>
                            )}
                            {item.priority && item.priority !== 'normal' && (
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase border ${
                                  priorityBadge[item.priority]?.class || ''
                                }`}
                              >
                                {priorityBadge[item.priority]?.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick actions (Edit, Focus toggle for tasks, Delete) */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Focus / Flame indicator for tasks */}
                        {item.source === 'task' && item.originalTask && !item.isCompleted && (
                          <button
                            onClick={() => toggleFocus(item.originalTask!.id)}
                            className={`min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg transition-colors ${
                              item.isFocus
                                ? 'text-amber-500 hover:text-amber-400'
                                : 'text-stone-400/60 hover:text-amber-500 opacity-80 sm:opacity-0 sm:group-hover:opacity-100'
                            }`}
                            title={item.isFocus ? 'Remover das prioridades' : 'Marcar foco'}
                            aria-label="Foco"
                          >
                            <Flame className={`w-3.5 h-3.5 ${item.isFocus ? 'fill-amber-500' : ''}`} />
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="min-h-[32px] min-w-[32px] flex items-center justify-center text-stone-400 hover:text-brand-400 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-lg"
                          title="Editar"
                          aria-label="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="min-h-[32px] min-w-[32px] flex items-center justify-center text-stone-400 hover:text-red-400 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-lg"
                          title="Excluir"
                          aria-label="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 4. ADICIONAR TAREFA NA PARTE INFERIOR                                     */}
      {/* Discreet, aligned with dark premium aesthetic, below the schedule         */}
      {/* ========================================================================= */}
      <section className="pt-2">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="interactive-tap w-full py-3 px-4 rounded-xl border border-dashed border-canvas-subtle dark:border-night-border hover:border-brand-500/60 bg-white/40 dark:bg-night-surface/50 hover:bg-brand-500/5 text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-brand-600 dark:hover:text-brand-400 flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-brand-500" />
            <span>Adicionar tarefa</span>
          </button>
        ) : (
          <form
            onSubmit={handleAddTaskSubmit}
            className="bg-white dark:bg-night-surface/95 border border-brand-500/40 rounded-xl p-3 sm:p-4 shadow-soft space-y-3 animate-fadeIn"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                autoFocus
                placeholder="O que precisa ser feito hoje?"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full text-xs sm:text-sm bg-transparent border-none outline-none text-ink-primary dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 py-1"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-canvas-subtle dark:border-night-border">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Time Picker */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-canvas-light dark:bg-night-card border border-canvas-subtle dark:border-night-border min-h-[34px]">
                  <Clock className="w-3.5 h-3.5 text-brand-500" />
                  <input
                    type="time"
                    value={taskTime}
                    onChange={(e) => setTaskTime(e.target.value)}
                    title="Horário planejado (opcional)"
                    className="text-xs bg-transparent border-none outline-none font-mono w-16 text-ink-primary dark:text-stone-100"
                  />
                </div>

                {/* Priority */}
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as Priority)}
                  className="text-xs px-2.5 py-1 bg-canvas-light dark:bg-night-card border border-canvas-subtle dark:border-night-border rounded-lg text-ink-primary dark:text-stone-100 outline-none cursor-pointer min-h-[34px]"
                >
                  <option value="normal">Prioridade Normal</option>
                  <option value="high">Prioridade Alta</option>
                  <option value="urgent">Urgente 🔥</option>
                  <option value="low">Baixa</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setTaskTitle('');
                    setTaskTime('');
                  }}
                  className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="interactive-tap px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Salvar</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};
