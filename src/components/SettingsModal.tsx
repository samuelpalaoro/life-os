import React, { useState, useEffect } from 'react';
import {
  Download,
  Upload,
  Moon,
  Sun,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldCheck,
  Database,
  Cloud,
  FileText,
  HelpCircle,
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { pwaManager, PWAState } from '../lib/pwaManager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [pwaState, setPwaState] = useState<PWAState>(() => pwaManager.getState());

  useEffect(() => {
    return pwaManager.subscribe((st) => setPwaState(st));
  }, []);
  const {
    state,
    saveStatus,
    lastSavedAt,
    saveErrorMessage,
    toggleTheme,
    exportDataJSON,
    importDataJSON,
    exportJournalMD,
    resetAllData,
  } = useApp();

  const [importStatus, setImportStatus] = useState<{ success?: boolean; msg?: string } | null>(
    null
  );
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');
  const [pendingFileContent, setPendingFileContent] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Supabase cloud sync explanation and config inputs
  const [showCloudInfo, setShowCloudInfo] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('life_os_supabase_url') || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => localStorage.getItem('life_os_supabase_key') || '');
  const [cloudSaved, setCloudSaved] = useState(false);

  if (!isOpen) return null;

  const isDark = state.preferences.theme === 'dark';

  const handleExportJSON = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-life-os-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    const md = exportJournalMD();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diario-life-os-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setPendingFileContent(content);
      setPendingFileName(file.name);
      setShowConfirmModal(true);
      setImportStatus(null);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const executeImport = () => {
    if (!pendingFileContent) return;

    const res = importDataJSON(pendingFileContent, importMode);
    setShowConfirmModal(false);
    setPendingFileContent(null);
    setPendingFileName(null);

    if (res.success) {
      setImportStatus({
        success: true,
        msg:
          importMode === 'merge'
            ? 'Dados mesclados com sucesso! Nenhum item foi duplicado ou apagado.'
            : 'Dados restaurados com sucesso! O estado anterior foi substituído.',
      });
    } else {
      setImportStatus({
        success: false,
        msg: res.error || 'Falha ao processar o arquivo de backup.',
      });
    }
  };

  const handleSaveCloudConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('life_os_supabase_url', supabaseUrl.trim());
    localStorage.setItem('life_os_supabase_key', supabaseAnonKey.trim());
    setCloudSaved(true);
    setTimeout(() => setCloudSaved(false), 3000);
  };

  const handleReset = () => {
    resetAllData();
    setShowClearConfirm(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink-primary/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[88dvh] sm:max-h-[90vh] bg-white dark:bg-night-surface rounded-t-3xl sm:rounded-2xl shadow-floating border-t sm:border border-canvas-subtle dark:border-night-border overflow-hidden flex flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-canvas-subtle dark:border-night-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />
            <h2 className="text-sm font-semibold text-ink-primary dark:text-white">
              Ajustes, Persistência & Backup
            </h2>
          </div>
          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-ink-muted hover:text-ink-primary dark:hover:text-white p-1 rounded-xl"
            aria-label="Fechar ajustes"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-6 text-xs overflow-y-auto">
          {/* Diagnostic Persistence Status Banner */}
          <div className="p-3.5 rounded-2xl bg-canvas-subtle/80 dark:bg-night-card border border-canvas-subtle dark:border-night-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink-primary dark:text-white flex items-center gap-1.5">
                <Database className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Motor de Armazenamento Ativo
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-mint-50 dark:bg-mint-950/40 text-mint-600 dark:text-mint-400 font-semibold border border-mint-200/50">
                IndexedDB + LocalStorage (v2)
              </span>
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Persistência dupla transacional: seus dados são gravados no <strong>IndexedDB</strong> (alta capacidade, isolado) com réplica de inicialização rápida no <strong>localStorage</strong>.
            </p>
            {lastSavedAt && (
              <p className="text-[10px] font-mono text-ink-muted pt-1">
                Última confirmação de gravação bem-sucedida: {lastSavedAt}
              </p>
            )}
            {saveErrorMessage && (
              <p className="text-[11px] text-coral-600 dark:text-coral-400 font-medium">
                ⚠️ {saveErrorMessage}
              </p>
            )}
          </div>

          {/* PWA & Offline Status Card */}
          <div className="p-3.5 rounded-2xl bg-canvas-subtle/80 dark:bg-night-card border border-canvas-subtle dark:border-night-border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink-primary dark:text-white flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-coral-600 dark:text-coral-400" />
                Progressive Web App (PWA)
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                  pwaState.isInstalled
                    ? 'bg-mint-50 dark:bg-mint-950/40 text-mint-600 dark:text-mint-400 border-mint-200/50'
                    : 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border-brand-200/50'
                }`}
              >
                {pwaState.isInstalled ? '✓ Instalado' : 'Pronto para Instalar'}
              </span>
            </div>

            <p className="text-[11px] text-ink-muted leading-relaxed">
              O Life OS funciona offline através de Service Worker com cache resiliente. Pode ser adicionado à tela inicial no celular ou como aplicativo de desktop autônomo sem molduras de navegador.
            </p>

            <div className="flex items-center justify-between pt-1 border-t border-canvas-subtle dark:border-night-border text-[11px]">
              <span className="flex items-center gap-1.5 text-ink-muted">
                {pwaState.isOffline ? (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-honey-500" />
                    <span>Conexão: <strong>Offline</strong></span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-mint-500" />
                    <span>Conexão: <strong>Online</strong></span>
                  </>
                )}
              </span>

              {pwaState.canInstall && (
                <button
                  type="button"
                  onClick={() => pwaManager.promptInstall()}
                  className="interactive-tap px-3 py-1.5 bg-coral-600 hover:bg-coral-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Instalar PWA</span>
                </button>
              )}
            </div>
          </div>

          {/* Appearance Toggle */}
          <div className="flex items-center justify-between pb-3.5 border-b border-canvas-subtle dark:border-night-border">
            <div>
              <p className="font-semibold text-ink-primary dark:text-white">Aparência do Aplicativo</p>
              <p className="text-[11px] text-ink-muted mt-0.5">Alternar entre modo claro e escuro</p>
            </div>
            <button
              onClick={toggleTheme}
              className="interactive-tap min-h-[42px] px-3.5 py-2 rounded-xl border border-canvas-subtle dark:border-night-border bg-canvas-light dark:bg-night-card hover:border-brand-300 transition-colors"
            >
              {isDark ? (
                <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                  <Sun className="w-4 h-4" /> Claro
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-brand-600 font-medium">
                  <Moon className="w-4 h-4" /> Escuro
                </div>
              )}
            </button>
          </div>

          {/* Backup Section */}
          <div className="space-y-3.5">
            <div>
              <p className="font-semibold text-ink-primary dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Backup & Exportação Segura
              </p>
              <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">
                O armazenamento do navegador não substitui um backup externo. Baixe arquivos para preservar suas tarefas e memórias.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={handleExportJSON}
                className="interactive-tap min-h-[44px] py-2.5 px-3 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-glow-brand flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" /> Exportar Backup JSON
              </button>

              <button
                onClick={handleExportMarkdown}
                className="interactive-tap min-h-[44px] py-2.5 px-3 text-xs font-semibold border border-canvas-subtle dark:border-night-border bg-white dark:bg-night-card text-ink-primary dark:text-white hover:border-brand-300 rounded-xl shadow-soft flex items-center justify-center gap-2 transition-all"
              >
                <FileText className="w-4 h-4 text-brand-500" /> Diário em Markdown (.md)
              </button>
            </div>

            {/* Restore Section */}
            <div className="pt-2 p-3.5 rounded-2xl bg-canvas-subtle/50 dark:bg-night-card/50 border border-canvas-subtle dark:border-night-border space-y-3">
              <label className="block text-xs font-semibold text-ink-primary dark:text-white">
                Restaurar ou Mesclar Backup
              </label>

              {/* Import Mode Radio */}
              <div className="space-y-1.5">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="mt-0.5 text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <span className="font-medium text-ink-primary dark:text-white">
                      Mesclar com dados atuais (Recomendado)
                    </span>
                    <p className="text-[11px] text-ink-muted">
                      Adiciona tarefas, eventos e notas do backup sem apagar nem duplicar o que você já tem.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer pt-1">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="mt-0.5 text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <span className="font-medium text-coral-600 dark:text-coral-400">
                      Substituir todos os dados existentes
                    </span>
                    <p className="text-[11px] text-ink-muted">
                      Substitui o estado atual pelo conteúdo integral do arquivo de backup.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-1">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelected}
                  className="w-full text-[11px] text-ink-muted file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-brand-50 dark:file:bg-brand-950/40 file:text-brand-600 dark:file:text-brand-300 hover:file:opacity-90 cursor-pointer"
                />
              </div>

              {importStatus && (
                <div
                  className={`p-3 rounded-xl text-[11px] flex items-start gap-2 ${
                    importStatus.success
                      ? 'bg-mint-50 text-mint-700 dark:bg-mint-500/10 dark:text-mint-400 border border-mint-200/50'
                      : 'bg-coral-50 text-coral-700 dark:bg-coral-500/10 dark:text-coral-400 border border-coral-200/50'
                  }`}
                >
                  {importStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{importStatus.msg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cloud Sync Section (Supabase Architecture) */}
          <div className="space-y-3 pt-2 border-t border-canvas-subtle dark:border-night-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-ink-primary dark:text-white flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  Sincronização na Nuvem (Opcional)
                </p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  Conexão com projeto Supabase pessoal com RLS
                </p>
              </div>
              <button
                onClick={() => setShowCloudInfo(!showCloudInfo)}
                className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline font-medium"
              >
                {showCloudInfo ? 'Ocultar' : 'Configurar'}
              </button>
            </div>

            {showCloudInfo && (
              <form onSubmit={handleSaveCloudConfig} className="p-3.5 rounded-2xl bg-canvas-subtle dark:bg-night-card border border-canvas-subtle dark:border-night-border space-y-3">
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  Para sincronizar entre celular e PC sem servidor central, conecte suas credenciais públicas anônimas do seu próprio projeto Supabase. <em>Nunca insira a service_role key.</em>
                </p>

                <div>
                  <label className="block text-[10px] font-mono text-ink-muted mb-1">
                    SUPABASE PROJECT URL:
                  </label>
                  <input
                    type="url"
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-night-surface border border-canvas-subtle dark:border-night-border rounded-xl text-ink-primary dark:text-white outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-ink-muted mb-1">
                    SUPABASE ANON PUBLIC KEY:
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-night-surface border border-canvas-subtle dark:border-night-border rounded-xl text-ink-primary dark:text-white outline-none focus:border-brand-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-ink-muted">
                    {cloudSaved ? '✓ Configuração salva localmente' : 'Salvo no navegador'}
                  </span>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-glow-brand"
                  >
                    Salvar Conexão
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Danger zone */}
          <div className="pt-3 border-t border-canvas-subtle dark:border-night-border flex items-center justify-between">
            <span className="text-[11px] text-ink-muted">Redefinir dados locais</span>
            {showClearConfirm ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="min-h-[36px] px-3 py-1.5 text-[11px] text-ink-muted hover:text-ink-primary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReset}
                  className="min-h-[36px] px-3.5 py-1.5 text-[11px] font-semibold bg-coral-600 text-white rounded-xl hover:bg-coral-700"
                >
                  Confirmar Redefinição
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="min-h-[36px] text-[11px] text-coral-500 hover:text-coral-600 font-medium hover:underline p-1"
              >
                Limpar dados
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal Before Overwriting / Merging Data */}
      {showConfirmModal && pendingFileName && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-ink-primary/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-night-surface rounded-2xl p-5 shadow-floating border border-canvas-subtle dark:border-night-border space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink-primary dark:text-white">
                  Confirmar Importação
                </h3>
                <p className="text-[11px] text-ink-muted truncate max-w-[220px]">
                  {pendingFileName}
                </p>
              </div>
            </div>

            <p className="text-xs text-ink-secondary dark:text-ink-muted leading-relaxed">
              {importMode === 'merge' ? (
                <>
                  Você escolheu <strong>Mesclar Dados</strong>. Os itens do arquivo serão combinados com suas tarefas e anotações atuais sem apagá-las.
                </>
              ) : (
                <span className="text-coral-600 dark:text-coral-400">
                  Atenção: você escolheu <strong>Substituir Tudo</strong>. Todos os dados atuais do seu navegador serão substituídos pelos dados do arquivo.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-2 text-xs text-ink-muted hover:text-ink-primary dark:hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={executeImport}
                className={`px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-soft ${
                  importMode === 'merge'
                    ? 'bg-brand-600 hover:bg-brand-700'
                    : 'bg-coral-600 hover:bg-coral-700'
                }`}
              >
                Confirmar Importação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
