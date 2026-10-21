import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Calendar,
  Smile,
  Trash2,
  FileDown,
  Sparkles,
  HelpCircle,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { JournalEntry } from '../../types';
import { formatDateBR } from '../../lib/dateUtils';

const REFLECTION_PROMPTS = [
  'O que foi mais importante hoje?',
  'O que aprendi de valioso que merece ser lembrado?',
  'O que gostaria de fazer diferente amanhã?',
  'Pelo que sou grato neste exato momento?',
  'Como protegi minha energia mental hoje?',
];

export const JournalView: React.FC = () => {
  const {
    state,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    exportJournalMD,
  } = useApp();

  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(
    state.journal[0]?.id || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);

  // Active entry being edited
  const currentEntry = state.journal.find((j) => j.id === selectedEntryId) || null;

  // Local editor draft state
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftMood, setDraftMood] = useState<JournalEntry['mood']>('good');
  const [draftTags, setDraftTags] = useState('');
  const [draftLearnings, setDraftLearnings] = useState('');
  const [draftHighlights, setDraftHighlights] = useState('');

  // Sync draft when selectedEntry changes
  useEffect(() => {
    if (currentEntry) {
      setDraftTitle(currentEntry.title || '');
      setDraftContent(currentEntry.content || '');
      setDraftMood(currentEntry.mood || 'good');
      setDraftTags(currentEntry.tags ? currentEntry.tags.join(', ') : '');
      setDraftLearnings(currentEntry.learnings || '');
      setDraftHighlights(currentEntry.highlights || '');
    }
  }, [currentEntry?.id]);

  // Debounced auto-save
  useEffect(() => {
    if (!currentEntry) return;

    setIsSaving(true);
    const timer = setTimeout(() => {
      updateJournalEntry(currentEntry.id, {
        title: draftTitle,
        content: draftContent,
        mood: draftMood,
        tags: draftTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        learnings: draftLearnings,
        highlights: draftHighlights,
      });
      setIsSaving(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [draftTitle, draftContent, draftMood, draftTags, draftLearnings, draftHighlights]);

  // Create new blank entry
  const handleCreateNew = () => {
    const newEntry = addJournalEntry({
      title: 'Reflexão de ' + formatDateBR(new Date(), 'dd/MM'),
      content: '',
      mood: 'good',
      tags: ['diário'],
    });
    setSelectedEntryId(newEntry.id);
  };

  const handlePromptClick = (prompt: string) => {
    setDraftContent((prev) => (prev ? `${prev}\n\n**${prompt}**\n` : `**${prompt}**\n`));
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

  // Filter journal list
  const filteredJournal = state.journal.filter((j) => {
    if (selectedTag !== 'all' && !j.tags.includes(selectedTag)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = j.title?.toLowerCase().includes(q);
      const matchesContent = j.content.toLowerCase().includes(q);
      const matchesTags = j.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchesTitle && !matchesContent && !matchesTags) return false;
    }
    return true;
  });

  // Collect all unique tags
  const allTags = Array.from(new Set(state.journal.flatMap((j) => j.tags)));

  const moodEmojis: Record<string, string> = {
    great: '✨ Excelente',
    good: '🙂 Produtivo / Bem',
    neutral: '😐 Neutro',
    tired: '🥱 Cansado',
    stressed: '⚡ Estressado',
    down: '🌧️ Para baixo',
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-serif font-medium text-stone-900 dark:text-stone-100">
            Diário Pessoal
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Espaço para reflexão, registro de experiências, aprendizados e clareza mental.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-stone-300 rounded-xl hover:bg-stone-50 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" /> Exportar Markdown
          </button>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 text-white dark:text-stone-900 text-xs font-medium rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nova Entrada
          </button>
        </div>
      </div>

      {/* Privacy Notice Alert */}
      <div className="p-3 bg-stone-100/80 dark:bg-slate-900/80 border border-stone-200 dark:border-slate-800 rounded-xl flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
        <ShieldAlert className="w-4 h-4 text-stone-400 flex-shrink-0" />
        <span>
          <strong>Privacidade Local:</strong> Seus registros são mantidos exclusivamente no
          armazenamento deste navegador (sem envio a servidores terceiros). Faça backups regulares em JSON/Markdown.
        </span>
      </div>

      {/* 2-Pane Editorial Interface: Entries List + Focus Editor */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Column (4 cols): Search, Tags & List */}
        <div className="md:col-span-4 space-y-3 flex flex-col">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar no diário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl dark:text-white"
            />
          </div>

          {/* Tags cloud */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <button
                onClick={() => setSelectedTag('all')}
                className={`px-2 py-0.5 rounded-full ${
                  selectedTag === 'all'
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                    : 'bg-stone-100 dark:bg-slate-800 text-stone-500'
                }`}
              >
                Todas
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2 py-0.5 rounded-full whitespace-nowrap ${
                    selectedTag === tag
                      ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                      : 'bg-stone-100 dark:bg-slate-800 text-stone-500'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* List of Entries */}
          <div className="space-y-2 flex-1 overflow-y-auto max-h-[650px] pr-1">
            {filteredJournal.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400">
                Nenhuma entrada encontrada.
              </div>
            ) : (
              filteredJournal.map((entry) => {
                const active = entry.id === selectedEntryId;
                return (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedEntryId(entry.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      active
                        ? 'bg-white dark:bg-slate-800 border-stone-900 dark:border-stone-400 shadow-card'
                        : 'bg-cream-50/50 dark:bg-slate-900 border-stone-200/70 dark:border-slate-800/80 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono mb-1">
                      <span>{formatDateBR(entry.date, "dd MMM yyyy, HH:mm")}</span>
                      {entry.mood && <span>{moodEmojis[entry.mood]?.split(' ')[0]}</span>}
                    </div>
                    <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                      {entry.title || 'Sem título'}
                    </h4>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2 leading-relaxed font-serif">
                      {entry.content || 'Sem conteúdo...'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (8 cols): Editor Canvas */}
        <div className="md:col-span-8 bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-card flex flex-col justify-between">
          {!currentEntry ? (
            <div className="py-24 text-center text-stone-400">
              <BookOpen className="w-10 h-10 mx-auto text-stone-300 mb-2" />
              <p className="text-sm font-medium">Nenhuma entrada selecionada</p>
              <button
                onClick={handleCreateNew}
                className="mt-3 px-3 py-1.5 text-xs font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg"
              >
                Criar uma reflexão agora
              </button>
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Meta bar: Date, Mood selector, Autosave indicator */}
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-3 text-xs">
                <div className="flex items-center gap-2 text-stone-400 font-mono text-[11px]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDateBR(currentEntry.date, "EEEE, d 'de' MMMM 'às' HH:mm")}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-stone-400">
                    {isSaving ? 'Salvando...' : 'Salvo localmente'}
                  </span>
                  <select
                    value={draftMood}
                    onChange={(e) => setDraftMood(e.target.value as any)}
                    className="text-xs px-2 py-1 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    {Object.entries(moodEmojis).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (confirm('Tem certeza de que deseja excluir este registro do diário?')) {
                        deleteJournalEntry(currentEntry.id);
                        setSelectedEntryId(null);
                      }
                    }}
                    className="p-1 text-stone-400 hover:text-rose-600 transition-colors"
                    title="Excluir entrada"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <input
                type="text"
                placeholder="Título da reflexão..."
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="w-full text-xl sm:text-2xl font-serif font-semibold text-stone-900 dark:text-white bg-transparent border-none outline-none placeholder:text-stone-300 dark:placeholder:text-stone-600"
              />

              {/* Optional Reflection Prompts bar */}
              <div className="p-2.5 bg-cream-50 dark:bg-slate-800/40 border border-stone-200/70 dark:border-slate-700 rounded-xl">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-stone-400 flex items-center gap-1 mb-1.5">
                  <HelpCircle className="w-3 h-3" /> Perguntas para inspirar seu dia:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {REFLECTION_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handlePromptClick(prompt)}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-slate-700 hover:border-stone-400 transition-colors"
                    >
                      + {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Content Area */}
              <textarea
                rows={12}
                placeholder="Escreva livremente aqui..."
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                className="w-full flex-1 p-2 text-sm sm:text-base font-serif leading-relaxed text-stone-800 dark:text-stone-200 bg-transparent border-none outline-none resize-none placeholder:text-stone-300"
              />

              {/* Learning / Highlight Callouts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-stone-100 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-medium text-stone-500 mb-1">
                    Aprendizado Principal
                  </label>
                  <input
                    type="text"
                    placeholder="Uma lição para carregar..."
                    value={draftLearnings}
                    onChange={(e) => setDraftLearnings(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-stone-500 mb-1">
                    Tags (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    placeholder="ideias, foco, gratidão"
                    value={draftTags}
                    onChange={(e) => setDraftTags(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
              </div>

              {/* Footer wordcount */}
              <div className="text-right text-[10px] font-mono text-stone-400 pt-1">
                {draftContent.trim().split(/\s+/).filter(Boolean).length} palavras
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
