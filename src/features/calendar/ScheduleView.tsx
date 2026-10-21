import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useApp } from '../../context/AppContext';
import { getTodayKey } from '../../lib/dateUtils';
import confetti from 'canvas-confetti';

export const ScheduleView: React.FC = () => {
  const {
    state,
    addEvent,
    deleteEvent,
    toggleEventCompleted,
  } = useApp();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  // Default to day view on all screens, toggleable to week
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  // Form state for creating an activity/time block (positioned at bottom)
  const [showAddForm, setShowAddForm] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(getTodayKey());
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [eventTaskId, setEventTaskId] = useState('');
  const [eventIsFixed, setEventIsFixed] = useState(false);

  const todayKey = getTodayKey();
  const selectedDateStr = format(currentDate, 'yyyy-MM-dd');

  // Navigate dates
  const handlePrev = () => {
    setCurrentDate((d) => (viewMode === 'day' ? subDays(d, 1) : subDays(d, 7)));
  };

  const handleNext = () => {
    setCurrentDate((d) => (viewMode === 'day' ? addDays(d, 1) : addDays(d, 7)));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Day activities sorted chronologically
  const dayEvents = state.events
    .filter((e) => e.date === selectedDateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Week Interval
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Handle create event / block
  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    addEvent({
      title: eventTitle.trim(),
      date: eventDate,
      startTime: eventStartTime,
      endTime: eventEndTime,
      category: 'Geral',
      isFixed: eventIsFixed,
      taskId: eventTaskId || undefined,
    });

    setEventTitle('');
    setShowAddForm(false);
  };

  const handleToggleEvent = (id: string, currentlyDone?: boolean) => {
    toggleEventCompleted(id);
    if (!currentlyDone) {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.8 },
        colors: ['#754DF6', '#10B981', '#F6533C'],
      });
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-5 animate-fadeIn pb-8">
      {/* ========================================================================= */}
      {/* 1 & 2. COMPACT NAVIGATION BAR (Clean Top Area, Full Focus on Content)     */}
      {/* ========================================================================= */}
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

          <span className="text-xs sm:text-sm font-semibold text-ink-primary dark:text-stone-100 capitalize truncate ml-1">
            {viewMode === 'day'
              ? format(currentDate, "EEE, d 'de' MMMM", { locale: ptBR })
              : `${format(weekStart, 'd MMM', { locale: ptBR })} — ${format(weekEnd, 'd MMM', { locale: ptBR })}`}
          </span>
        </div>

        {/* View Switcher (Day / Week) */}
        <div className="flex items-center justify-center self-stretch sm:self-auto bg-canvas-subtle dark:bg-night-card p-1 rounded-xl text-xs border border-canvas-subtle dark:border-night-border">
          <button
            onClick={() => setViewMode('day')}
            className={`flex-1 sm:flex-initial min-h-[32px] px-3.5 py-1 rounded-lg transition-all ${
              viewMode === 'day'
                ? 'bg-white dark:bg-night-surface text-brand-600 dark:text-brand-400 font-semibold shadow-soft'
                : 'text-stone-400 dark:text-stone-500 hover:text-ink-primary dark:hover:text-stone-200'
            }`}
          >
            Dia
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`flex-1 sm:flex-initial min-h-[32px] px-3.5 py-1 rounded-lg transition-all ${
              viewMode === 'week'
                ? 'bg-white dark:bg-night-surface text-brand-600 dark:text-brand-400 font-semibold shadow-soft'
                : 'text-stone-400 dark:text-stone-500 hover:text-ink-primary dark:hover:text-stone-200'
            }`}
          >
            Semana
          </button>
        </div>
      </div>

      {/* Week Day Pills Strip on Mobile (Quick date switcher) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar sm:hidden">
        {weekDays.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const isSelected = dayStr === selectedDateStr;
          const isToday = dayStr === todayKey;

          return (
            <button
              key={dayStr}
              onClick={() => {
                setCurrentDate(day);
                setViewMode('day');
              }}
              className={`flex-1 min-w-[42px] py-2 px-1 rounded-xl flex flex-col items-center justify-center text-[10px] font-mono transition-all border ${
                isSelected
                  ? 'bg-brand-600 text-white border-brand-600 shadow-glow-brand font-bold'
                  : isToday
                  ? 'bg-coral-50 dark:bg-coral-950/30 text-coral-600 border-coral-200 dark:border-coral-800 font-bold'
                  : 'bg-white dark:bg-night-surface text-stone-400 dark:text-stone-500 border-canvas-subtle dark:border-night-border'
              }`}
            >
              <span className="uppercase text-[9px] opacity-80">
                {format(day, 'EEE', { locale: ptBR })[0]}
              </span>
              <span className="text-xs font-semibold">{format(day, 'd')}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN CRONOGRAMA SECTION (Day / Week)                                   */}
      {/* ========================================================================= */}
      {viewMode === 'day' ? (
        <div className="space-y-2">
          {dayEvents.length === 0 ? (
            <div className="py-12 sm:py-16 text-center border border-dashed border-canvas-subtle dark:border-night-border/70 rounded-2xl bg-white/30 dark:bg-night-surface/30 p-6">
              <Clock className="w-7 h-7 text-brand-500/50 mx-auto mb-2.5" />
              <p className="text-sm font-medium text-ink-primary dark:text-stone-200">
                Nenhuma atividade para este dia
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                Adicione compromissos ou blocos de tempo para organizar seu dia.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {dayEvents.map((evt) => {
                const linkedTask = state.tasks.find((t) => t.id === evt.taskId);

                return (
                  <div
                    key={evt.id}
                    className={`group flex items-start sm:items-center justify-between p-3 sm:p-3.5 rounded-xl border transition-all gap-2.5 ${
                      evt.completed
                        ? 'bg-canvas-subtle/30 dark:bg-night-card/25 border-canvas-subtle dark:border-night-border/40 text-stone-400 dark:text-stone-500'
                        : 'bg-white dark:bg-night-surface/90 border-canvas-subtle dark:border-night-border hover:border-brand-500/40 text-ink-primary dark:text-stone-100 shadow-soft'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <button
                        onClick={() => handleToggleEvent(evt.id, evt.completed)}
                        className={`min-h-[36px] min-w-[36px] flex items-center justify-center -ml-1 text-stone-300 dark:text-stone-600 hover:text-mint-500 transition-colors flex-shrink-0 ${
                          evt.completed ? 'text-mint-500' : ''
                        }`}
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
                          <span
                            className={`text-xs sm:text-sm font-medium break-words leading-tight ${
                              evt.completed ? 'line-through text-stone-400 dark:text-stone-500' : ''
                            }`}
                          >
                            {evt.title}
                          </span>
                          {evt.isFixed && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono uppercase bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 flex-shrink-0">
                              Fixo
                            </span>
                          )}
                        </div>
                        {linkedTask && (
                          <p className="text-[11px] text-brand-500/90 dark:text-brand-400/90 mt-0.5 font-medium truncate">
                            ↳ {linkedTask.title}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteEvent(evt.id)}
                      className="min-h-[34px] min-w-[34px] flex items-center justify-center text-stone-400 hover:text-red-400 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 rounded-lg flex-shrink-0"
                      title="Excluir horário"
                      aria-label="Excluir horário"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* VIEW: WEEK GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2.5">
          {weekDays.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const isToday = dayStr === todayKey;
            const isSelected = dayStr === selectedDateStr;
            const eventsForDay = state.events
              .filter((e) => e.date === dayStr)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div
                key={dayStr}
                onClick={() => {
                  setCurrentDate(day);
                  setViewMode('day');
                }}
                className={`p-3 rounded-2xl border flex flex-col min-h-[140px] sm:min-h-[170px] cursor-pointer transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500/10 dark:bg-brand-950/30 shadow-soft'
                    : isToday
                    ? 'border-coral-400 bg-coral-50/20 dark:bg-coral-950/20'
                    : 'border-canvas-subtle dark:border-night-border bg-white dark:bg-night-surface hover:border-brand-500/30'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-canvas-subtle dark:border-night-border text-xs">
                  <span className="font-mono uppercase text-stone-400 dark:text-stone-500 text-[10px]">
                    {format(day, 'EEEE', { locale: ptBR })}
                  </span>
                  <span
                    className={`font-mono font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday ? 'bg-coral-500 text-white' : 'text-ink-primary dark:text-stone-200'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                <div className="space-y-1.5 flex-1 overflow-y-auto">
                  {eventsForDay.length === 0 ? (
                    <span className="text-[10px] text-stone-400/50 dark:text-stone-500/50 italic">Sem eventos</span>
                  ) : (
                    eventsForDay.map((e) => (
                      <div
                        key={e.id}
                        className="p-1.5 rounded-lg bg-canvas-subtle dark:bg-night-card text-[10px] border border-canvas-subtle dark:border-night-border truncate"
                      >
                        <span className="font-mono font-semibold text-brand-600 dark:text-brand-400 mr-1">
                          {e.startTime}
                        </span>
                        <span className={e.completed ? 'line-through text-stone-400 dark:text-stone-500' : 'text-ink-primary dark:text-stone-200'}>
                          {e.title}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. NOVO HORÁRIO (Abaixo do Cronograma)                                    */}
      {/* Secondary in visual prominence, clean dashed trigger or expanded form     */}
      {/* ========================================================================= */}
      <section className="pt-2">
        {!showAddForm ? (
          <button
            onClick={() => {
              setEventDate(selectedDateStr);
              setShowAddForm(true);
            }}
            className="interactive-tap w-full py-3 px-4 rounded-xl border border-dashed border-canvas-subtle dark:border-night-border hover:border-brand-500/60 bg-white/40 dark:bg-night-surface/50 hover:bg-brand-500/5 text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-brand-600 dark:hover:text-brand-400 flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-brand-500" />
            <span>Novo horário</span>
          </button>
        ) : (
          <form
            onSubmit={handleCreateActivity}
            className="bg-white dark:bg-night-surface/95 border border-brand-500/40 rounded-xl p-3.5 sm:p-4 shadow-elevated space-y-3 animate-fadeIn"
          >
            <div className="flex items-center justify-between pb-2 border-b border-canvas-subtle dark:border-night-border">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 font-mono">
                Criar Bloco ou Compromisso
              </h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="min-h-[36px] px-2 text-xs text-stone-400 hover:text-stone-200 font-medium"
              >
                Cancelar
              </button>
            </div>

            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: Bloco de Foco / Reunião..."
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2.5 bg-canvas-light dark:bg-night-card border border-canvas-subtle dark:border-night-border rounded-xl text-ink-primary dark:text-stone-100 outline-none focus:border-brand-500"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-mono text-stone-400 dark:text-stone-500 mb-1">Data</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full min-h-[36px] text-xs px-2.5 py-1.5 bg-canvas-light dark:bg-night-card border border-canvas-subtle dark:border-night-border rounded-lg text-ink-primary dark:text-stone-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-stone-400 dark:text-stone-500 mb-1">Início</label>
                <input
                  type="time"
                  value={eventStartTime}
                  onChange={(e) => setEventStartTime(e.target.value)}
                  className="w-full min-h-[36px] text-xs px-2.5 py-1.5 bg-canvas-light dark:bg-night-card border border-canvas-subtle dark:border-night-border rounded-lg text-ink-primary dark:text-stone-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-stone-400 dark:text-stone-500 mb-1">Fim</label>
                <input
                  type="time"
                  value={eventEndTime}
                  onChange={(e) => setEventEndTime(e.target.value)}
                  className="w-full min-h-[36px] text-xs px-2.5 py-1.5 bg-canvas-light dark:bg-night-card border border-canvas-subtle dark:border-night-border rounded-lg text-ink-primary dark:text-stone-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[10px] font-mono text-stone-400 dark:text-stone-500 mb-1">
                  Vincular a uma tarefa (opcional)
                </label>
                <select
                  value={eventTaskId}
                  onChange={(e) => setEventTaskId(e.target.value)}
                  className="w-full min-h-[36px] text-xs px-2.5 py-1.5 bg-canvas-light dark:bg-night-card border border-canvas-subtle dark:border-night-border rounded-lg text-ink-primary dark:text-stone-100"
                >
                  <option value="">Nenhuma tarefa vinculada</option>
                  {state.tasks
                    .filter((t) => t.status !== 'completed')
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1 sm:pt-4 min-h-[36px]">
                <input
                  type="checkbox"
                  id="isFixedEvt"
                  checked={eventIsFixed}
                  onChange={(e) => setEventIsFixed(e.target.checked)}
                  className="w-4 h-4 rounded border-canvas-subtle text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="isFixedEvt" className="text-xs text-stone-500 dark:text-stone-400 cursor-pointer select-none">
                  Compromisso fixo inadiável
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-canvas-subtle dark:border-night-border">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-1.5 text-xs text-stone-400 hover:text-stone-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="interactive-tap min-h-[38px] px-4 py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-lg shadow-sm transition-all"
              >
                Salvar Horário
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};
