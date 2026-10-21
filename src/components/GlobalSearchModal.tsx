import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CheckSquare, Calendar, BookOpen, Repeat, FolderGit2, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const GlobalSearchModal: React.FC = () => {
  const { searchOpen, setSearchOpen, state, setCurrentView } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [searchOpen]);

  if (!searchOpen) return null;

  const q = query.trim().toLowerCase();

  // Search results
  const matchingTasks = q
    ? state.tasks.filter((t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
    : [];

  const matchingEvents = q
    ? state.events.filter((e) => e.title.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q))
    : [];

  const matchingJournal = q
    ? state.journal.filter(
        (j) =>
          j.title?.toLowerCase().includes(q) ||
          j.content.toLowerCase().includes(q) ||
          j.tags.some((t) => t.toLowerCase().includes(q))
      )
    : [];

  const matchingProjects = q
    ? state.projects.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
    : [];

  const matchingHabits = q
    ? state.habits.filter((h) => h.name.toLowerCase().includes(q) || h.description?.toLowerCase().includes(q))
    : [];

  const totalResults =
    matchingTasks.length + matchingEvents.length + matchingJournal.length + matchingProjects.length + matchingHabits.length;

  const navigateTo = (view: string) => {
    setCurrentView(view);
    setSearchOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-stone-900/50 backdrop-blur-sm animate-fadeIn"
      onClick={() => setSearchOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-floating border border-stone-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-stone-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-stone-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar tarefas, eventos, diário, hábitos, projetos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent border-none outline-none dark:text-white placeholder:text-stone-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono px-2 py-0.5 bg-stone-100 dark:bg-slate-800 text-stone-500 rounded border border-stone-200 dark:border-slate-700">
            ESC
          </span>
        </div>

        {/* Results Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {!query ? (
            <div className="py-8 text-center text-xs text-stone-400">
              Digite para buscar em todos os módulos da sua vida pessoal...
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              Nenhum resultado encontrado para "{query}".
            </div>
          ) : (
            <>
              {/* Tasks */}
              {matchingTasks.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" /> Tarefas ({matchingTasks.length})
                  </h4>
                  <div className="space-y-1">
                    {matchingTasks.slice(0, 5).map((t) => (
                      <div
                        key={t.id}
                        onClick={() => navigateTo('tasks')}
                        className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs group"
                      >
                        <span className={`font-medium ${t.status === 'completed' ? 'line-through text-stone-400' : 'text-stone-800 dark:text-stone-200'}`}>
                          {t.title}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-stone-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Events */}
              {matchingEvents.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Calendário & Blocos ({matchingEvents.length})
                  </h4>
                  <div className="space-y-1">
                    {matchingEvents.slice(0, 4).map((e) => (
                      <div
                        key={e.id}
                        onClick={() => navigateTo('calendar')}
                        className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs group"
                      >
                        <div>
                          <p className="font-medium text-stone-800 dark:text-stone-200">{e.title}</p>
                          <p className="text-[10px] text-stone-400">{e.date} • {e.startTime} - {e.endTime}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-stone-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Journal */}
              {matchingJournal.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Diário Pessoal ({matchingJournal.length})
                  </h4>
                  <div className="space-y-1">
                    {matchingJournal.slice(0, 4).map((j) => (
                      <div
                        key={j.id}
                        onClick={() => navigateTo('journal')}
                        className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs group"
                      >
                        <div>
                          <p className="font-medium text-stone-800 dark:text-stone-200 font-serif">
                            {j.title || 'Entrada sem título'}
                          </p>
                          <p className="text-[10px] text-stone-400 line-clamp-1">{j.content}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-stone-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {matchingProjects.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FolderGit2 className="w-3.5 h-3.5" /> Projetos ({matchingProjects.length})
                  </h4>
                  <div className="space-y-1">
                    {matchingProjects.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        onClick={() => navigateTo('projects')}
                        className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs group"
                      >
                        <span className="font-medium text-stone-800 dark:text-stone-200">{p.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-stone-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
