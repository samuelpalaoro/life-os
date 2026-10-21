import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BookOpen,
  Repeat,
  FolderGit2,
  Sparkles,
  ClipboardCheck,
  Settings,
  Plus,
  Search,
  Moon,
  Sun,
  Menu,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { currentView, setCurrentView, openQuickAdd, setSearchOpen, toggleTheme, state } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Hoje & Resumo', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tarefas & To-do', icon: CheckSquare, badge: state.tasks.filter((t) => t.status !== 'completed').length },
    { id: 'calendar', label: 'Calendário & Blocos', icon: Calendar },
    { id: 'planner', label: 'Planejar Meu Dia', icon: Sparkles, highlight: true },
    { id: 'journal', label: 'Diário Pessoal', icon: BookOpen },
    { id: 'habits', label: 'Hábitos & Rotinas', icon: Repeat },
    { id: 'projects', label: 'Projetos & Metas', icon: FolderGit2 },
    { id: 'reviews', label: 'Revisão da Vida', icon: ClipboardCheck },
  ];

  const handleNav = (id: string) => {
    setCurrentView(id);
    setMobileOpen(false);
  };

  const isDark = state.preferences.theme === 'dark';

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-cream-100/90 dark:bg-slate-900/90 backdrop-blur-md border-r border-stone-200/80 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-stone-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 flex items-center justify-center font-serif text-lg font-bold shadow-subtle">
              L
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-stone-900 dark:text-stone-100 leading-none">
                Life OS
              </h1>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 tracking-wide uppercase font-mono">
                Claridade & Foco
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Action Buttons */}
        <div className="p-3 space-y-2">
          <button
            onClick={() => openQuickAdd('task')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-medium rounded-lg shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Criar / Captura Rápida</span>
          </button>

          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between py-2 px-3 bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 text-stone-500 dark:text-stone-400 text-xs rounded-lg border border-stone-200/70 dark:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>Buscar em tudo...</span>
            </div>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-stone-100 dark:bg-slate-700 text-stone-500 dark:text-stone-300 rounded border border-stone-200 dark:border-slate-600">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-stone-200/70 dark:bg-slate-800 text-stone-900 dark:text-white font-semibold shadow-subtle'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/40 dark:hover:bg-slate-800/50 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      item.highlight
                        ? 'text-amber-600 dark:text-amber-400'
                        : active
                        ? 'text-blue-700 dark:text-blue-400'
                        : 'text-stone-400 dark:text-stone-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-200/80 dark:bg-slate-700 text-stone-700 dark:text-stone-300 font-mono">
                    {item.badge}
                  </span>
                )}
                {item.highlight && !item.badge && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer / Settings / Theme toggle */}
        <div className="p-3 border-t border-stone-200/60 dark:border-slate-800/60 flex items-center justify-between">
          <button
            onClick={() => handleNav('settings')}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              currentView === 'settings'
                ? 'bg-stone-200/70 dark:bg-slate-800 text-stone-900 dark:text-white'
                : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Ajustes & Backup</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-slate-800 transition-colors"
            title={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            aria-label="Alternar tema"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
};
