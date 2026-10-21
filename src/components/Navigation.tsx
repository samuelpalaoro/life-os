import React from 'react';
import {
  CheckSquare,
  Calendar,
  BookOpen,
  Settings,
  Moon,
  Sun,
  Download,
  WifiOff,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { pwaManager, PWAState } from '../lib/pwaManager';

interface NavigationProps {
  onOpenSettings: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onOpenSettings }) => {
  const { currentView, setCurrentView, toggleTheme, state } = useApp();
  const [pwaState, setPwaState] = React.useState<PWAState>(() => pwaManager.getState());

  React.useEffect(() => {
    return pwaManager.subscribe((st) => setPwaState(st));
  }, []);

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
      label: 'Anotações',
      icon: BookOpen,
    },
  ];

  const handleNav = (id: string) => {
    setCurrentView(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isDark = state.preferences.theme === 'dark';

  return (
    <>
      {/* ========================================================= */}
      {/* 1. DESKTOP SIDEBAR (Visible only on lg: screens and above) */}
      {/* ========================================================= */}
      <aside className="hidden lg:flex fixed top-0 bottom-0 left-0 z-40 w-64 bg-white/95 dark:bg-night-surface/95 backdrop-blur-md border-r border-canvas-subtle dark:border-night-border flex-col">
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-canvas-subtle dark:border-night-border">
          <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono tracking-widest uppercase">
            Tarefas • Agenda • Anotações
          </p>
        </div>

        {/* Desktop Navigation Links */}
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

        {/* PWA Install Promo / Offline Status */}
        {pwaState.canInstall && (
          <div className="px-3 pb-2">
            <button
              onClick={() => pwaManager.promptInstall()}
              className="interactive-tap w-full py-2 px-3 bg-gradient-to-r from-coral-600 to-coral-500 hover:from-coral-700 hover:to-coral-600 text-white rounded-xl text-xs font-semibold shadow-glow-coral flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar Aplicativo</span>
            </button>
          </div>
        )}

        {pwaState.isOffline && (
          <div className="px-3 pb-2">
            <div className="py-1.5 px-2.5 bg-honey-50 dark:bg-honey-500/10 border border-honey-200 dark:border-honey-500/30 text-honey-600 dark:text-honey-400 rounded-xl text-[11px] font-medium flex items-center gap-1.5">
              <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Modo Offline Ativo</span>
            </div>
          </div>
        )}

        {/* Desktop Footer: Settings & Theme */}
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

      {/* ========================================================= */}
      {/* 2. MOBILE BOTTOM NAVIGATION (Comfortable one-hand thumb zone) */}
      {/* ========================================================= */}
      <nav
        aria-label="Navegação móvel"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-night-surface/95 backdrop-blur-lg border-t border-canvas-subtle dark:border-night-border shadow-elevated"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
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
                className={`interactive-tap relative flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                  active
                    ? 'text-brand-600 dark:text-brand-400 font-semibold'
                    : 'text-ink-muted hover:text-ink-primary dark:hover:text-white'
                }`}
              >
                <div className="relative">
                  <div
                    className={`p-1.5 rounded-xl transition-colors ${
                      active
                        ? 'bg-brand-50 dark:bg-brand-950/60'
                        : 'bg-transparent'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-brand-600 text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-sm">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>

                <span className="text-[11px] mt-0.5 tracking-tight truncate max-w-full">
                  {item.label}
                </span>

                {/* Active indicator dot */}
                {active && (
                  <span className="w-1 h-1 rounded-full bg-brand-500 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
