import React, { useState } from 'react';
import {
  Repeat,
  Plus,
  Check,
  X,
  SkipForward,
  Calendar,
  Flame,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useApp } from '../../context/AppContext';
import { Habit } from '../../types';
import { getTodayKey } from '../../lib/dateUtils';
import confetti from 'canvas-confetti';

export const HabitsView: React.FC = () => {
  const { state, addHabit, recordHabitStatus, deleteHabit, openQuickAdd } = useApp();

  const todayKey = getTodayKey();
  const todayDate = new Date();

  // Last 7 days for the weekly consistency matrix
  const past7Days = eachDayOfInterval({
    start: subDays(todayDate, 6),
    end: todayDate,
  });

  const handleRecord = (
    habitId: string,
    dateStr: string,
    status: 'completed' | 'skipped' | 'failed'
  ) => {
    recordHabitStatus(habitId, dateStr, status);
    if (status === 'completed') {
      confetti({ particleCount: 25, spread: 40, origin: { y: 0.8 } });
    }
  };

  // Calculate gentle streak without guilt
  const getStreak = (habit: Habit): number => {
    let streak = 0;
    let d = new Date();
    // Check backwards
    for (let i = 0; i < 30; i++) {
      const k = format(subDays(d, i), 'yyyy-MM-dd');
      const val = habit.history[k];
      if (val === 'completed') {
        streak++;
      } else if (val === 'skipped') {
        // Skip does not break streak
        continue;
      } else {
        if (i === 0 && !val) {
          // If today isn't done yet, check yesterday
          continue;
        }
        break;
      }
    }
    return streak;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-serif font-medium text-stone-900 dark:text-stone-100">
            Hábitos & Rotinas Recorrentes
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Construa consistência sustentável. O foco é cadência e presença, sem culpa ou cobranças extremas.
          </p>
        </div>

        <button
          onClick={() => openQuickAdd('habit')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 text-white dark:text-stone-900 text-xs font-medium rounded-xl shadow-sm"
        >
          <Plus className="w-4 h-4" /> Novo Hábito
        </button>
      </div>

      {/* Main Habits Table / Card Grid */}
      <div className="bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 rounded-2xl shadow-card overflow-hidden">
        {state.habits.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <Repeat className="w-10 h-10 mx-auto text-stone-300 mb-2" />
            <p className="text-sm font-medium">Nenhum hábito cadastrado</p>
            <p className="text-xs text-stone-400 mt-1">
              Comece com 1 ou 2 rotinas essenciais como leitura, caminhada ou hidratação.
            </p>
            <button
              onClick={() => openQuickAdd('habit')}
              className="mt-4 px-3 py-1.5 text-xs font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg"
            >
              Criar primeiro hábito
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-slate-800">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 p-4 bg-stone-50/70 dark:bg-slate-800/40 text-[11px] font-semibold text-stone-400 uppercase tracking-wider items-center">
              <div className="col-span-5">Hábito / Categoria</div>
              <div className="col-span-2 text-center">Consistência</div>
              <div className="col-span-5 text-right flex items-center justify-end gap-2 pr-2">
                {past7Days.map((d) => (
                  <div key={d.toISOString()} className="w-7 text-center">
                    <span className="block text-[9px] uppercase font-mono">
                      {format(d, 'EEE', { locale: ptBR })}
                    </span>
                    <span className="block text-xs font-mono font-medium text-stone-600 dark:text-stone-300">
                      {format(d, 'd')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Habit Rows */}
            {state.habits.map((habit) => {
              const streak = getStreak(habit);
              return (
                <div
                  key={habit.id}
                  className="grid grid-cols-12 gap-2 p-4 items-center hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="col-span-5 min-w-0 pr-2">
                    <h4 className="text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                      {habit.name}
                    </h4>
                    <p className="text-[10px] text-stone-400 mt-0.5 truncate">
                      {habit.category} {habit.preferredTime ? `• Horário: ${habit.preferredTime}` : ''}
                    </p>
                  </div>

                  <div className="col-span-2 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-cream-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-slate-700">
                      <Flame className="w-3 h-3 text-amber-500" />
                      {streak} {streak === 1 ? 'dia' : 'dias'}
                    </span>
                  </div>

                  {/* 7 Days Action Pills */}
                  <div className="col-span-5 flex items-center justify-end gap-2">
                    {past7Days.map((d) => {
                      const dateStr = format(d, 'yyyy-MM-dd');
                      const status = habit.history[dateStr];
                      const isToday = dateStr === todayKey;

                      return (
                        <div key={dateStr} className="relative group">
                          <button
                            onClick={() =>
                              handleRecord(
                                habit.id,
                                dateStr,
                                status === 'completed' ? 'skipped' : 'completed'
                              )
                            }
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                              status === 'completed'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : status === 'skipped'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
                                : isToday
                                ? 'border border-dashed border-stone-400 hover:border-stone-700'
                                : 'border border-stone-200 dark:border-slate-800 text-stone-300 hover:text-stone-500'
                            }`}
                            title={
                              status === 'completed'
                                ? 'Concluído'
                                : status === 'skipped'
                                ? 'Pulado intencionalmente'
                                : 'Pendente'
                            }
                          >
                            {status === 'completed' ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : status === 'skipped' ? (
                              <SkipForward className="w-3 h-3" />
                            ) : (
                              <span className="text-[9px] font-mono opacity-0 group-hover:opacity-100">
                                •
                              </span>
                            )}
                          </button>
                        </div>
                      );
                    })}

                    <button
                      onClick={() => {
                        if (confirm(`Excluir o hábito "${habit.name}"?`)) {
                          deleteHabit(habit.id);
                        }
                      }}
                      className="p-1 text-stone-400 hover:text-rose-600 ml-1 rounded"
                      title="Excluir hábito"
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
