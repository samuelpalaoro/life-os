import React, { useState } from 'react';
import {
  Download,
  Upload,
  RefreshCw,
  Trash2,
  FileText,
  User,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SettingsView: React.FC = () => {
  const {
    state,
    updatePreferences,
    exportDataJSON,
    importDataJSON,
    exportJournalMD,
    resetAllData,
  } = useApp();

  const [nameInput, setNameInput] = useState(state.preferences.userName || '');
  const [importStatus, setImportStatus] = useState<{ success?: boolean; msg?: string } | null>(
    null
  );
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferences({ userName: nameInput.trim() });
    alert('Nome atualizado com sucesso!');
  };

  const handleExportJSON = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDataJSON(content);
      if (res.success) {
        setImportStatus({ success: true, msg: 'Dados importados e sincronizados com sucesso!' });
      } else {
        setImportStatus({
          success: false,
          msg: res.error || 'Falha ao importar arquivo JSON.',
        });
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const handleResetData = () => {
    resetAllData();
    setShowClearConfirm(false);
    alert('Dados redefinidos para os valores padrão de demonstração.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-stone-200/80 dark:border-slate-800 pb-5">
        <h2 className="text-2xl font-serif font-medium text-stone-900 dark:text-stone-100">
          Ajustes, Backup & Privacidade
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Controle seus dados pessoais, realize exportações de segurança e personalize suas preferências.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-slate-800">
          <User className="w-4 h-4 text-stone-500" />
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Perfil & Saudação
          </h3>
        </div>

        <form onSubmit={handleSaveName} className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
              Como você gostaria de ser chamado(a)?
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="self-end px-4 py-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 text-white dark:text-stone-900 text-xs font-medium rounded-xl"
          >
            Salvar
          </button>
        </form>
      </div>

      {/* Backup and Data Export */}
      <div className="bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-slate-800">
          <HardDrive className="w-4 h-4 text-stone-500" />
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Backup & Restauração Local
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-stone-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                Exportar Backup Completo (JSON)
              </h4>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Baixa um arquivo JSON contendo todas as suas tarefas, eventos do calendário, diário, hábitos e metas.
            </p>
            <button
              onClick={handleExportJSON}
              className="w-full py-2 px-3 text-xs font-medium bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Baixar Backup JSON
            </button>
          </div>

          <div className="p-4 rounded-xl border border-stone-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                Exportar Diário (Markdown)
              </h4>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Exporta todas as suas entradas de diário em formato Markdown legível, ideal para Notion, Obsidian ou arquivo.
            </p>
            <button
              onClick={handleExportMarkdown}
              className="w-full py-2 px-3 text-xs font-medium bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" /> Baixar Diário (.md)
            </button>
          </div>
        </div>

        {/* Restore from JSON */}
        <div className="pt-3 border-t border-stone-100 dark:border-slate-800">
          <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
            Restaurar dados de um arquivo JSON
          </label>
          <p className="text-[11px] text-stone-500 mb-3">
            Selecione um arquivo de backup previamente exportado. O sistema validará a estrutura antes de restaurar.
          </p>
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="text-xs text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-white dark:file:bg-stone-100 dark:file:text-stone-900 hover:file:opacity-90"
          />

          {importStatus && (
            <div
              className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
                importStatus.success
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300'
              }`}
            >
              {importStatus.success ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              <span>{importStatus.msg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Privacy Notice & Clear Data */}
      <div className="bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Armazenamento & Privacidade
          </h3>
        </div>

        <p className="text-xs text-stone-500 leading-relaxed">
          O <strong>Life OS</strong> opera como uma aplicação web puramente estática. Seus dados são
          armazenados exclusivamente no navegador deste dispositivo via <code>localStorage</code>.
          Não há envio para servidores externos ou bancos de dados remotos.
        </p>

        <div className="pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-rose-600">Área de Risco: Limpar Dados</h4>
            <p className="text-[11px] text-stone-400">
              Redefine todas as tarefas, eventos e diário para os dados iniciais de demonstração.
            </p>
          </div>

          {showClearConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 text-xs text-stone-500 hover:bg-stone-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetData}
                className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
              >
                Sim, Limpar Tudo
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Redefinir Dados
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
