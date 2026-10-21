import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Calendar, BookOpen, Repeat, FolderGit2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Priority, RecurrenceType } from '../types';
import { getTodayKey } from '../lib/dateUtils';

export const QuickAddModal: React.FC = () => {
  const {
    quickAddOpen,
    setQuickAddOpen,
    quickAddDefaultTab,
    addTask,
    addEvent,
    addJournalEntry,
    addHabit,
    addProject,
    state,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'task' | 'event' | 'journal' | 'habit' | 'project'>(quickAddDefaultTab);

  useEffect(() => {
    setActiveTab(quickAddDefaultTab);
  }, [quickAddDefaultTab]);

  // Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(getTodayKey());
  const [taskPriority, setTaskPriority] = useState<Priority>('normal');
  const [taskCategory, setTaskCategory] = useState(state.areas[0]?.name || 'Geral');
  const [taskProjectId, setTaskProjectId] = useState<string>('');
  const [taskEstimated, setTaskEstimated] = useState<number>(30);
  const [taskRecurrence, setTaskRecurrence] = useState<RecurrenceType>('none');

  // Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(getTodayKey());
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [eventCategory, setEventCategory] = useState(state.areas[0]?.name || 'Geral');
  const [eventIsFixed, setEventIsFixed] = useState(false);
  const [eventTaskId, setEventTaskId] = useState('');

  // Journal Form State
  const [journalTitle, setJournalTitle] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [journalMood, setJournalMood] = useState<'great' | 'good' | 'neutral' | 'tired' | 'stressed' | 'down'>('good');
  const [journalTags, setJournalTags] = useState('');

  // Habit Form State
  const [habitName, setHabitName] = useState('');
  const [habitCategory, setHabitCategory] = useState(state.areas[0]?.name || 'Geral');
  const [habitFrequency, setHabitFrequency] = useState<'daily' | 'weekdays'>('daily');

  // Project Form State
  const [projectName, setProjectName] = useState('');
  const [projectGoal, setProjectGoal] = useState('');
  const [projectCategory, setProjectCategory] = useState(state.areas[0]?.name || 'Geral');

  if (!quickAddOpen) return null;

  const handleClose = () => {
    setQuickAddOpen(false);
    // Reset forms
    setTaskTitle('');
    setEventTitle('');
    setJournalTitle('');
    setJournalContent('');
    setHabitName('');
    setProjectName('');
  };

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    addTask({
      title: taskTitle.trim(),
      dueDate: taskDueDate,
      priority: taskPriority,
      category: taskCategory,
      projectId: taskProjectId || undefined,
      estimatedDuration: taskEstimated,
      recurrence: taskRecurrence,
      tags: [],
      subtasks: [],
      status: 'pending',
    });
    handleClose();
  };

  const handleSubmitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    addEvent({
      title: eventTitle.trim(),
      date: eventDate,
      startTime: eventStartTime,
      endTime: eventEndTime,
      category: eventCategory,
      isFixed: eventIsFixed,
      taskId: eventTaskId || undefined,
    });
    handleClose();
  };

  const handleSubmitJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalContent.trim()) return;
    addJournalEntry({
      title: journalTitle.trim() || undefined,
      content: journalContent.trim(),
      mood: journalMood,
      tags: journalTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
    handleClose();
  };

  const handleSubmitHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;
    addHabit({
      name: habitName.trim(),
      category: habitCategory,
      frequency: habitFrequency,
      startDate: getTodayKey(),
    });
    handleClose();
  };

  const handleSubmitProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    addProject({
      name: projectName.trim(),
      mainGoal: projectGoal.trim() || 'Construir consistência e resultados.',
      category: projectCategory,
      startDate: getTodayKey(),
      status: 'active',
      milestones: [],
    });
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-floating border border-stone-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Captura Rápida
            </span>
            <span className="text-xs text-stone-400 font-mono">⌘J</span>
          </div>
          <button
            onClick={handleClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200/80 dark:border-slate-800 bg-stone-50 dark:bg-slate-900/50 px-2 pt-2 gap-1 overflow-x-auto">
          {[
            { id: 'task', label: 'Tarefa', icon: CheckSquare },
            { id: 'event', label: 'Bloco / Evento', icon: Calendar },
            { id: 'journal', label: 'Diário', icon: BookOpen },
            { id: 'habit', label: 'Hábito', icon: Repeat },
            { id: 'project', label: 'Projeto', icon: FolderGit2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-all whitespace-nowrap ${
                  active
                    ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-white border-t border-x border-stone-200 dark:border-slate-800 shadow-subtle'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto">
          {/* TASK TAB */}
          {activeTab === 'task' && (
            <form onSubmit={handleSubmitTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                  O que precisa ser feito? *
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="Ex: Escrever proposta do projeto..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Prazo final
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as Priority)}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    <option value="low">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Área da Vida
                  </label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    {state.areas.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Projeto (Opcional)
                  </label>
                  <select
                    value={taskProjectId}
                    onChange={(e) => setTaskProjectId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    <option value="">Nenhum projeto</option>
                    {state.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Duração estimada (minutos)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={taskEstimated}
                    onChange={(e) => setTaskEstimated(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Recorrência
                  </label>
                  <select
                    value={taskRecurrence}
                    onChange={(e) => setTaskRecurrence(e.target.value as RecurrenceType)}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    <option value="none">Não repete</option>
                    <option value="daily">Diária</option>
                    <option value="weekdays">Segunda a Sexta</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 rounded-lg shadow-sm"
                >
                  Salvar Tarefa
                </button>
              </div>
            </form>
          )}

          {/* EVENT TAB */}
          {activeTab === 'event' && (
            <form onSubmit={handleSubmitEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                  Título do Bloco / Compromisso *
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="Ex: Bloco de Deep Work / Reunião..."
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Início
                  </label>
                  <input
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Fim
                  </label>
                  <input
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Área / Categoria
                  </label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    {state.areas.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Vincular a uma Tarefa
                  </label>
                  <select
                    value={eventTaskId}
                    onChange={(e) => setEventTaskId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
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
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="fixedCheck"
                  checked={eventIsFixed}
                  onChange={(e) => setEventIsFixed(e.target.checked)}
                  className="rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="fixedCheck" className="text-xs text-stone-600 dark:text-stone-300">
                  Compromisso fixo inadiável (ex: consulta médica, reunião de trabalho)
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 rounded-lg shadow-sm"
                >
                  Salvar no Calendário
                </button>
              </div>
            </form>
          )}

          {/* JOURNAL TAB */}
          {activeTab === 'journal' && (
            <form onSubmit={handleSubmitJournal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                  Título (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Reflexões sobre a rotina..."
                  value={journalTitle}
                  onChange={(e) => setJournalTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                  O que está na sua mente hoje? *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Escreva livremente sobre seus pensamentos, aprendizados ou experiências..."
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white font-serif leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Como você está se sentindo?
                  </label>
                  <select
                    value={journalMood}
                    onChange={(e) => setJournalMood(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    <option value="great">Excelente ✨</option>
                    <option value="good">Bem / Produtivo 🙂</option>
                    <option value="neutral">Neutro / Normal 😐</option>
                    <option value="tired">Cansado 🥱</option>
                    <option value="stressed">Estressado ⚡</option>
                    <option value="down">Para baixo 🌧️</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Tags (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    placeholder="reflexão, estudos, ideias"
                    value={journalTags}
                    onChange={(e) => setJournalTags(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 rounded-lg shadow-sm"
                >
                  Registrar no Diário
                </button>
              </div>
            </form>
          )}

          {/* HABIT TAB */}
          {activeTab === 'habit' && (
            <form onSubmit={handleSubmitHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                  Nome do Hábito *
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="Ex: Leitura de 20 páginas, Caminhada..."
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Categoria
                  </label>
                  <select
                    value={habitCategory}
                    onChange={(e) => setHabitCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    {state.areas.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Frequência
                  </label>
                  <select
                    value={habitFrequency}
                    onChange={(e) => setHabitFrequency(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    <option value="daily">Todos os dias</option>
                    <option value="weekdays">Segunda a Sexta</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 rounded-lg shadow-sm"
                >
                  Criar Hábito
                </button>
              </div>
            </form>
          )}

          {/* PROJECT TAB */}
          {activeTab === 'project' && (
            <form onSubmit={handleSubmitProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                  Nome do Projeto *
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="Ex: Reforma do Quarto, Lançamento de Curso..."
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                  Objetivo Principal
                </label>
                <input
                  type="text"
                  placeholder="Ex: Conquistar um espaço produtivo e organizado."
                  value={projectGoal}
                  onChange={(e) => setProjectGoal(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                  Área da Vida
                </label>
                <select
                  value={projectCategory}
                  onChange={(e) => setProjectCategory(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
                >
                  {state.areas.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 rounded-lg shadow-sm"
                >
                  Criar Projeto
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
