import React, { useState, useEffect } from 'react';
import { Settings, Moon, Sun, Download, RefreshCw, WifiOff } from 'lucide-react';
import { useApp } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { SettingsModal } from './components/SettingsModal';
import { pwaManager, PWAState } from './lib/pwaManager';

// Simplified 3 Core Views
import { TodayView } from './features/dashboard/TodayView';
import { ScheduleView } from './features/calendar/ScheduleView';
import { SimpleJournalView } from './features/journal/SimpleJournalView';

export const AppContent: React.FC = () => {
  const { currentView, toggleTheme, state } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pwaState, setPwaState] = useState<PWAState>(() => pwaManager.getState());

  useEffect(() => {
    return pwaManager.subscribe((st) => setPwaState(st));
  }, []);

  const isDark = state.preferences.theme === 'dark';

  const renderActiveView = () => {
    switch (currentView) {
      case 'today':
      case 'dashboard':
      case 'tasks':
        return <TodayView />;
      case 'schedule':
      case 'calendar':
      case 'planner':
        return <ScheduleView />;
      case 'journal':
        return <SimpleJournalView />;
      default:
        return <TodayView />;
    }
  };

  const getPageTitle = () => {
    if (currentView === 'schedule' || currentView === 'calendar' || currentView === 'planner') {
      return 'Cronograma';
    }
    if (currentView === 'journal') {
      return 'Anotações';
    }
    return 'Hoje';
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-canvas-light dark:bg-night-base text-ink-primary dark:text-white transition-colors">
      {/* Responsive Navigation: Sidebar on Desktop, Bottom Bar on Mobile */}
      <Navigation onOpenSettings={() => setSettingsOpen(true)} />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Mobile Top Header (Clean, Compact with Page Title & Settings) */}
        <header className="lg:hidden sticky top-0 z-30 px-4 py-3 bg-white/90 dark:bg-night-surface/90 backdrop-blur-md border-b border-canvas-subtle dark:border-night-border flex items-center justify-between">
          <span className="text-sm font-semibold text-ink-primary dark:text-white tracking-tight">
            {getPageTitle()}
          </span>

          <div className="flex items-center gap-1">
            {pwaState.canInstall && (
              <button
                onClick={() => pwaManager.promptInstall()}
                className="interactive-tap p-1.5 px-2.5 rounded-xl bg-coral-600 hover:bg-coral-700 text-white text-[11px] font-semibold flex items-center gap-1 shadow-sm"
                aria-label="Instalar app"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Instalar</span>
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-ink-muted hover:text-ink-primary dark:hover:text-white hover:bg-canvas-subtle dark:hover:bg-night-card transition-colors"
              aria-label="Alternar tema"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-brand-600" />}
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-xl text-ink-muted hover:text-ink-primary dark:hover:text-white hover:bg-canvas-subtle dark:hover:bg-night-card transition-colors"
              aria-label="Abrir ajustes"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Update Ready Notification Banner */}
        {pwaState.updateAvailable && (
          <div className="bg-gradient-to-r from-brand-600 to-coral-600 text-white px-4 py-2.5 flex items-center justify-between text-xs font-medium shadow-md">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Nova versão disponível do Life OS!</span>
            </div>
            <button
              onClick={() => pwaManager.applyUpdate()}
              className="px-3 py-1 bg-white text-ink-primary font-bold rounded-lg text-[11px] hover:bg-brand-50 transition-colors"
            >
              Atualizar Agora
            </button>
          </div>
        )}

        {/* Offline Status Top Bar on Mobile */}
        {pwaState.isOffline && (
          <div className="lg:hidden bg-honey-500/15 border-b border-honey-500/30 text-honey-600 dark:text-honey-400 px-4 py-1.5 flex items-center justify-center gap-1.5 text-[11px] font-medium">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Você está offline. Todas as alterações serão salvas localmente.</span>
          </div>
        )}

        {/* View Viewport with Safe Bottom Padding so Mobile Bottom Nav Never Obscures Content */}
        <main className="flex-1 px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-safe-nav lg:pb-12 overflow-x-hidden">
          {renderActiveView()}
        </main>
      </div>

      {/* Lightweight Settings & Backup Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};
