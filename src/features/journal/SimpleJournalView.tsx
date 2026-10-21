import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  FileDown,
  ArrowLeft,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateBR } from '../../lib/dateUtils';

export const SimpleJournalView: React.FC = () => {
  const {
    state,
    saveStatus,
    lastSavedAt,
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
  // On mobile: toggle between 'editor' view and 'list' view
  const [mobileTab, setMobileTab] = useState<'editor' | 'list'>('editor');

  // Active note being edited
  const currentEntry = state.journal.find((j) => j.id === selectedEntryId) || null;

  // Local draft state for smooth editing
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');

  // Keep refs for unmount/switch flush to ensure zero data loss
  const draftRef = useRef({ id: '', title: '', content: '' });

  // Sync draft when selectedEntry changes (and flush previous note)
  useEffect(() => {
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

  // Keep draftRef up to date with changes
  useEffect(() => {
    if (currentEntry) {
      draftRef.current = {
        id: currentEntry.id,
        title: draftTitle,
        content: draftContent,
      };
    }
  }, [draftTitle, draftContent, currentEntry?.id]);

  // Flush on unmount
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

  // Create new blank note
  const handleCreateNew = () => {
    const newEntry = addJournalEntry({
      title: 'Nova anotação',
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
    a.download = `anotacoes-life-os-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter notes
  const filteredNotes = state.journal.filter((j) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      j.title?.toLowerCase().includes(q) ||
      j.content.toLowerCase().includes(q)
    );
  });

  const wordCount = draftContent.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-5 animate-fadeIn pb-8">
      {/* ========================================================================= */}
      {/* 1 & 2. COMPACT HEADER (Clean, Minimal, Consistent with Today & Schedule) */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-canvas-subtle dark:border-night-border">
        <div className="flex items-center gap-2">
          {/* Mobile Back button when in editor */}
          {mobileTab === 'editor' && (
            <button
              onClick={() => setMobileTab('list')}
              className="sm:hidden p-1.5 -ml-1 text-stone-400 hover:text-stone-200 rounded-lg"
              title="Ver todas as anotações"
              aria-label="Ver todas as anotações"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h1 className="text-xl sm:text-2xl font-serif font-medium text-ink-primary dark:text-stone-100 tracking-tight">
            Anotações
          </h1>
          <span className="text-xs font-mono text-stone-400 dark:text-stone-500">
            ({state.journal.length})
          </span>
        </div>

        {/* Essential Action Controls */}
        <div className="flex items-center gap-2">
          {state.journal.length > 0 && (
            <button
              onClick={handleExportMarkdown}
              className="interactive-tap min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-brand-500 border border-canvas-subtle dark:border-night-border rounded-xl bg-white dark:bg-night-surface shadow-soft transition-colors"
              title="Exportar anotações em Markdown"
            >
              <FileDown className="w-3.5 h-3.5 text-brand-500" />
              <span className="hidden sm:inline">Exportar .md</span>
            </button>
          )}

          <button
            onClick={handleCreateNew}
            className="interactive-tap min-h-[36px] flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova anotação</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN WRITING & NOTE ORGANIZER VIEW                                      */}
      {/* ========================================================================= */}
      {state.journal.length === 0 ? (
        <div className="py-16 sm:py-20 text-center border border-dashed border-canvas-subtle dark:border-night-border/70 rounded-2xl bg-white/30 dark:bg-night-surface/30 p-6 max-w-lg mx-auto">
          <FileText className="w-8 h-8 text-brand-500/50 mx-auto mb-2.5" />
          <p className="text-sm font-medium text-ink-primary dark:text-stone-200">
            Nenhuma anotação criada ainda
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 mb-4">
            Crie sua primeira anotação para registrar ideias, lembretes e anotações gerais.
          </p>
          <button
            onClick={handleCreateNew}
            className="interactive-tap inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar primeira anotação</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 min-h-[500px]">
          {/* Notes Sidebar / List (4 cols on desktop) */}
          <div
            className={`md:col-span-4 space-y-2.5 flex-col ${
              mobileTab === 'list' ? 'flex' : 'hidden md:flex'
            }`}
          >
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar anotações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 min-h-[36px] text-xs bg-white dark:bg-night-surface border border-canvas-subtle dark:border-night-border rounded-xl text-ink-primary dark:text-stone-100 placeholder:text-stone-400 shadow-soft outline-none focus:border-brand-500/60"
              />
            </div>

            {/* List */}
            <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[540px] pr-0.5">
              {filteredNotes.length === 0 ? (
                <div className="py-10 text-center text-xs text-stone-400 dark:text-stone-500 border border-dashed border-canvas-subtle dark:border-night-border rounded-xl p-4">
                  Nenhuma anotação encontrada.
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const active = note.id === selectedEntryId;
                  return (
                    <div
                      key={note.id}
                      onClick={() => {
                        setSelectedEntryId(note.id);
                        setMobileTab('editor');
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        active
                          ? 'bg-brand-500/10 dark:bg-brand-950/30 border-brand-500/40 shadow-soft'
                          : 'bg-white dark:bg-night-surface/90 border-canvas-subtle dark:border-night-border hover:border-brand-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
                          {formatDateBR(note.date, "dd/MM/yyyy • HH:mm")}
                        </span>
                      </div>
                      <h4
                        className={`text-xs font-semibold truncate ${
                          active
                            ? 'text-brand-600 dark:text-brand-400'
                            : 'text-ink-primary dark:text-stone-100'
                        }`}
                      >
                        {note.title || 'Sem título'}
                      </h4>
                      <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {note.content || 'Sem conteúdo...'}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Editor Canvas (8 cols on desktop) */}
          <div
            className={`md:col-span-8 bg-white dark:bg-night-surface/90 border border-canvas-subtle dark:border-night-border rounded-2xl p-4 sm:p-5 shadow-soft flex-col justify-between ${
              mobileTab === 'editor' ? 'flex' : 'hidden md:flex'
            }`}
          >
            {!currentEntry ? (
              <div className="py-20 text-center text-stone-400 dark:text-stone-500">
                <FileText className="w-8 h-8 mx-auto text-brand-500/40 mb-2" />
                <p className="text-sm font-medium text-ink-primary dark:text-stone-200">
                  Selecione uma anotação ou crie uma nova
                </p>
                <button
                  onClick={handleCreateNew}
                  className="mt-2 text-xs text-brand-500 hover:text-brand-400 font-semibold"
                >
                  + Nova anotação
                </button>
              </div>
            ) : (
              <div className="space-y-3 flex-1 flex flex-col min-w-0">
                {/* Editor Header Bar (Date, Save state, Delete) */}
                <div className="flex items-center justify-between border-b border-canvas-subtle dark:border-night-border pb-2 text-[11px] text-stone-400 dark:text-stone-500 flex-wrap gap-2">
                  <span className="font-mono text-stone-400 dark:text-stone-400 font-medium">
                    {formatDateBR(currentEntry.date, "EEEE, d 'de' MMMM 'de' yyyy, HH:mm")}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Auto-save Status Indicator */}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isDebouncing || saveStatus === 'saving'
                            ? 'bg-amber-500 animate-pulse'
                            : saveStatus === 'error'
                            ? 'bg-red-500'
                            : 'bg-mint-500'
                        }`}
                      />
                      <span className="text-stone-400 dark:text-stone-500">
                        {isDebouncing || saveStatus === 'saving'
                          ? 'Salvando...'
                          : saveStatus === 'error'
                          ? 'Erro ao salvar'
                          : lastSavedAt
                          ? `Salvo às ${lastSavedAt}`
                          : 'Salvo'}
                      </span>
                    </span>

                    {/* Delete Note */}
                    <button
                      onClick={() => {
                        if (confirm('Deseja excluir esta anotação?')) {
                          deleteJournalEntry(currentEntry.id);
                          setSelectedEntryId(null);
                          setMobileTab('list');
                        }
                      }}
                      className="min-h-[30px] min-w-[30px] flex items-center justify-center p-1 text-stone-400 hover:text-red-400 transition-colors rounded-lg"
                      title="Excluir anotação"
                      aria-label="Excluir anotação"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Note Title Input */}
                <input
                  type="text"
                  placeholder="Título da anotação..."
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="w-full text-base sm:text-xl font-semibold text-ink-primary dark:text-stone-100 bg-transparent border-none outline-none placeholder:text-stone-400 dark:placeholder:text-stone-500 py-1"
                />

                {/* Note Content Textarea */}
                <textarea
                  rows={13}
                  placeholder="Comece a escrever sua anotação aqui..."
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  className="w-full flex-1 min-h-[250px] text-xs sm:text-sm leading-relaxed text-ink-primary dark:text-stone-200 bg-transparent border-none outline-none resize-none placeholder:text-stone-400 dark:placeholder:text-stone-500"
                />

                {/* Footer Status */}
                <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 dark:text-stone-500 pt-2 border-t border-canvas-subtle dark:border-night-border">
                  <span>{wordCount} palavras</span>
                  <span>{draftContent.length} caracteres</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
