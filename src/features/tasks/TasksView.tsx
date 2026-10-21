import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  AlertCircle,
  Copy,
  Trash2,
  Edit2,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  List,
  Kanban,
  Tag,
  FolderGit2,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, Priority, TaskStatus } from '../../types';
import { getTodayKey, formatDateBR, isTaskOverdue } from '../../lib/dateUtils';
import confetti from 'canvas-confetti';

type TaskViewFilter = 'inbox' | 'today' | 'upcoming' | 'overdue' | 'completed' | 'all';
type LayoutMode = 'list' | 'kanban';

export const TasksView: React.FC = () => {
  const {
    state,
    addTask,
    updateTask,
    deleteTask,
    duplicateTask,
    toggleTaskStatus,
    openQuickAdd,
    associateTaskToCalendar,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<TaskViewFilter>('today');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({});

  // Quick inline add task
  const [inlineTitle, setInlineTitle] = useState('');

  const todayKey = getTodayKey();
  const todayDate = new Date();

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    return state.tasks.filter((task) => {
      // 1. View Filter
      if (activeFilter === 'today') {
        if (task.dueDate !== todayKey) return false;
      } else if (activeFilter === 'upcoming') {
        if (!task.dueDate || task.dueDate <= todayKey || task.status === 'completed') return false;
      } else if (activeFilter === 'overdue') {
        if (!isTaskOverdue(task, todayDate)) return false;
      } else if (activeFilter === 'completed') {
        if (task.status !== 'completed') return false;
      } else if (activeFilter === 'inbox') {
        if (task.projectId || task.dueDate) return false;
      }

      // 2. Category / Area
      if (selectedCategory !== 'all' && task.category !== selectedCategory) return false;

      // 3. Priority
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false;

      // 4. Project
      if (selectedProjectId !== 'all' && task.projectId !== selectedProjectId) return false;

      // 5. Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q);
        const matchesTags = task.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }

      return true;
    });
  }, [
    state.tasks,
    activeFilter,
    selectedCategory,
    selectedPriority,
    selectedProjectId,
    searchQuery,
    todayKey,
    todayDate,
  ]);

  const handleToggleTask = (task: Task) => {
    const isCompleted = task.status === 'completed';
    toggleTaskStatus(task.id);
    if (!isCompleted) {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
    }
  };

  const handleInlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTitle.trim()) return;

    addTask({
      title: inlineTitle.trim(),
      dueDate: activeFilter === 'today' ? todayKey : undefined,
      priority: 'normal',
      category: state.areas[0]?.name || 'Geral',
      projectId: selectedProjectId !== 'all' ? selectedProjectId : undefined,
      tags: [],
      subtasks: [],
      status: 'pending',
      recurrence: 'none',
      estimatedDuration: 30,
    });
    setInlineTitle('');
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    updateTask(taskId, { subtasks: updatedSubtasks });
  };

  const addSubtask = (taskId: string, title: string) => {
    if (!title.trim()) return;
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newSub = {
      id: `st-${Date.now()}`,
      title: title.trim(),
      completed: false,
    };
    updateTask(taskId, { subtasks: [...task.subtasks, newSub] });
  };

  const priorityColors: Record<Priority, { label: string; badge: string }> = {
    urgent: { label: 'Urgente', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
    high: { label: 'Alta', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    normal: { label: 'Normal', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    low: { label: 'Baixa', badge: 'bg-stone-100 text-stone-600 dark:bg-slate-800 dark:text-stone-400' },
  };

  // Kanban Columns
  const kanbanColumns: { id: TaskStatus; title: string }[] = [
    { id: 'pending', title: 'Pendente' },
    { id: 'in_progress', title: 'Em Andamento' },
    { id: 'completed', title: 'Concluída' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fadeIn">
      {/* Top Header & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-serif font-medium text-stone-900 dark:text-stone-100">
            Gerenciador de Tarefas
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Organize afazeres, prazos, prioridades e subtarefas com clareza.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Layout Mode Toggle */}
          <div className="flex items-center bg-stone-100 dark:bg-slate-800 p-1 rounded-xl border border-stone-200 dark:border-slate-700">
            <button
              onClick={() => setLayoutMode('list')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                layoutMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-subtle'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
              title="Visualização em Lista"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayoutMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                layoutMode === 'kanban'
                  ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-subtle'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
              title="Visualização em Quadro Kanban"
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => openQuickAdd('task')}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 text-white dark:text-stone-900 text-xs font-medium rounded-xl shadow-sm transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Nova Tarefa
          </button>
        </div>
      </div>

      {/* Filter Tabs Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs font-medium border-b border-stone-200/80 dark:border-slate-800">
        {[
          { id: 'today', label: 'Hoje', count: state.tasks.filter((t) => t.dueDate === todayKey).length },
          { id: 'upcoming', label: 'Próximos Dias' },
          { id: 'inbox', label: 'Caixa de Entrada' },
          { id: 'overdue', label: 'Atrasadas', count: state.tasks.filter((t) => isTaskOverdue(t, todayDate)).length },
          { id: 'completed', label: 'Concluídas' },
          { id: 'all', label: 'Todas as Tarefas', count: state.tasks.length },
        ].map((tab) => {
          const active = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as TaskViewFilter)}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                active
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-semibold shadow-subtle'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    active
                      ? 'bg-white/20 text-white dark:text-stone-900'
                      : 'bg-stone-200 dark:bg-slate-700 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter Dropdowns & Search Bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Filtrar por título, descrição ou tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg dark:text-white outline-none focus:border-stone-400"
          />
        </div>

        {/* Category filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg dark:text-white"
        >
          <option value="all">Todas as Áreas</option>
          {state.areas.map((a) => (
            <option key={a.id} value={a.name}>
              {a.name}
            </option>
          ))}
        </select>

        {/* Priority filter */}
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg dark:text-white"
        >
          <option value="all">Todas as Prioridades</option>
          <option value="urgent">Urgente</option>
          <option value="high">Alta</option>
          <option value="normal">Normal</option>
          <option value="low">Baixa</option>
        </select>

        {/* Project filter */}
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg dark:text-white"
        >
          <option value="all">Todos os Projetos</option>
          {state.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Inline Quick Add Task */}
      <form onSubmit={handleInlineSubmit} className="relative">
        <input
          type="text"
          placeholder="+ Adicionar tarefa rapidamente neste filtro... (Pressione Enter)"
          value={inlineTitle}
          onChange={(e) => setInlineTitle(e.target.value)}
          className="w-full px-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-xl shadow-subtle focus:outline-none focus:ring-1 focus:ring-stone-400 dark:text-white placeholder:text-stone-400"
        />
      </form>

      {/* TASKS VIEW: LIST OR KANBAN */}
      {layoutMode === 'list' ? (
        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-stone-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/50">
              <CheckCircle2 className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                Nenhuma tarefa encontrada
              </p>
              <p className="text-xs text-stone-400 mt-1">
                Tudo limpo por aqui ou nenhum filtro correspondeu.
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isDone = task.status === 'completed';
              const isOverdue = isTaskOverdue(task, todayDate);
              const pInfo = priorityColors[task.priority];
              const project = state.projects.find((p) => p.id === task.projectId);
              const subtasksExpanded = expandedSubtasks[task.id];

              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isDone
                      ? 'bg-stone-50/60 dark:bg-slate-900/40 border-stone-200/50 dark:border-slate-800/60 text-stone-400'
                      : isOverdue
                      ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/60 dark:border-amber-900/40 text-stone-800 dark:text-stone-100 shadow-subtle'
                      : 'bg-white dark:bg-slate-900 border-stone-200/80 dark:border-slate-800 text-stone-800 dark:text-stone-100 shadow-subtle hover:border-stone-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => handleToggleTask(task)}
                        className="mt-0.5 flex-shrink-0 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 hover:text-blue-600" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`text-xs sm:text-sm font-medium ${
                              isDone ? 'line-through text-stone-400' : 'text-stone-900 dark:text-stone-100'
                            }`}
                          >
                            {task.title}
                          </h4>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase ${pInfo.badge}`}
                          >
                            {pInfo.label}
                          </span>
                          {project && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-stone-300 flex items-center gap-1">
                              <FolderGit2 className="w-3 h-3" /> {project.name}
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        {/* Meta info tags */}
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-400 flex-wrap">
                          {task.dueDate && (
                            <span
                              className={`flex items-center gap-1 font-mono ${
                                isOverdue ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''
                              }`}
                            >
                              <Calendar className="w-3 h-3" />
                              {formatDateBR(task.dueDate)}
                            </span>
                          )}
                          {task.plannedTime && (
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3" /> {task.plannedTime} ({task.estimatedDuration || 30}m)
                            </span>
                          )}
                          <span>• {task.category}</span>
                          {task.recurrence !== 'none' && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 dark:bg-slate-800 text-stone-500">
                              Repete: {task.recurrence}
                            </span>
                          )}
                          {task.subtasks.length > 0 && (
                            <button
                              onClick={() =>
                                setExpandedSubtasks((prev) => ({ ...prev, [task.id]: !prev[task.id] }))
                              }
                              className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1"
                            >
                              Subtarefas ({task.subtasks.filter((s) => s.completed).length}/
                              {task.subtasks.length})
                              {subtasksExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => duplicateTask(task.id)}
                        title="Duplicar tarefa"
                        className="p-1 rounded text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        title="Excluir tarefa"
                        className="p-1 rounded text-stone-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subtasks Accordion */}
                  {subtasksExpanded && (
                    <div className="mt-3 pl-8 pr-2 pt-2 border-t border-stone-100 dark:border-slate-800/80 space-y-1.5">
                      {task.subtasks.map((st) => (
                        <div key={st.id} className="flex items-center gap-2 text-xs">
                          <button
                            onClick={() => toggleSubtask(task.id, st.id)}
                            className="text-stone-400 hover:text-stone-600"
                          >
                            {st.completed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Circle className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span
                            className={st.completed ? 'line-through text-stone-400' : 'text-stone-700 dark:text-stone-300'}
                          >
                            {st.title}
                          </span>
                        </div>
                      ))}
                      {/* Quick subtask add input */}
                      <input
                        type="text"
                        placeholder="+ Adicionar subtarefa e pressionar Enter"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addSubtask(task.id, (e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                        className="w-full text-xs py-1 px-2 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded outline-none"
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* KANBAN BOARD */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-stone-100/70 dark:bg-slate-900/60 border border-stone-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-col"
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">
                    {col.title}
                  </h3>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-stone-200 dark:bg-slate-800 text-stone-600 dark:text-stone-400">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto min-h-[300px]">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-stone-200/80 dark:border-slate-700 shadow-subtle hover:border-stone-300 dark:hover:border-slate-600 transition-all text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-stone-900 dark:text-stone-100 leading-snug">
                          {task.title}
                        </p>
                        <button
                          onClick={() => handleToggleTask(task)}
                          className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                        >
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3 text-[10px] text-stone-400">
                        <span className="font-mono">{task.dueDate || 'Sem prazo'}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              updateTask(task.id, {
                                status:
                                  col.id === 'pending'
                                    ? 'in_progress'
                                    : col.id === 'in_progress'
                                    ? 'completed'
                                    : 'pending',
                              })
                            }
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Mover &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
