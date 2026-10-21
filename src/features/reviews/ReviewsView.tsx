import React, { useState } from 'react';
import {
  ClipboardCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Save,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayKey, formatDateBR } from '../../lib/dateUtils';
import confetti from 'canvas-confetti';

export const ReviewsView: React.FC = () => {
  const { state, saveDailyReview, saveWeeklyReview } = useApp();

  const [reviewTab, setReviewTab] = useState<'daily' | 'weekly'>('daily');

  const todayKey = getTodayKey();
  const existingDaily = state.dailyReviews[todayKey];

  // Daily Review Form State
  const [highlights, setHighlights] = useState(existingDaily?.highlights || '');
  const [notes, setNotes] = useState(existingDaily?.notes || '');
  const [nextPriorities, setNextPriorities] = useState(
    existingDaily?.nextDayPriorities?.join('\n') || ''
  );
  const [actualMinutes, setActualMinutes] = useState<number>(
    existingDaily?.actualMinutes || 0
  );
  const [dailySaved, setDailySaved] = useState(false);

  // Today metrics
  const completedToday = state.tasks.filter(
    (t) => t.dueDate === todayKey && t.status === 'completed'
  );
  const pendingToday = state.tasks.filter(
    (t) => t.dueDate === todayKey && t.status !== 'completed'
  );

  // Planned minutes calculation from calendar events today
  const todayEvents = state.events.filter((e) => e.date === todayKey);
  const plannedMinutes = todayEvents.reduce((acc, evt) => {
    const [h1, m1] = evt.startTime.split(':').map(Number);
    const [h2, m2] = evt.endTime.split(':').map(Number);
    return acc + Math.max(0, h2 * 60 + m2 - (h1 * 60 + m1));
  }, 0);

  // Weekly review calculations (Past 7 days)
  const completedLast7Days = state.tasks.filter((t) => t.status === 'completed');
  const journalLast7Days = state.journal.length;

  const handleSaveDaily = (e: React.FormEvent) => {
    e.preventDefault();
    saveDailyReview({
      date: todayKey,
      completedTaskIds: completedToday.map((t) => t.id),
      pendingTaskIds: pendingToday.map((t) => t.id),
      plannedMinutes,
      actualMinutes: actualMinutes > 0 ? actualMinutes : undefined,
      highlights,
      notes,
      nextDayPriorities: nextPriorities
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean),
      updatedAt: new Date().toISOString(),
    });
    setDailySaved(true);
    confetti({ particleCount: 30, spread: 50 });
    setTimeout(() => setDailySaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-serif font-medium text-stone-900 dark:text-stone-100">
            Revisão da Vida
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Reflita sobre o que foi executado, avalie a cadência e defina prioridades para o próximo ciclo.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-stone-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setReviewTab('daily')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              reviewTab === 'daily'
                ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-subtle'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Revisão Diária
          </button>
          <button
            onClick={() => setReviewTab('weekly')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              reviewTab === 'weekly'
                ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-subtle'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Revisão Semanal
          </button>
        </div>
      </div>

      {reviewTab === 'daily' ? (
        /* DAILY REVIEW FORM */
        <form onSubmit={handleSaveDaily} className="space-y-6">
          {/* Summary stats of today */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 shadow-subtle">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                Tarefas Concluídas Hoje
              </span>
              <p className="text-xl font-semibold text-stone-900 dark:text-stone-100 mt-1">
                {completedToday.length} tarefas
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 shadow-subtle">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                Tempo Planejado
              </span>
              <p className="text-xl font-semibold text-stone-900 dark:text-stone-100 mt-1 font-mono">
                {Math.floor(plannedMinutes / 60)}h {plannedMinutes % 60}m
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 shadow-subtle">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                Tempo Efetivo (Opcional)
              </span>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min="0"
                  step="15"
                  placeholder="Ex: 180"
                  value={actualMinutes || ''}
                  onChange={(e) => setActualMinutes(Number(e.target.value))}
                  className="w-24 px-2 py-1 text-sm bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg"
                />
                <span className="text-xs text-stone-400">minutos</span>
              </div>
            </div>
          </div>

          {/* Form Prompts */}
          <div className="bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Principais Realizações do Dia
              </label>
              <textarea
                rows={3}
                placeholder="O que funcionou bem hoje? O que foi concluído que você se orgulha?"
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                className="w-full text-xs p-3 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl leading-relaxed outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Notas & Reflexões do Dia
              </label>
              <textarea
                rows={3}
                placeholder="Obstáculos encontrados, aprendizados ou ajustes para a rotina..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-3 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl leading-relaxed outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Prioridades para o Próximo Dia (1 por linha)
              </label>
              <textarea
                rows={3}
                placeholder="1. Escrever proposta do cliente&#10;2. Estudo de arquitetura&#10;3. Exercício físico matinal"
                value={nextPriorities}
                onChange={(e) => setNextPriorities(e.target.value)}
                className="w-full text-xs p-3 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl leading-relaxed outline-none font-mono"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              {dailySaved && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Revisão diária salva com sucesso!
                </span>
              )}
              <div className="ml-auto">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 text-white dark:text-stone-900 text-xs font-semibold rounded-xl shadow-sm transition-transform active:scale-95 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Salvar Revisão do Dia
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* WEEKLY REVIEW SUMMARY */
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-6">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Panorama Semanal
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-stone-50 dark:bg-slate-800/50 rounded-xl border border-stone-100 dark:border-slate-700">
                <span className="text-stone-400 font-mono text-[10px] uppercase">
                  Tarefas Concluídas
                </span>
                <p className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-1">
                  {completedLast7Days.length} tarefas
                </p>
              </div>

              <div className="p-3.5 bg-stone-50 dark:bg-slate-800/50 rounded-xl border border-stone-100 dark:border-slate-700">
                <span className="text-stone-400 font-mono text-[10px] uppercase">
                  Entradas no Diário
                </span>
                <p className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-1">
                  {journalLast7Days} reflexões
                </p>
              </div>

              <div className="p-3.5 bg-stone-50 dark:bg-slate-800/50 rounded-xl border border-stone-100 dark:border-slate-700">
                <span className="text-stone-400 font-mono text-[10px] uppercase">
                  Projetos Ativos
                </span>
                <p className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-1">
                  {state.projects.filter((p) => p.status === 'active').length} em andamento
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
                Reflexão Semanal
              </h4>
              <textarea
                rows={5}
                placeholder="Como foi o ritmo desta semana? O que você realizou e o que pretende ajustar para a próxima?"
                className="w-full text-xs p-3 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl leading-relaxed outline-none font-serif"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
