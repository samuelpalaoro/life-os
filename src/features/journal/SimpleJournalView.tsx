import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Calendar,
  Trash2,
  FileDown,
  ChevronLeft,
  Menu,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateBR } from '../../lib/dateUtils';

export const SimpleJournalView: React.FC = () => {
  const {
    state,
    saveStatus,
    lastSavedAt,
    saveErrorMessage,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    exportJournalMD,
  } = useApp();

  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(
    state.journal[0]?.id || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isDebouncing, setIsDebouncing] = useState(false);
  // On mobile: toggle between 'editor' view and 'history' list view
  const [mobileTab, setMobileTab] = useState<'editor' | 'history'>('editor');

  // Active entry being edited
  const currentEntry = state.journal.find((j) => j.id === selectedEntryId) || null;

  // Local editor draft state
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');

  // Keep refs for instant unmount/cleanup flush to guarantee no data loss on navigation
  const draftRef = React.useRef({ id: '', title: '', content: '' });

  // Sync draft when selectedEntry changes (and flush previous entry if dirty)
  useEffect(() => {
    // Flush previous entry if changed
    if (draftRef.current.id && draftRef.current.id !== currentEntry?.id) {
      updateJournalEntry(draftRef.current.id, {
        title: draftRef.current.title,
        content: draftRef.current.content,
      });
    }

    if (currentEntry) {
      setDraftTitle(currentEntry.title || '');
      setDraftContent(currentEntry.content || '');
      draftRef.current = {
        id: currentEntry.id,
        title: currentEntry.title || '',
        content: currentEntry.content || '',
      };
    }
  }, [currentEntry?.id]);

  // Keep draftRef in sync with input changes
  useEffect(() => {
    if (currentEntry) {
      draftRef.current = {
        id: currentEntry.id,
        title: draftTitle,
        content: draftContent,
      };
    }
  }, [draftTitle, draftContent, currentEntry?.id]);

  // Flush on component unmount (e.g. user clicks another navigation tab)
  useEffect(() => {
    return () => {
      if (draftRef.current.id) {
        updateJournalEntry(draftRef.current.id, {
          title: draftRef.current.title,
          content: draftRef.current.content,
        });
      }
    };
  }, []);

  // Debounced auto-save
  useEffect(() => {
    if (!currentEntry) return;

    // Skip initial mount auto-trigger if content is identical
    if (currentEntry.title === draftTitle && currentEntry.content === draftContent) {
      return;
    }

    setIsDebouncing(true);
    const timer = setTimeout(() => {
      updateJournalEntry(currentEntry.id, {
        title: draftTitle,
        content: draftContent,
      });
      setIsDebouncing(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [draftTitle, draftContent]);

  // Create new blank entry
  const handleCreateNew = () => {
    const newEntry = addJournalEntry({
      title: 'Nota de ' + formatDateBR(new Date(), 'dd/MM'),
      content: '',
      tags: [],
    });
    setSelectedEntryId(newEntry.id);
    setMobileTab('editor');
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

  // Filter entries
  const filteredJournal = state.journal.filter((j) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      j.title?.toLowerCase().includes(q) ||
      j.content.toLowerCase().includes(q)
    );
  });

  const wordCount = draftContent.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 sm:space-y-7 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 sm:pb-5 border-b border-canvas-subtle dark:border-night-border">
        <div className="min-w-0">
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-brand-600 dark:text-brand-400">
            Escrita & Pensamento Consciente
          </span>
          <h1 className="text-2xl sm:text-4xl font-serif font-medium text-ink-primary dark:text-white tracking-tight mt-0.5">
            Diário Pessoal
          </h1>
          <p className="text-xs text-ink-secondary dark:text-ink-muted mt-0.5">
            Um ambiente calmo e confortável para registrar seus pensamentos.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleExportMarkdown}
            className="interactive-tap min-h-[42px] flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-ink-secondary dark:text-ink-muted hover:text-brand-600 border border-canvas-subtle dark:border-night-border rounded-xl bg-white dark:bg-night-surface shadow-soft transition-colors"
            title="Exportar Markdown"
          >
            <FileDown className="w-3.5 h-3.5 text-brand-500" />
            <span>Exportar .md</span>
          </button>

          <button
            onClick={handleCreateNew}
            className="interactive-tap min-h-[42px] flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-glow-brand transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Entrada</span>
          </button>
        </div>
      </div>

      {/* Mobile Mode Switcher (Editor vs Histórico) */}
      <div className="flex sm:hidden bg-canvas-subtle dark:bg-night-card p-1 rounded-xl border border-canvas-subtle dark:border-night-border text-xs">
        <button
          onClick={() => setMobileTab('editor')}
          className={`flex-1 min-h-[38px] rounded-lg font-medium transition-all ${
            mobileTab === 'editor'
              ? 'bg-white dark:bg-night-surface text-brand-600 dark:text-white font-semibold shadow-soft'
              : 'text-ink-muted'
          }`}
        >
          Escrever / Editar
        </button>
        <button
          onClick={() => setMobileTab('history')}
          className={`flex-1 min-h-[38px] rounded-lg font-medium transition-all ${
            mobileTab === 'history'
              ? 'bg-white dark:bg-night-surface text-brand-600 dark:text-white font-semibold shadow-soft'
              : 'text-ink-muted'
          }`}
        >
          Histórico ({state.journal.length})
        </button>
      </div>

      {/* Responsive Split Pane (Mobile toggle / Desktop 2-columns) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 min-h-[460px]">
        {/* Left Column (5 cols): History List */}
        <div
          className={`md:col-span-5 space-y-3 flex-col ${
            mobileTab === 'history' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              placeholder="Buscar em pensamentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 min-h-[40px] text-xs bg-white dark:bg-night-surface border border-canvas-subtle dark:border-night-border rounded-xl text-ink-primary dark:text-white shadow-soft outline-none focus:border-brand-500"
            />
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[520px] pr-1">
            {filteredJournal.length === 0 ? (
              <div className="py-12 text-center text-xs text-ink-muted border border-dashed border-canvas-subtle dark:border-night-border rounded-2xl p-4">
                Nenhuma reflexão encontrada.
              </div>
            ) : (
              filteredJournal.map((entry) => {
                const active = entry.id === selectedEntryId;
                return (
                  <div
                    key={entry.id}
                    onClick={() => {
                      setSelectedEntryId(entry.id);
                      setMobileTab('editor'); // Switch to editor upon tapping an entry on mobile
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      active
                        ? 'bg-brand-50/70 dark:bg-night-card border-brand-500 shadow-soft ring-1 ring-brand-500/10'
                        : 'bg-white dark:bg-night-surface border-canvas-subtle dark:border-night-border hover:border-brand-200'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-brand-600 dark:text-brand-400 font-semibold block mb-1">
                      {formatDateBR(entry.date, "dd 'de' MMMM, yyyy")}
                    </span>
                    <h4 className="text-xs font-semibold text-ink-primary dark:text-white truncate">
                      {entry.title || 'Sem título'}
                    </h4>
                    <p className="text-[11px] text-ink-muted mt-1 line-clamp-2 leading-relaxed font-serif">
                      {entry.content || 'Sem texto...'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Editorial Writing Canvas */}
        <div
          className={`md:col-span-7 bg-white dark:bg-night-surface border border-canvas-subtle dark:border-night-border rounded-2xl p-4 sm:p-6 shadow-soft flex-col justify-between ${
            mobileTab === 'editor' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {!currentEntry ? (
            <div className="py-20 text-center text-ink-muted">
              <BookOpen className="w-8 h-8 mx-auto text-brand-300 dark:text-brand-500 mb-2 opacity-80" />
              <p className="text-sm font-serif font-medium text-ink-primary dark:text-white">
                Selecione ou crie uma entrada para começar a escrever
              </p>
              <button
                onClick={handleCreateNew}
                className="mt-3 text-xs text-brand-600 font-semibold underline"
              >
                + Criar entrada agora
              </button>
            </div>
          ) : (
            <div className="space-y-3.5 flex-1 flex flex-col min-w-0">
              {/* Meta Top Bar */}
              <div className="flex items-center justify-between border-b border-canvas-subtle dark:border-night-border pb-2.5 text-[11px] text-ink-muted flex-wrap gap-2">
                <span className="font-mono text-brand-600 dark:text-brand-400 font-medium truncate">
                  {formatDateBR(currentEntry.date, "EEE, d 'de' MMMM, HH:mm")}
                </span>

                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1 transition-all ${
                      isDebouncing || saveStatus === 'saving'
                        ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
                        : saveStatus === 'error'
                        ? 'text-coral-600 dark:text-coral-400 bg-coral-50 dark:bg-coral-950/40'
                        : 'text-mint-600 dark:text-mint-400 bg-mint-50 dark:bg-mint-950/40'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isDebouncing || saveStatus === 'saving'
                          ? 'bg-amber-500 animate-pulse'
                          : saveStatus === 'error'
                          ? 'bg-coral-500'
                          : 'bg-mint-500'
                      }`}
                    />
                    {isDebouncing || saveStatus === 'saving'
                      ? 'Salvando...'
                      : saveStatus === 'error'
                      ? 'Erro ao salvar'
                      : lastSavedAt
                      ? `Salvo às ${lastSavedAt}`
                      : 'Salvo'}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm('Deseja excluir esta entrada do diário?')) {
                        deleteJournalEntry(currentEntry.id);
                        setSelectedEntryId(null);
                        setMobileTab('history');
                      }
                    }}
                    className="min-h-[34px] min-w-[34px] flex items-center justify-center p-1 text-ink-muted hover:text-coral-500 transition-colors rounded-lg"
                    title="Excluir entrada"
                    aria-label="Excluir entrada"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <input
                type="text"
                placeholder="Título da sua reflexão..."
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="w-full text-lg sm:text-2xl font-serif font-semibold text-ink-primary dark:text-white bg-transparent border-none outline-none placeholder:text-ink-muted/50 py-1"
              />

              {/* Writing Canvas (Adapts gracefully without vertical cutoff on mobile keyboard) */}
              <textarea
                rows={11}
                placeholder="Escreva livremente aqui sobre seu dia, reflexões ou aprendizados..."
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                className="w-full flex-1 min-h-[220px] text-sm sm:text-base font-serif leading-relaxed text-ink-primary dark:text-stone-200 bg-transparent border-none outline-none resize-none placeholder:text-ink-muted/50"
              />

              {/* Word Count Footer */}
              <div className="flex items-center justify-between text-[10px] font-mono text-ink-muted pt-2 border-t border-canvas-subtle dark:border-night-border">
                <span>{wordCount} palavras</span>
                <span className="italic sm:hidden">Modo escrita</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
