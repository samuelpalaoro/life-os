import React, { useState } from 'react';
import {
  FolderGit2,
  Plus,
  Target,
  CheckCircle2,
  Circle,
  Calendar,
  Layers,
  ChevronRight,
  Trash2,
  Edit2,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Project, Goal } from '../../types';
import { formatDateBR } from '../../lib/dateUtils';

export const ProjectsView: React.FC = () => {
  const {
    state,
    addProject,
    updateProject,
    deleteProject,
    addGoal,
    updateGoal,
    deleteGoal,
    openQuickAdd,
    setCurrentView,
  } = useApp();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    state.projects[0]?.id || null
  );
  const [activeTab, setActiveTab] = useState<'projects' | 'goals'>('projects');

  const selectedProject = state.projects.find((p) => p.id === selectedProjectId) || null;

  // Compute calculated progress based on actual related tasks
  const getProjectStats = (projId: string) => {
    const relatedTasks = state.tasks.filter((t) => t.projectId === projId);
    const completedTasks = relatedTasks.filter((t) => t.status === 'completed');
    const percent =
      relatedTasks.length > 0
        ? Math.round((completedTasks.length / relatedTasks.length) * 100)
        : 0;

    return {
      total: relatedTasks.length,
      completed: completedTasks.length,
      percent,
      tasks: relatedTasks,
    };
  };

  const toggleMilestone = (projectId: string, milestoneId: string) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    const updated = project.milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    updateProject(projectId, { milestones: updated });
  };

  const addMilestone = (projectId: string, title: string) => {
    if (!title.trim()) return;
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    const newM = { id: `m-${Date.now()}`, title: title.trim(), completed: false };
    updateProject(projectId, { milestones: [...project.milestones, newM] });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-serif font-medium text-stone-900 dark:text-stone-100">
            Projetos & Objetivos Pessoais
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Estruture suas grandes visões em projetos acionáveis, marcos e tarefas concretas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Projects / Goals switcher */}
          <div className="flex items-center bg-stone-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'projects'
                  ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-subtle'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Projetos ({state.projects.length})
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'goals'
                  ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-subtle'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Metas de Vida ({state.goals.length})
            </button>
          </div>

          <button
            onClick={() => openQuickAdd('project')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 text-white dark:text-stone-900 text-xs font-medium rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4" /> Novo Projeto
          </button>
        </div>
      </div>

      {activeTab === 'projects' ? (
        /* PROJECTS VIEW (List + Detail Pane) */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Projects List (5 cols) */}
          <div className="md:col-span-5 space-y-3">
            {state.projects.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400 border border-dashed border-stone-200 dark:border-slate-800 rounded-2xl">
                Nenhum projeto cadastrado.
              </div>
            ) : (
              state.projects.map((proj) => {
                const active = proj.id === selectedProjectId;
                const stats = getProjectStats(proj.id);

                return (
                  <div
                    key={proj.id}
                    onClick={() => setSelectedProjectId(proj.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      active
                        ? 'bg-white dark:bg-slate-800 border-stone-900 dark:border-stone-400 shadow-card'
                        : 'bg-cream-50/50 dark:bg-slate-900 border-stone-200/80 dark:border-slate-800 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-stone-400">
                          {proj.category}
                        </span>
                        <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mt-0.5">
                          {proj.name}
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono font-semibold text-stone-700 dark:text-stone-300">
                        {stats.percent}%
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                      {proj.mainGoal}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full bg-stone-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-3">
                      <div
                        className="h-full bg-stone-900 dark:bg-stone-200 transition-all duration-500"
                        style={{ width: `${stats.percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-stone-400 mt-2 font-mono">
                      <span>
                        {stats.completed} de {stats.total} tarefas concluídas
                      </span>
                      {proj.targetDate && <span>Prazo: {proj.targetDate}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Project Details Pane (7 cols) */}
          <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-6">
            {!selectedProject ? (
              <div className="py-20 text-center text-xs text-stone-400">
                Selecione um projeto para ver detalhes, marcos e tarefas vinculadas.
              </div>
            ) : (
              (() => {
                const stats = getProjectStats(selectedProject.id);

                return (
                  <div className="space-y-6">
                    {/* Project Header */}
                    <div className="flex items-start justify-between border-b border-stone-100 dark:border-slate-800 pb-4">
                      <div>
                        <span className="text-xs font-mono uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold">
                          {selectedProject.category}
                        </span>
                        <h3 className="text-xl font-serif font-semibold text-stone-900 dark:text-stone-100 mt-1">
                          {selectedProject.name}
                        </h3>
                        {selectedProject.description && (
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                            {selectedProject.description}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`Excluir o projeto "${selectedProject.name}"?`)) {
                            deleteProject(selectedProject.id);
                            setSelectedProjectId(null);
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors rounded-lg"
                        title="Excluir projeto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Main Goal Callout */}
                    <div className="p-3.5 bg-cream-50 dark:bg-slate-800/40 border border-stone-200/80 dark:border-slate-700 rounded-xl text-xs">
                      <span className="text-[10px] font-mono uppercase font-semibold text-stone-400 block mb-1">
                        Objetivo Principal
                      </span>
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {selectedProject.mainGoal}
                      </p>
                    </div>

                    {/* Milestones / Marcos */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                        Marcos Importantes ({selectedProject.milestones.length})
                      </h4>
                      <div className="space-y-1.5">
                        {selectedProject.milestones.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-slate-800/50 text-xs"
                          >
                            <button
                              onClick={() => toggleMilestone(selectedProject.id, m.id)}
                              className="text-stone-400 hover:text-stone-700"
                            >
                              {m.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>
                            <span
                              className={`flex-1 ${
                                m.completed ? 'line-through text-stone-400' : 'text-stone-800 dark:text-stone-200'
                              }`}
                            >
                              {m.title}
                            </span>
                          </div>
                        ))}
                        {/* Inline add milestone */}
                        <input
                          type="text"
                          placeholder="+ Adicionar marco e pressionar Enter..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addMilestone(selectedProject.id, (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                          className="w-full text-xs py-1.5 px-3 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg outline-none"
                        />
                      </div>
                    </div>

                    {/* Linked Tasks */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                          Tarefas Vinculadas ({stats.total})
                        </h4>
                        <button
                          onClick={() => openQuickAdd('task')}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          + Vincular tarefa
                        </button>
                      </div>

                      {stats.tasks.length === 0 ? (
                        <p className="text-xs text-stone-400 py-3">
                          Nenhuma tarefa vinculada a este projeto ainda.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {stats.tasks.map((task) => (
                            <div
                              key={task.id}
                              className="p-2.5 rounded-lg border border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs"
                            >
                              <span
                                className={
                                  task.status === 'completed'
                                    ? 'line-through text-stone-400'
                                    : 'font-medium text-stone-800 dark:text-stone-200'
                                }
                              >
                                {task.title}
                              </span>
                              <span className="text-[10px] font-mono text-stone-400">
                                {task.dueDate || 'Sem prazo'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      ) : (
        /* GOALS VIEW */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.goals.map((goal) => (
              <div
                key={goal.id}
                className="p-5 bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-2xl shadow-card flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider font-semibold text-stone-400">
                    <span>{goal.category}</span>
                    <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-600">
                      {goal.timeframe === 'quarterly'
                        ? 'Trimestral'
                        : goal.timeframe === 'yearly'
                        ? 'Anual'
                        : 'Longo Prazo'}
                    </span>
                  </div>
                  <h4 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100 mt-2">
                    {goal.title}
                  </h4>
                  {goal.description && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                      {goal.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-stone-100 dark:border-slate-800 text-xs text-stone-400">
                  <span>Alvo: {goal.targetDate || 'A definir'}</span>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir o objetivo "${goal.title}"?`)) {
                        deleteGoal(goal.id);
                      }
                    }}
                    className="p-1 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
