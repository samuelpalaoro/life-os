import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Calendar as CalendarIcon,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useApp } from '../../context/AppContext';
import { CalendarEvent } from '../../types';
import { timeToMinutes, findEventConflicts, getTodayKey } from '../../lib/dateUtils';

type CalendarMode = 'day' | 'week' | 'month' | 'agenda';

export const CalendarView: React.FC = () => {
  const {
    state,
    addEvent,
    updateEvent,
    deleteEvent,
    toggleEventCompleted,
    openQuickAdd,
    setCurrentView,
  } = useApp();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('day');

  const todayKey = getTodayKey();
  const selectedDateStr = format(currentDate, 'yyyy-MM-dd');

  // Navigation handlers
  const handlePrev = () => {
    if (calendarMode === 'day') setCurrentDate((d) => subDays(d, 1));
    else if (calendarMode === 'week') setCurrentDate((d) => subDays(d, 7));
    else if (calendarMode === 'month') setCurrentDate((d) => subMonths(d, 1));
    else setCurrentDate((d) => subDays(d, 7));
  };

  const handleNext = () => {
    if (calendarMode === 'day') setCurrentDate((d) => addDays(d, 1));
    else if (calendarMode === 'week') setCurrentDate((d) => addDays(d, 7));
    else if (calendarMode === 'month') setCurrentDate((d) => addMonths(d, 1));
    else setCurrentDate((d) => addDays(d, 7));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Day Events & Overlaps
  const dayEvents = state.events
    .filter((e) => e.date === selectedDateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Time slots for Day Timeline (07:00 to 22:00)
  const hoursRange = Array.from({ length: 16 }, (_, i) => i + 7);

  // Week Interval
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Month Interval
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fadeIn">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-serif font-medium text-stone-900 dark:text-stone-100">
            Calendário & Cronograma
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Distribua blocos de tempo (*time blocking*) e visualize compromissos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('planner')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900/50 rounded-xl hover:bg-amber-100 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Planejar Meu Dia
          </button>
          <button
            onClick={() => openQuickAdd('event')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 text-white dark:text-stone-900 text-xs font-medium rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4" /> Novo Bloco
          </button>
        </div>
      </div>

      {/* Navigation Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-subtle">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-medium bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 rounded-lg transition-colors"
          >
            Hoje
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800"
              aria-label="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm font-semibold text-stone-800 dark:text-stone-200 ml-2">
            {calendarMode === 'day' && format(currentDate, "d 'de' MMMM, yyyy", { locale: ptBR })}
            {calendarMode === 'week' &&
              `${format(weekStart, 'd MMM', { locale: ptBR })} — ${format(weekEnd, 'd MMM, yyyy', { locale: ptBR })}`}
            {calendarMode === 'month' && format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            {calendarMode === 'agenda' && 'Visão Agenda de Próximos Eventos'}
          </span>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-stone-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['day', 'week', 'month', 'agenda'] as CalendarMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setCalendarMode(mode)}
              className={`px-3 py-1 text-xs font-medium rounded-lg capitalize transition-colors ${
                calendarMode === mode
                  ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-subtle'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : mode === 'month' ? 'Mês' : 'Agenda'}
            </button>
          ))}
        </div>
      </div>

      {/* 1. DAY VIEW: TIMELINE */}
      {calendarMode === 'day' && (
        <div className="bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Linha do Tempo de {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h3>
              <p className="text-xs text-stone-400">
                {dayEvents.length} bloco{dayEvents.length === 1 ? '' : 's'} agendado{dayEvents.length === 1 ? '' : 's'}.
              </p>
            </div>
          </div>

          <div className="space-y-1 relative">
            {hoursRange.map((hour) => {
              const hourStr = `${String(hour).padStart(2, '0')}:00`;
              const hourEndStr = `${String(hour + 1).padStart(2, '0')}:00`;

              // Find events that intersect this 1-hour window
              const hourEvents = dayEvents.filter((e) => {
                const s = timeToMinutes(e.startTime);
                const end = timeToMinutes(e.endTime);
                const windowStart = hour * 60;
                const windowEnd = (hour + 1) * 60;
                return Math.max(s, windowStart) < Math.min(end, windowEnd);
              });

              return (
                <div key={hour} className="flex items-start min-h-[56px] border-t border-stone-100 dark:border-slate-800/60 py-1">
                  <div className="w-16 text-right pr-4 text-xs font-mono text-stone-400 select-none">
                    {hourStr}
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5 pl-3 border-l border-stone-200 dark:border-slate-800">
                    {hourEvents.map((evt) => {
                      const conflicts = findEventConflicts(evt, dayEvents);
                      const hasConflict = conflicts.length > 0;

                      return (
                        <div
                          key={evt.id}
                          className="p-2 rounded-xl text-xs flex items-center justify-between transition-all bg-cream-50/80 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 shadow-subtle hover:border-stone-400"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-2 h-7 rounded-full flex-shrink-0"
                              style={{ backgroundColor: evt.color || '#3B82F6' }}
                            />
                            <div className="min-w-0">
                              <p className={`font-medium text-stone-900 dark:text-stone-100 truncate ${evt.completed ? 'line-through text-stone-400' : ''}`}>
                                {evt.title}
                              </p>
                              <p className="text-[10px] text-stone-400 font-mono">
                                {evt.startTime} - {evt.endTime} • {evt.category} {evt.location ? `• ${evt.location}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {hasConflict && (
                              <span
                                title="Sobreposição de horários detectada!"
                                className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded font-mono"
                              >
                                <AlertTriangle className="w-3 h-3" /> Sobreposição
                              </span>
                            )}
                            <button
                              onClick={() => toggleEventCompleted(evt.id)}
                              className={`p-1 rounded text-stone-400 hover:text-emerald-600 ${
                                evt.completed ? 'text-emerald-600' : ''
                              }`}
                              title={evt.completed ? 'Desmarcar' : 'Concluir bloco'}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteEvent(evt.id)}
                              className="p-1 rounded text-stone-400 hover:text-rose-600"
                              title="Excluir bloco"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. WEEK VIEW */}
      {calendarMode === 'week' && (
        <div className="bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 rounded-2xl shadow-card overflow-x-auto p-4">
          <div className="grid grid-cols-7 gap-2 min-w-[700px]">
            {weekDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const isToday = dayStr === todayKey;
              const isSelected = dayStr === selectedDateStr;
              const eventsForDay = state.events.filter((e) => e.date === dayStr);

              return (
                <div
                  key={dayStr}
                  onClick={() => setCurrentDate(day)}
                  className={`p-3 rounded-xl border flex flex-col min-h-[360px] cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-stone-900 dark:border-stone-200 bg-stone-50/50 dark:bg-slate-800/40'
                      : isToday
                      ? 'border-blue-400 bg-blue-50/20 dark:bg-blue-950/10'
                      : 'border-stone-200/70 dark:border-slate-800 hover:bg-stone-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100 dark:border-slate-800">
                    <span className="text-[11px] font-medium text-stone-500 uppercase">
                      {format(day, 'EEE', { locale: ptBR })}
                    </span>
                    <span
                      className={`text-xs font-mono font-semibold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-blue-600 text-white'
                          : 'text-stone-800 dark:text-stone-200'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  <div className="space-y-1.5 flex-1 overflow-y-auto">
                    {eventsForDay.map((e) => (
                      <div
                        key={e.id}
                        className="p-1.5 rounded-lg text-[11px] bg-cream-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 shadow-subtle"
                      >
                        <p className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                          {e.title}
                        </p>
                        <p className="text-[9px] text-stone-400 font-mono">
                          {e.startTime} - {e.endTime}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MONTH VIEW */}
      {calendarMode === 'month' && (
        <div className="bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 rounded-2xl shadow-card p-4">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-stone-400 pb-2 border-b border-stone-100 dark:border-slate-800">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 pt-2">
            {monthDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const isToday = dayStr === todayKey;
              const isSelected = dayStr === selectedDateStr;
              const eventsForDay = state.events.filter((e) => e.date === dayStr);

              return (
                <div
                  key={dayStr}
                  onClick={() => {
                    setCurrentDate(day);
                    setCalendarMode('day');
                  }}
                  className={`min-h-[70px] sm:min-h-[85px] p-1.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'border-stone-900 dark:border-stone-200 bg-stone-50 dark:bg-slate-800'
                      : isToday
                      ? 'border-blue-400 bg-blue-50/20 dark:bg-blue-950/10'
                      : 'border-stone-100 dark:border-slate-800/60 hover:bg-stone-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <span
                    className={`text-xs font-mono font-medium ${
                      isToday ? 'text-blue-600 font-bold' : 'text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {eventsForDay.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {eventsForDay.slice(0, 2).map((e) => (
                        <div
                          key={e.id}
                          className="text-[9px] px-1 py-0.2 rounded bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300 truncate"
                        >
                          {e.startTime} {e.title}
                        </div>
                      ))}
                      {eventsForDay.length > 2 && (
                        <span className="text-[8px] text-stone-400 block text-right font-mono">
                          +{eventsForDay.length - 2} mais
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. AGENDA VIEW */}
      {calendarMode === 'agenda' && (
        <div className="bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 rounded-2xl shadow-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Agenda Cronológica
          </h3>
          {state.events.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">Nenhum evento registrado.</p>
          ) : (
            <div className="space-y-3">
              {[...state.events]
                .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))
                .map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-stone-200/80 dark:border-slate-800 hover:border-stone-300 text-xs"
                  >
                    <div>
                      <span className="text-[10px] font-mono text-stone-400 font-semibold uppercase">
                        {e.date}
                      </span>
                      <h4 className="font-medium text-stone-900 dark:text-stone-100 text-sm mt-0.5">
                        {e.title}
                      </h4>
                      <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                        {e.startTime} - {e.endTime} • {e.category} {e.location ? `• ${e.location}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteEvent(e.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
