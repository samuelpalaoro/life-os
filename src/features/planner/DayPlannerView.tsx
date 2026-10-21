import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sliders,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { planMyDay } from '../../lib/planner';
import { getTodayKey, formatDateBR } from '../../lib/dateUtils';
import confetti from 'canvas-confetti';

export const DayPlannerView: React.FC = () => {
  const { state, addEvent, setCurrentView } = useApp();

  const todayKey = getTodayKey();
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [startHour, setStartHour] = useState(state.preferences.workStartHour || 8);
  const [endHour, setEndHour] = useState(state.preferences.workEndHour || 19);
  const [appliedCount, setAppliedCount] = useState<number | null>(null);

  // Run deterministic planner
  const planResult = planMyDay(
    state.tasks,
    state.events,
    selectedDate,
    startHour,
    endHour,
    state.preferences.defaultTaskDuration || 45
  );

  const handleApplySchedule = () => {
    let count = 0;
    planResult.scheduledSlots.forEach((slot) => {
      // Create calendar event
      addEvent({
        title: slot.task.title,
        description: slot.task.description,
        date: selectedDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        category: slot.task.category,
        taskId: slot.task.id,
        projectId: slot.task.projectId,
        isFixed: false,
      });
      count++;
    });

    setAppliedCount(count);
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-stone-200/80 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium text-xs">
          <Sparkles className="w-4 h-4" />
          <span>Distribuição Inteligente Sem IA</span>
        </div>
        <h2 className="text-2xl font-serif font-medium text-stone-900 dark:text-stone-100 mt-1">
          Planejar Meu Dia
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-2xl leading-relaxed">
          O sistema analisa seus compromissos fixos, calcula os blocos de tempo livres e distribui
          suas tarefas prioritárias de maneira realista, sem sobrecarregar sua rotina.
        </p>
      </div>

      {/* Preferences & Settings Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 rounded-2xl shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sliders className="w-4 h-4 text-stone-400" />
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-600 dark:text-stone-400">Janela de trabalho:</span>
            <input
              type="number"
              min="5"
              max="12"
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              className="w-14 px-2 py-1 text-center bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg text-xs"
            />
            <span>às</span>
            <input
              type="number"
              min="13"
              max="23"
              value={endHour}
              onChange={(e) => setEndHour(Number(e.target.value))}
              className="w-14 px-2 py-1 text-center bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg text-xs"
            />
            <span>h</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-600 dark:text-stone-400">Data planejada:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2.5 py-1 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* Overload Alert if applicable */}
      {planResult.isOverloaded && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold">Planejamento Sobrecarregado</h4>
            <p className="mt-0.5">{planResult.overloadMessage}</p>
          </div>
        </div>
      )}

      {/* Applied Success Message */}
      {appliedCount !== null && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>
              {appliedCount} bloco{appliedCount === 1 ? '' : 's'} de trabalho foram adicionados ao seu
              calendário com sucesso!
            </span>
          </div>
          <button
            onClick={() => setCurrentView('calendar')}
            className="font-semibold underline hover:text-emerald-800"
          >
            Abrir Calendário
          </button>
        </div>
      )}

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 shadow-subtle">
          <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400">
            Tempo Disponível
          </span>
          <p className="text-xl font-semibold text-stone-900 dark:text-stone-100 mt-1 font-mono">
            {Math.floor(planResult.availableWorkMinutes / 60)}h{' '}
            {planResult.availableWorkMinutes % 60}m
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 shadow-subtle">
          <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400">
            Tarefas Encaixadas
          </span>
          <p className="text-xl font-semibold text-stone-900 dark:text-stone-100 mt-1 font-mono">
            {planResult.scheduledSlots.length} tarefas
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 shadow-subtle">
          <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400">
            Tarefas Não Encaixadas
          </span>
          <p className="text-xl font-semibold text-stone-900 dark:text-stone-100 mt-1 font-mono">
            {planResult.unscheduledTasks.length} tarefas
          </p>
        </div>
      </div>

      {/* Suggested Slots List */}
      <div className="bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 rounded-2xl shadow-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Sugestão de Distribuição
            </h3>
            <p className="text-xs text-stone-400">
              Revise a sugestão abaixo. Nada é salvo no seu calendário sem sua confirmação.
            </p>
          </div>

          {planResult.scheduledSlots.length > 0 && appliedCount === null && (
            <button
              onClick={handleApplySchedule}
              className="px-4 py-2 text-xs font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 rounded-xl shadow-sm transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Confirmar & Agendar Blocos
            </button>
          )}
        </div>

        {planResult.scheduledSlots.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400">
            Nenhuma tarefa pendente para encaixar ou nenhum horário livre disponível na janela
            selecionada.
          </div>
        ) : (
          <div className="space-y-2.5">
            {planResult.scheduledSlots.map((slot, index) => (
              <div
                key={slot.task.id}
                className="flex items-center justify-between p-3 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-cream-50/50 dark:bg-slate-800/40 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-20 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {slot.startTime} - {slot.endTime}
                  </div>
                  <div>
                    <h4 className="font-medium text-stone-900 dark:text-stone-100">
                      {slot.task.title}
                    </h4>
                    <p className="text-[10px] text-stone-400 font-mono">
                      {slot.task.category} • Duração: {slot.durationMinutes} minutos
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold bg-stone-200 dark:bg-slate-700 text-stone-600 dark:text-stone-300">
                  {slot.task.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unscheduled Tasks section if any */}
      {planResult.unscheduledTasks.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3">
          <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
            Tarefas que ficaram de fora por falta de tempo
          </h4>
          <div className="space-y-1.5">
            {planResult.unscheduledTasks.map((t) => (
              <div
                key={t.id}
                className="p-2.5 rounded-lg border border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs text-stone-600 dark:text-stone-400"
              >
                <span>{t.title}</span>
                <span className="text-[10px] font-mono">
                  {t.estimatedDuration || 30}m • Prioridade: {t.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
