import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Calendar,
  Flame,
  ArrowRight,
  Plus,
  Smile,
  BookOpen,
  Check,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayKey, formatDateBR, isTaskOverdue } from '../../lib/dateUtils';
import confetti from 'canvas-confetti';

export const DashboardView: React.FC = () => {
  const {
    state,
    addTask,
    toggleTaskStatus,
    openQuickAdd,
    setCurrentView,
    setFocusTaskIds,
    setCurrentMood,
    recordHabitStatus,
  } = useApp();

  const todayKey = getTodayKey();
  const todayDate = new Date();

  // Quick inline capture
  const [quickTaskInput, setQuickTaskInput] = useState('');

  // Greetings logic
  const hour = todayDate.getHours();
  const greeting =
    hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  // Metrics
  const todayTasks = state.tasks.filter((t) => t.dueDate === todayKey);
  const completedToday = todayTasks.filter((t) => t.status === 'completed');
  const overdueTasks = state.tasks.filter((t) => isTaskOverdue(t, todayDate));
  const progressPercent =
    todayTasks.length > 0 ? Math.round((completedToday.length / todayTasks.length) * 100) : 0;

  // Next upcoming calendar event today
  const todayEvents = state.events
    .filter((e) => e.date === todayKey)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const currentMinutes = todayDate.getHours() * 60 + todayDate.getMinutes();
  const nextEvent = todayEvents.find((e) => {
    const [h, m] = e.startTime.split(':').map(Number);
    return h * 60 + m >= currentMinutes;
  }) || todayEvents[0];

  // Focus tasks (up to 3)
  const focusTasks = state.tasks.filter((t) => state.preferences.focusTaskIds.includes(t.id));

  // Quick Inline Add Task
  const handleQuickTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskInput.trim()) return;
    addTask({
      title: quickTaskInput.trim(),
      dueDate: todayKey,
      priority: 'normal',
      category: state.areas[0]?.name || 'Geral',
      tags: [],
      subtasks: [],
      status: 'pending',
      recurrence: 'none',
      estimatedDuration: 30,
    });
    setQuickTaskInput('');
  };

  const handleTaskToggle = (id: string, currentlyCompleted: boolean) => {
    toggleTaskStatus(id);
    if (!currentlyCompleted) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
  };

  const moodEmojis: Record<string, { label: string; icon: string }> = {
    great: { label: 'Excelente', icon: '✨' },
    good: { label: 'Produtivo', icon: '🙂' },
    neutral: { label: 'Neutro', icon: '😐' },
    tired: { label: 'Cansado', icon: '🥱' },
    stressed: { label: 'Estressado', icon: '⚡' },
    down: { label: 'Para baixo', icon: '🌧️' },
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fadeIn">
      {/* Header Greeting & Mood Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-slate-800 pb-5">
        <div>
          <span className="text-xs uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
            {formatDateBR(todayDate, "EEEE, d 'de' MMMM")}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-medium text-stone-900 dark:text-stone-100 tracking-tight mt-0.5">
            {greeting}, {state.preferences.userName || 'Você'}.
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            {todayTasks.length > 0
              ? `${completedToday.length} de ${todayTasks.length} tarefas concluídas hoje (${progressPercent}%).`
              : 'Nenhuma tarefa com prazo para hoje. Aproveite para planejar o dia!'}
          </p>
        </div>

        {/* Mood Selector Widget */}
        <div className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl shadow-subtle">
          <span className="text-[11px] font-medium text-stone-500 px-2 flex items-center gap-1">
            <Smile className="w-3.5 h-3.5 text-stone-400" /> Como estou:
          </span>
          {Object.entries(moodEmojis).map(([key, item]) => {
            const isSelected = state.preferences.currentMood === key;
            return (
              <button
                key={key}
                onClick={() => setCurrentMood(key as any)}
                title={item.label}
                className={`w-7 h-7 text-xs flex items-center justify-center rounded-lg transition-transform ${
                  isSelected
                    ? 'bg-stone-200 dark:bg-slate-800 scale-110 shadow-sm'
                    : 'hover:bg-stone-100 dark:hover:bg-slate-800/60 opacity-60 hover:opacity-100'
                }`}
              >
                {item.icon}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overdue alert if any */}
      {overdueTasks.length > 0 && (
        <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              Você tem <strong>{overdueTasks.length} tarefa{overdueTasks.length > 1 ? 's' : ''} atrasada{overdueTasks.length > 1 ? 's' : ''}</strong> de dias anteriores.
            </span>
          </div>
          <button
            onClick={() => setCurrentView('tasks')}
            className="font-medium underline hover:text-amber-700 dark:hover:text-amber-300"
          >
            Revisar pendências
          </button>
        </div>
      )}

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide on desktop): Focus of the day, Schedule, Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Foco de Hoje (Top 3 Priorities) */}
          <div className="bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <Flame className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  Foco de Hoje
                </h3>
                <span className="text-[11px] text-stone-400 font-mono">(Até 3 prioridades)</span>
              </div>
              <button
                onClick={() => setCurrentView('planner')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Sparkles className="w-3.5 h-3.5" /> Planejar meu dia
              </button>
            </div>

            {focusTasks.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-stone-200 dark:border-slate-800 rounded-xl">
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">
                  Nenhum foco selecionado para hoje. Escolha suas 3 maiores vitórias.
                </p>
                <button
                  onClick={() => setCurrentView('tasks')}
                  className="px-3 py-1.5 text-xs font-medium bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 rounded-lg transition-colors"
                >
                  Selecionar tarefas principais
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {focusTasks.map((task, idx) => {
                  const isDone = task.status === 'completed';
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-stone-50 dark:bg-slate-900/40 border-stone-200/60 dark:border-slate-800 text-stone-400'
                          : 'bg-cream-50/50 dark:bg-slate-850 border-stone-200/90 dark:border-slate-700 text-stone-800 dark:text-stone-100 shadow-subtle'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => handleTaskToggle(task.id, isDone)}
                          className="flex-shrink-0 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5 hover:text-blue-600" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p className={`text-xs font-medium truncate ${isDone ? 'line-through text-stone-400' : ''}`}>
                            <span className="text-[10px] font-mono text-stone-400 mr-1.5">#{idx + 1}</span>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-stone-400">
                            {task.plannedTime && (
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3" /> {task.plannedTime}
                              </span>
                            )}
                            <span>• {task.category}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold bg-stone-100 dark:bg-slate-800 text-stone-500">
                        {task.priority}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Cronograma do Dia com Horários */}
          <div className="bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  Cronograma & Time Blocking
                </h3>
              </div>
              <button
                onClick={() => setCurrentView('calendar')}
                className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1"
              >
                Ver calendário <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {todayEvents.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-400 border border-dashed border-stone-200 dark:border-slate-800 rounded-xl">
                Nenhum bloco de tempo ou compromisso agendado para hoje.
                <div className="mt-2">
                  <button
                    onClick={() => openQuickAdd('event')}
                    className="px-3 py-1.5 text-xs font-medium bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 rounded-lg"
                  >
                    + Criar bloco de horário
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {todayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-stone-200/70 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700 transition-colors text-xs"
                  >
                    <div className="w-16 font-mono text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex-shrink-0">
                      {event.startTime} - {event.endTime}
                    </div>
                    <div
                      className="w-1.5 h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: event.color || '#3B82F6' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                        {event.title}
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {event.category} {event.location ? `• ${event.location}` : ''}
                      </p>
                    </div>
                    {event.isFixed && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono">
                        Fixo
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Habits, Next Event Card, Diary shortcut */}
        <div className="space-y-6">
          {/* Next upcoming appointment card */}
          {nextEvent && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-stone-900 to-stone-800 text-white dark:from-slate-900 dark:to-slate-850 border border-stone-800 shadow-card">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                Próximo Compromisso
              </span>
              <h4 className="text-base font-semibold mt-1 tracking-tight">{nextEvent.title}</h4>
              <p className="text-xs text-stone-300 flex items-center gap-1.5 mt-2 font-mono">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> {nextEvent.startTime} — {nextEvent.endTime}
              </p>
              {nextEvent.location && (
                <p className="text-xs text-stone-400 mt-1">Local: {nextEvent.location}</p>
              )}
            </div>
          )}

          {/* Daily Habits Checklist */}
          <div className="bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Hábitos de Hoje
              </h3>
              <button
                onClick={() => setCurrentView('habits')}
                className="text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                Gerenciar
              </button>
            </div>

            {state.habits.length === 0 ? (
              <p className="text-xs text-stone-400 py-3">Nenhum hábito cadastrado ainda.</p>
            ) : (
              <div className="space-y-2">
                {state.habits.slice(0, 5).map((habit) => {
                  const status = habit.history[todayKey];
                  const isDone = status === 'completed';
                  return (
                    <div
                      key={habit.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <p className={`text-xs font-medium truncate ${isDone ? 'line-through text-stone-400' : 'text-stone-800 dark:text-stone-200'}`}>
                          {habit.name}
                        </p>
                        <p className="text-[10px] text-stone-400">{habit.category}</p>
                      </div>
                      <button
                        onClick={() => recordHabitStatus(habit.id, todayKey, 'completed')}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'border border-stone-200 dark:border-slate-700 text-stone-300 hover:text-stone-600 dark:hover:text-stone-200'
                        }`}
                        title={isDone ? 'Concluído' : 'Marcar como feito'}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Journal Prompt / Reflection */}
          <div className="bg-cream-100/70 dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  Reflexão do Dia
                </h3>
              </div>
              <button
                onClick={() => setCurrentView('journal')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Abrir diário
              </button>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-serif italic mb-3">
              "Pelo que sou grato hoje? O que aprendi e mereceu minha atenção?"
            </p>
            <button
              onClick={() => openQuickAdd('journal')}
              className="w-full py-2 px-3 bg-white dark:bg-slate-800 hover:bg-stone-50 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-stone-200 text-xs font-medium rounded-lg shadow-subtle transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Escrever pensamento rápido
            </button>
          </div>

          {/* Quick shortcut to Daily Review */}
          <div className="p-4 rounded-xl border border-dashed border-stone-300 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-stone-800 dark:text-stone-200">Revisão do Dia</p>
              <p className="text-[11px] text-stone-400">Avalie suas realizações e organize o amanhã.</p>
            </div>
            <button
              onClick={() => setCurrentView('reviews')}
              className="p-2 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 transition-colors"
              title="Fazer revisão"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
