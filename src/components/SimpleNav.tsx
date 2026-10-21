import React from 'react';
import {
  CheckSquare,
  Calendar,
  BookOpen,
  Settings,
  Moon,
  Sun,
  X,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SimpleNavProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onOpenSettings: () => void;
}

export const SimpleNav: React.FC<SimpleNavProps> = ({
  mobileOpen,
  setMobileOpen,
  onOpenSettings,
}) => {
  const { currentView, setCurrentView, toggleTheme, state } = useApp();

  const navItems = [
    {
      id: 'today',
      label: 'Hoje',
      icon: CheckSquare,
      badge: state.tasks.filter((t) => !t.status || t.status !== 'completed').length,
    },
    {
      id: 'schedule',
      label: 'Cronograma',
      icon: Calendar,
      badge: state.events.filter((e) => e.date === new Date().toISOString().slice(0, 10)).length,
    },
    {
      id: 'journal',
      label: 'Diário',
      icon: BookOpen,
    },
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
          className="fixed inset-0 z-40 bg-ink-primary/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white/95 dark:bg-night-surface/95 backdrop-blur-md border-r border-canvas-subtle dark:border-night-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-canvas-subtle dark:border-night-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center font-serif text-sm font-bold shadow-glow-brand">
              L
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-ink-primary dark:text-white leading-none">
                Life OS
              </h1>
              <p className="text-[10px] text-brand-600 dark:text-brand-400 mt-1 font-mono tracking-wide font-medium">
                Tarefas • Agenda • Diário
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink-primary dark:hover:text-white lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Main Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              currentView === item.id ||
              (item.id === 'today' && currentView === 'dashboard') ||
              (item.id === 'schedule' && currentView === 'calendar');

            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`interactive-tap w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-300 font-semibold shadow-soft border border-brand-200/60 dark:border-brand-800/40'
                    : 'text-ink-secondary dark:text-ink-muted hover:bg-canvas-subtle dark:hover:bg-night-card hover:text-ink-primary dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      active ? 'text-brand-600 dark:text-brand-400' : 'text-ink-muted'
                    }`}
                  />
                  <span className="text-sm">{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                      active
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-canvas-subtle dark:bg-night-card text-ink-secondary dark:text-ink-muted'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Data Persistence Status Indicator */}
        <div className="px-4 py-2.5 mx-3 mb-2 rounded-xl bg-canvas-subtle/70 dark:bg-night-card border border-canvas-subtle dark:border-night-border text-[11px] flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                state ? 'bg-mint-500' : 'bg-amber-500'
              }`}
            />
            <span className="text-[10px] text-ink-muted truncate">
              IndexedDB + Local
            </span>
          </div>
          <span className="text-[9px] font-mono font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-1.5 py-0.5 rounded">
            v2 ativo
          </span>
        </div>

        {/* Footer: Theme toggle & Backup settings */}
        <div className="p-3.5 border-t border-canvas-subtle dark:border-night-border flex items-center justify-between">
          <button
            onClick={onOpenSettings}
            className="interactive-tap flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-white hover:bg-canvas-subtle dark:hover:bg-night-card transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Ajustes & Backup</span>
          </button>

          <button
            onClick={toggleTheme}
            className="interactive-tap p-2 rounded-xl text-ink-muted hover:text-ink-primary dark:hover:text-white hover:bg-canvas-subtle dark:hover:bg-night-card transition-colors"
            title={isDark ? 'Modo claro' : 'Modo escuro'}
            aria-label="Alternar tema"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-brand-600" />}
          </button>
        </div>
      </aside>
    </>
  );
};
