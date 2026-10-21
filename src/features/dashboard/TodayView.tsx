import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar as CalendarIcon,
  Plus,
  BookOpen,
  ArrowRight,
  Flame,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, Priority } from '../../types';
import { getTodayKey, formatDateBR } from '../../lib/dateUtils';
import confetti from 'canvas-confetti';

export const TodayView: React.FC = () => {
  const {
    state,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    setFocusTaskIds,
    setCurrentView,
  } = useApp();

  const todayKey = getTodayKey();
  const todayDate = new Date();

  // Quick task input state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTime, setTaskTime] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('normal');
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Filter tasks for today
  const todayTasks = state.tasks
    .filter((t) => t.dueDate === todayKey || (!t.dueDate && t.status !== 'completed'))
    .sort((a, b) => {
      // Completed at bottom
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      // Scheduled time
      if (a.plannedTime && b.plannedTime) return a.plannedTime.localeCompare(b.plannedTime);
      if (a.plannedTime) return -1;
      if (b.plannedTime) return 1;
      // Priority weighting
      const pMap = { urgent: 4, high: 3, normal: 2, low: 1 };
      return (pMap[b.priority] || 2) - (pMap[a.priority] || 2);
    });

  const completedCount = todayTasks.filter((t) => t.status === 'completed').length;
  const totalCount = todayTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Up to 3 main daily focus priorities
  const focusTasks = state.tasks.filter((t) => state.preferences.focusTaskIds.includes(t.id));

  // Today's events in chronological order
  const todayEvents = state.events
    .filter((e) => e.date === todayKey)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Quick add task handler
  const handleQuickAdd = (e: React.FormEvent) => {
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
  };

  const handleToggle = (task: Task) => {
    const isCompleted = task.status === 'completed';
    toggleTaskStatus(task.id);
    if (!isCompleted) {
      confetti({
        particleCount: 35,
        spread: 55,
        origin: { y: 0.8 },
        colors: ['#754DF6', '#F6533C', '#10B981', '#F59E0B'],
      });
    }
  };

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

  const priorityStyles: Record<Priority, { label: string; badge: string; dot: string }> = {
    urgent: {
      label: 'Urgente',
      badge: 'bg-coral-50 text-coral-600 dark:bg-coral-500/10 dark:text-coral-400 border border-coral-200/60 dark:border-coral-500/30',
      dot: 'bg-coral-500',
    },
    high: {
      label: 'Alta',
      badge: 'bg-honey-50 text-honey-600 dark:bg-honey-500/10 dark:text-honey-400 border border-honey-200/60 dark:border-honey-500/30',
      dot: 'bg-honey-500',
    },
    normal: {
      label: 'Normal',
      badge: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300 border border-brand-100 dark:border-brand-500/30',
      dot: 'bg-brand-400',
    },
    low: {
      label: 'Baixa',
      badge: 'bg-canvas-subtle text-ink-secondary dark:bg-night-card dark:text-ink-muted border border-canvas-muted dark:border-night-border',
      dot: 'bg-ink-muted',
    },
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 sm:space-y-7 animate-fadeIn">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 sm:pb-5 border-b border-canvas-subtle dark:border-night-border">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-brand-600 dark:text-brand-400">
              Planejamento Diário
            </span>
            {totalCount > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-medium">
                {progressPercent}% feito ({completedCount}/{totalCount})
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-medium text-ink-primary dark:text-white tracking-tight">
            Hoje
          </h1>
          <p className="text-xs text-ink-secondary dark:text-ink-muted mt-0.5 capitalize font-medium">
            {formatDateBR(todayDate, "EEEE, d 'de' MMMM")}
          </p>
        </div>

        {/* Quick link to write in journal */}
        <button
          onClick={() => setCurrentView('journal')}
          className="interactive-tap self-start sm:self-auto min-h-[44px] flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-ink-secondary dark:text-ink-muted hover:text-brand-600 dark:hover:text-brand-300 bg-white dark:bg-night-surface border border-canvas-subtle dark:border-night-border shadow-soft hover:border-brand-200 transition-all"
        >
          <BookOpen className="w-4 h-4 text-brand-500 flex-shrink-0" />
          <span>Escrever no Diário</span>
        </button>
      </div>

      {/* Progress line indicator (subtle & elegant) */}
      {totalCount > 0 && (
        <div className="w-full bg-canvas-subtle dark:bg-night-border h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-mint-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Quick Task Capture Bar - Fully responsive, wraps gracefully on 320px */}
      <form
        onSubmit={handleQuickAdd}
        className={`bg-white dark:bg-night-surface rounded-2xl p-2 sm:p-2.5 shadow-soft border transition-all ${
          isInputFocused
            ? 'border-brand-500 shadow-glow-brand ring-2 ring-brand-500/10'
            : 'border-canvas-subtle dark:border-night-border hover:border-brand-300/60'
        } flex flex-col gap-2`}
      >
        <div className="flex items-center gap-2 px-1 sm:px-2">
          <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse flex-shrink-0" />
          <input
            type="text"
            placeholder="O que precisa ser feito hoje?"
            value={taskTitle}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            onChange={(e) => setTaskTitle(e.target.value)}
            className="w-full text-xs sm:text-sm bg-transparent border-none outline-none text-ink-primary dark:text-white placeholder:text-ink-muted/70 py-1"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-canvas-subtle dark:border-night-border px-1 sm:px-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Time Picker */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-canvas-light dark:bg-night-card text-ink-secondary dark:text-ink-muted border border-canvas-subtle dark:border-night-border min-h-[38px]">
              <Clock className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
              <input
                type="time"
                value={taskTime}
                onChange={(e) => setTaskTime(e.target.value)}
                title="Horário planejado"
                className="text-xs bg-transparent border-none outline-none font-mono w-16 text-ink-primary dark:text-white"
              />
            </div>

            {/* Priority Select */}
            <select
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value as Priority)}
              className="text-xs px-2.5 py-1.5 bg-canvas-light dark:bg-night-card border border-canvas-subtle dark:border-night-border rounded-lg text-ink-primary dark:text-white outline-none cursor-pointer min-h-[38px]"
            >
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente 🔥</option>
              <option value="low">Baixa</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="interactive-tap min-h-[42px] px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-glow-brand transition-all flex items-center justify-center gap-1.5 ml-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar</span>
          </button>
        </div>
      </form>

      {/* Section: Foco de Hoje (Prioridades - 1 col on mobile, 3 cols on tablet/desktop) */}
      {focusTasks.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-honey-600 dark:text-honey-400 flex items-center gap-1.5 font-mono">
              <Flame className="w-3.5 h-3.5 fill-honey-500 text-honey-500" />
              Prioridades Principais ({focusTasks.length}/3)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {focusTasks.map((task) => {
              const isDone = task.status === 'completed';
              return (
                <div
                  key={task.id}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isDone
                      ? 'bg-canvas-subtle/50 dark:bg-night-card/40 border-canvas-subtle dark:border-night-border text-ink-muted'
                      : 'bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-950/20 dark:to-night-surface border-amber-200/90 dark:border-amber-800/40 text-ink-primary dark:text-white shadow-soft'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => handleToggle(task)}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center -ml-1 text-amber-500 hover:text-emerald-600 transition-colors flex-shrink-0"
                      aria-label={isDone ? 'Desmarcar prioridade' : 'Concluir prioridade'}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-mint-500" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <p
                      className={`text-xs font-semibold leading-snug flex-1 break-words pt-1.5 ${
                        isDone ? 'line-through text-ink-muted' : ''
                      }`}
                    >
                      {task.title}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-amber-100/80 dark:border-night-border text-[10px]">
                    <span className="font-mono text-ink-muted flex items-center gap-1">
                      {task.plannedTime && <Clock className="w-3 h-3 text-brand-400" />}
                      {task.plannedTime || 'Sem horário'}
                    </span>
                    <button
                      onClick={() => toggleFocus(task.id)}
                      className="text-coral-500 hover:text-coral-600 font-medium py-1 px-1.5"
                    >
                      Remover foco
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section: Próximos Compromissos e Horários */}
      {todayEvents.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5 font-mono">
              <CalendarIcon className="w-3.5 h-3.5 text-brand-500" />
              Cronograma do Dia
            </span>
            <button
              onClick={() => setCurrentView('schedule')}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-medium py-1"
            >
              Abrir agenda <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {todayEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-night-surface border border-canvas-subtle dark:border-night-border rounded-xl text-xs shadow-soft hover:border-brand-200 transition-colors gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-[11px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded-md border border-brand-100 dark:border-brand-900/40 flex-shrink-0">
                    {evt.startTime} — {evt.endTime}
                  </span>
                  <span className="font-medium text-ink-primary dark:text-white truncate">
                    {evt.title}
                  </span>
                </div>
                {evt.isFixed ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-coral-50 dark:bg-coral-950/40 text-coral-600 dark:text-coral-400 font-mono font-medium border border-coral-200/50 flex-shrink-0">
                    Fixo
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-canvas-subtle dark:bg-night-card text-ink-muted font-mono flex-shrink-0">
                    Foco
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section: Lista de Tarefas do Dia */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary dark:text-ink-muted font-mono">
            Tarefas ({completedCount}/{totalCount})
          </span>
        </div>

        {todayTasks.length === 0 ? (
          <div className="py-12 sm:py-14 text-center border border-dashed border-canvas-subtle dark:border-night-border rounded-2xl bg-white/40 dark:bg-night-surface/40 p-4">
            <Sparkles className="w-6 h-6 text-brand-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-serif text-ink-primary dark:text-white font-medium">
              Nenhuma tarefa pendente para hoje
            </p>
            <p className="text-xs text-ink-muted mt-0.5">
              Adicione uma atividade no campo acima para começar seu dia.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((task) => {
              const isDone = task.status === 'completed';
              const isFocus = state.preferences.focusTaskIds.includes(task.id);
              const pInfo = priorityStyles[task.priority];

              return (
                <div
                  key={task.id}
                  className={`group flex items-start sm:items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all gap-2.5 ${
                    isDone
                      ? 'bg-canvas-subtle/40 dark:bg-night-card/30 border-canvas-subtle dark:border-night-border text-ink-muted'
                      : 'bg-white dark:bg-night-surface border-canvas-subtle dark:border-night-border hover:border-brand-300 text-ink-primary dark:text-white shadow-soft'
                  }`}
                >
                  {/* Left Side: Checkbox + Title + Priority */}
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <button
                      onClick={() => handleToggle(task)}
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center -ml-1 text-ink-faint hover:text-mint-500 transition-colors flex-shrink-0"
                      aria-label={isDone ? 'Desmarcar tarefa' : 'Concluir tarefa'}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-mint-500" />
                      ) : (
                        <Circle className="w-5 h-5 hover:text-brand-500" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1 pt-2 sm:pt-0">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span
                          className={`text-xs sm:text-sm font-medium break-words ${
                            isDone ? 'line-through text-ink-muted' : ''
                          }`}
                        >
                          {task.title}
                        </span>

                        {/* Priority Badge */}
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono uppercase font-semibold flex-shrink-0 ${pInfo.badge}`}
                        >
                          {pInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side / Actions: Time pill, Focus toggle, Delete */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 pt-1 sm:pt-0">
                    {/* Time Picker / Pill */}
                    {task.plannedTime ? (
                      <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-canvas-light dark:bg-night-card text-brand-600 dark:text-brand-400 border border-canvas-subtle dark:border-night-border flex items-center gap-1 font-semibold">
                        <Clock className="w-3 h-3 text-brand-500" /> {task.plannedTime}
                      </span>
                    ) : (
                      <div className="relative">
                        <input
                          type="time"
                          title="Agendar horário"
                          onChange={(e) => updateTask(task.id, { plannedTime: e.target.value })}
                          className="text-[10px] text-ink-muted hover:text-brand-600 bg-transparent border-none outline-none font-mono opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity w-14 cursor-pointer"
                        />
                      </div>
                    )}

                    {/* Star / Focus Button (touch-friendly min-h-[36px]) */}
                    {!isDone && (
                      <button
                        onClick={() => toggleFocus(task.id)}
                        className={`min-h-[36px] px-2 py-1 text-[11px] rounded-lg transition-all flex items-center justify-center ${
                          isFocus
                            ? 'bg-honey-100 text-honey-700 dark:bg-honey-950 dark:text-honey-300 font-semibold'
                            : 'text-ink-muted hover:text-honey-600 opacity-90 sm:opacity-0 sm:group-hover:opacity-100'
                        }`}
                        title={isFocus ? 'Remover das prioridades' : 'Definir como foco de hoje'}
                        aria-label="Alternar prioridade"
                      >
                        ★
                      </button>
                    )}

                    {/* Delete Task */}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center text-ink-muted hover:text-coral-500 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 rounded-lg"
                      title="Excluir tarefa"
                      aria-label="Excluir tarefa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
