import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Plus, Sparkles, Send, Volume2, FileText, CheckCircle,
  Circle, Trash2, Download, Copy, Check, ChevronRight, ExternalLink,
  Layers, Pin, ArrowRight, MessageSquare, Search, HelpCircle,
  ListFilter, RefreshCw, Loader2, Code, Share2, PanelRightClose,
  PanelRightOpen, Maximize2, Minimize2
} from 'lucide-react';
import { Notebook, Source, NotebookNote, StudioArtifact, ChatMessage } from '../../types';
import { INITIAL_NOTEBOOKS } from '../../data/seedNotebooks';
import { AudioOverviewPlayer } from './AudioOverviewPlayer';
import { AddSourceModal } from './AddSourceModal';
import { SourceDetailModal } from './SourceDetailModal';
import { ConceptMap } from './ConceptMap';

interface OpenNotebookAppProps {
  isExtensionDrawer?: boolean;
  onCloseExtension?: () => void;
  onExportToFile?: (path: string, content: string) => void;
  onSyncToNotepad?: (text: string) => void;
  activeCodeFile?: { path: string; content: string };
  agentNotepadContent?: string;
  onOpenApp?: (appId: any) => void;
}

export const OpenNotebookApp: React.FC<OpenNotebookAppProps> = ({
  isExtensionDrawer = false,
  onCloseExtension,
  onExportToFile,
  onSyncToNotepad,
  activeCodeFile,
  agentNotepadContent,
  onOpenApp
}) => {
  // Notebooks state with local storage persistence
  const [notebooks, setNotebooks] = useState<Notebook[]>(() => {
    try {
      const saved = localStorage.getItem('leeway_open_notebooks_v1');
      if (saved) return JSON.parse(saved);
    } catch (_e) {}
    return INITIAL_NOTEBOOKS;
  });

  const [activeNotebookId, setActiveNotebookId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('leeway_active_notebook_id');
      if (saved) return saved;
    } catch (_e) {}
    return notebooks[0]?.id || 'nb-open-notebook';
  });

  // Current active notebook
  const activeNotebook = notebooks.find(nb => nb.id === activeNotebookId) || notebooks[0];

  // Layout view
  // 'studio' = full 3-column view | 'chat' = focus chat | 'sources' = focus sources | 'notes' = focus notes/studio
  const [layoutMode, setLayoutMode] = useState<'studio' | 'chat' | 'sources' | 'notes'>('studio');
  const [activeStudioTab, setActiveStudioTab] = useState<'audio' | 'study' | 'briefing' | 'notes' | 'map'>('audio');

  // Modals
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [selectedSourceForDetail, setSelectedSourceForDetail] = useState<Source | null>(null);
  const [isNewNotebookOpen, setIsNewNotebookOpen] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState('');
  const [newNotebookDesc, setNewNotebookDesc] = useState('');

  // Grounded chat state
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Studio generator state
  const [isGeneratingArtifact, setIsGeneratingArtifact] = useState(false);

  // New note creation
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('leeway_open_notebooks_v1', JSON.stringify(notebooks));
      localStorage.setItem('leeway_active_notebook_id', activeNotebookId);
    } catch (_e) {}
  }, [notebooks, activeNotebookId]);

  // Scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeNotebook?.chatHistory, isChatLoading]);

  // Helper to update current notebook
  const updateCurrentNotebook = (updater: (prev: Notebook) => Notebook) => {
    setNotebooks(prev => prev.map(nb => nb.id === activeNotebook.id ? updater(nb) : nb));
  };

  // Toggle source inclusion in grounding
  const handleToggleSourceActive = (sourceId: string) => {
    updateCurrentNotebook(nb => ({
      ...nb,
      sources: nb.sources.map(s => s.id === sourceId ? { ...s, isActive: !s.isActive } : s)
    }));
  };

  // Delete source
  const handleDeleteSource = (sourceId: string) => {
    updateCurrentNotebook(nb => ({
      ...nb,
      sources: nb.sources.filter(s => s.id !== sourceId)
    }));
    showToast('Source removed from notebook');
  };

  // Add source
  const handleAddSource = (newSourceData: Omit<Source, 'id' | 'createdAt'>) => {
    const newSource: Source = {
      ...newSourceData,
      id: `src-${Date.now()}`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    updateCurrentNotebook(nb => ({
      ...nb,
      sources: [newSource, ...nb.sources]
    }));
    showToast(`Added source: "${newSource.title}"`);
  };

  // Create new notebook
  const handleCreateNotebook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotebookTitle.trim()) return;

    const newNb: Notebook = {
      id: `nb-${Date.now()}`,
      title: newNotebookTitle.trim(),
      description: newNotebookDesc.trim() || 'Custom research notebook.',
      emoji: '📑',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      sources: [],
      notes: [],
      artifacts: [],
      chatHistory: []
    };

    setNotebooks(prev => [newNb, ...prev]);
    setActiveNotebookId(newNb.id);
    setNewNotebookTitle('');
    setNewNotebookDesc('');
    setIsNewNotebookOpen(false);
    showToast(`Created notebook: "${newNb.title}"`);
  };

  // Grounded Chat Send
  const handleSendChat = async (overridePrompt?: string) => {
    const message = (overridePrompt || chatInput).trim();
    if (!message || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Append user message immediately
    updateCurrentNotebook(nb => ({
      ...nb,
      chatHistory: [...nb.chatHistory, userMsg]
    }));
    setChatInput('');
    setIsChatLoading(true);

    const activeSources = activeNotebook.sources.filter(s => s.isActive);

    try {
      const response = await fetch('/api/notebook/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sources: activeSources,
          notebookTitle: activeNotebook.title
        })
      });

      if (!response.ok) throw new Error(`Chat API returned ${response.status}`);
      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        text: data.answer || 'No response generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citedSources: data.citedSources,
        suggestedQuestions: data.suggestedQuestions
      };

      updateCurrentNotebook(nb => ({
        ...nb,
        chatHistory: [...nb.chatHistory, assistantMsg]
      }));
    } catch (_err: any) {
      // Deterministic client-side extraction for standalone/offline use. No invented synthesis.
      const queryTokens = Array.from(new Set<string>(
        message.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(word => word.length > 2)
      ));
      const candidates = activeSources.flatMap((source, sourceIndex) => {
        const sentences = source.content.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).filter(sentence => sentence.length > 24);
        return sentences.map(sentence => {
          const lower = sentence.toLowerCase();
          const overlap = queryTokens.reduce((sum, token) => sum + (lower.includes(token) ? 1 : 0), 0);
          return { source, sourceIndex, sentence: sentence.slice(0, 700), score: overlap };
        });
      }).filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score || a.sourceIndex - b.sourceIndex)
        .slice(0, 5);

      const citedSources = Array.from(
        new Map<string, { index: number; title: string; snippet: string }>(
          candidates.map(item => [item.source.id, {
            index: item.sourceIndex + 1,
            title: item.source.title,
            snippet: item.sentence.slice(0, 180)
          }])
        ).values()
      );
      const answerText = candidates.length > 0
        ? candidates.map(item => `${item.sentence} [${item.sourceIndex + 1}]`).join('\n\n')
        : activeSources.length === 0
          ? 'No active sources are selected. Add or enable source material before asking a grounded question.'
          : 'INSUFFICIENT EVIDENCE: the active sources do not contain enough matching text to answer this question deterministically.';

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-extractive-offline`,
        role: 'assistant',
        text: answerText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citedSources,
        suggestedQuestions: []
      };

      updateCurrentNotebook(nb => ({
        ...nb,
        chatHistory: [...nb.chatHistory, assistantMsg]
      }));
    } finally {
      setIsChatLoading(false);
    }
  };

  // Generate Studio Artifact
  const handleGenerateArtifact = async (type: 'audio_overview' | 'study_guide' | 'briefing_doc' | 'faq' | 'timeline') => {
    setIsGeneratingArtifact(true);
    const activeSources = activeNotebook.sources.filter(s => s.isActive);

    try {
      const res = await fetch('/api/notebook/generate-artifact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactType: type,
          sources: activeSources,
          notebookTitle: activeNotebook.title
        })
      });

      if (!res.ok) throw new Error(`Artifact generator returned ${res.status}`);
      const data = await res.json();

      const newArtifact: StudioArtifact = {
        id: `art-${Date.now()}`,
        type,
        title: type === 'audio_overview'
          ? `Deep Dive Podcast: ${activeNotebook.title}`
          : type === 'study_guide'
          ? `Study Guide: ${activeNotebook.title}`
          : `Executive Briefing: ${activeNotebook.title}`,
        content: data.content,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      updateCurrentNotebook(nb => ({
        ...nb,
        artifacts: [newArtifact, ...nb.artifacts.filter(a => a.type !== type)]
      }));

      if (type === 'audio_overview') setActiveStudioTab('audio');
      else if (type === 'study_guide') setActiveStudioTab('study');
      else setActiveStudioTab('briefing');

      showToast(`Generated new ${type.replace('_', ' ')}!`);
    } catch (err: any) {
      console.warn('Open Notebook artifact generation failed; no synthetic artifact created.', err);
      showToast('Artifact generator unavailable. No artifact was created.');
    } finally {
      setIsGeneratingArtifact(false);
    }
  };

  // Add note to notebook
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    const note: NotebookNote = {
      id: `note-${Date.now()}`,
      title: newNoteTitle.trim(),
      content: newNoteContent.trim(),
      isPinned: false,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    updateCurrentNotebook(nb => ({
      ...nb,
      notes: [note, ...nb.notes]
    }));
    setNewNoteTitle('');
    setNewNoteContent('');
    setIsAddingNote(false);
    showToast('Note added to notebook');
  };

  // Promote note to source
  const handleConvertNoteToSource = (note: NotebookNote) => {
    handleAddSource({
      title: `[Note] ${note.title}`,
      type: 'text',
      content: note.content,
      wordCount: note.content.split(/\s+/).filter(Boolean).length,
      chunkCount: 1,
      isActive: true,
      summary: note.content.slice(0, 120) + '...',
      tags: ['user-note']
    });
    showToast(`Converted note "${note.title}" to active Source!`);
  };

  // Export note to LeeCode file
  const handleExportNoteToLeeCode = (note: NotebookNote) => {
    if (onExportToFile) {
      const fileName = `/src/notes/${note.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
      onExportToFile(fileName, `# ${note.title}\n\n${note.content}`);
      showToast(`Exported note to LeeCode: ${fileName}`);
    } else {
      showToast('LeeCode workspace handler ready');
    }
  };

  // Active sources count
  const activeSources = activeNotebook?.sources.filter(s => s.isActive) || [];
  const totalWords = activeNotebook?.sources.reduce((acc, s) => acc + s.wordCount, 0) || 0;
  const audioArtifact = activeNotebook?.artifacts.find(a => a.type === 'audio_overview');
  const studyArtifact = activeNotebook?.artifacts.find(a => a.type === 'study_guide');
  const briefingArtifact = activeNotebook?.artifacts.find(a => a.type === 'briefing_doc' || a.type === 'faq');

  return (
    <div className={`flex flex-col h-full bg-[#14151a] text-stone-200 overflow-hidden select-none font-sans ${isExtensionDrawer ? 'border-l border-orange-500/40 shadow-2xl' : ''}`}>
      {/* Top Application Bar */}
      <header className="h-11 bg-[#1a1c23] border-b border-stone-800 flex items-center justify-between px-3 gap-2 shrink-0 z-20">
        {/* Notebook Identity & Switcher */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-orange-600/30 text-orange-400 border border-orange-500/40 flex items-center justify-center font-bold text-xs shrink-0">
            {activeNotebook.emoji || '📓'}
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <select
              value={activeNotebookId}
              onChange={e => setActiveNotebookId(e.target.value)}
              className="bg-stone-900 text-stone-100 text-xs font-bold border border-stone-700 rounded-md px-2 py-1 outline-none truncate max-w-[220px]"
            >
              {notebooks.map(nb => (
                <option key={nb.id} value={nb.id}>
                  {nb.emoji} {nb.title}
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsNewNotebookOpen(true)}
              title="Create new research notebook"
              className="p-1 rounded bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700"
            >
              <Plus size={13} />
            </button>
          </div>

          {/* Sources Summary Pill */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-stone-900 border border-stone-700 text-[10px] text-stone-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-stone-300">{activeSources.length}/{activeNotebook.sources.length} sources</span>
            <span>•</span>
            <span>{totalWords.toLocaleString()} words</span>
          </div>
        </div>

        {/* View Layout Controls & CTAs */}
        <div className="flex items-center gap-1.5">
          {/* Quick Audio Overview shortcut */}
          <button
            onClick={() => {
              setLayoutMode('studio');
              setActiveStudioTab('audio');
            }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all ${
              activeStudioTab === 'audio' && layoutMode === 'studio'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-stone-800 hover:bg-stone-700 text-orange-400'
            }`}
          >
            <Volume2 size={13} />
            <span className="hidden sm:inline">Audio Overview</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex bg-stone-900 p-0.5 rounded-md border border-stone-700 text-[10px]">
            {[
              { id: 'studio', label: '3-Col Studio', icon: Layers },
              { id: 'chat', label: 'Chat', icon: MessageSquare },
              { id: 'sources', label: 'Sources', icon: FileText },
              { id: 'notes', label: 'Notes', icon: BookOpen }
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setLayoutMode(v.id as any)}
                className={`px-2 py-1 rounded font-bold transition-all ${
                  layoutMode === v.id ? 'bg-orange-600 text-white' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Add Source button */}
          <button
            onClick={() => setIsAddSourceOpen(true)}
            className="px-2.5 py-1 bg-stone-100 hover:bg-white text-stone-900 rounded-md text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all"
          >
            <Plus size={12} />
            <span>Add Source</span>
          </button>

          {/* If rendered inside extension drawer */}
          {isExtensionDrawer && onCloseExtension && (
            <button
              onClick={onCloseExtension}
              title="Close Extension"
              className="p-1 text-stone-400 hover:text-white rounded bg-stone-800"
            >
              <PanelRightClose size={15} />
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace 3-Column Layout */}
      <div className="flex-grow flex overflow-hidden">
        {/* ===================== COLUMN 1: SOURCES ===================== */}
        {(layoutMode === 'studio' || layoutMode === 'sources') && (
          <aside className={`flex flex-col bg-[#16171d] border-r border-stone-800 shrink-0 ${
            layoutMode === 'sources' ? 'w-full' : 'w-72 md:w-80'
          }`}>
            <div className="p-3 bg-stone-950/60 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileText size={14} className="text-orange-400" />
                <span className="text-xs font-bold text-stone-200">Sources ({activeNotebook.sources.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const allActive = activeSources.length === activeNotebook.sources.length;
                    updateCurrentNotebook(nb => ({
                      ...nb,
                      sources: nb.sources.map(s => ({ ...s, isActive: !allActive }))
                    }));
                  }}
                  className="text-[10px] text-stone-400 hover:text-orange-400 underline font-medium"
                >
                  {activeSources.length === activeNotebook.sources.length ? 'Deselect all' : 'Select all'}
                </button>
                <button
                  onClick={() => setIsAddSourceOpen(true)}
                  className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-orange-400"
                  title="Add new source"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>

            {/* Source List */}
            <div className="flex-grow overflow-y-auto p-2 space-y-2">
              {activeNotebook.sources.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-500 flex flex-col items-center space-y-2">
                  <FileText size={24} className="text-stone-700" />
                  <p>No sources in this notebook yet.</p>
                  <button
                    onClick={() => setIsAddSourceOpen(true)}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold"
                  >
                    Add First Source
                  </button>
                </div>
              ) : (
                activeNotebook.sources.map((src, idx) => (
                  <div
                    key={src.id}
                    className={`p-2.5 rounded-xl border transition-all text-xs flex items-start gap-2 group ${
                      src.isActive
                        ? 'bg-stone-900/90 border-stone-700/80 shadow-xs'
                        : 'bg-stone-950/40 border-stone-800/60 opacity-60'
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleSourceActive(src.id)}
                      className="mt-0.5 text-stone-400 hover:text-emerald-400 shrink-0"
                    >
                      {src.isActive ? <CheckCircle size={15} className="text-emerald-400" /> : <Circle size={15} />}
                    </button>

                    {/* Source Info (Clickable for Detail) */}
                    <div
                      onClick={() => setSelectedSourceForDetail(src)}
                      className="flex-grow min-w-0 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-orange-950 border border-orange-800/80 text-orange-300 uppercase">
                          [{idx + 1}] {src.type}
                        </span>
                        <span className="text-[10px] text-stone-500 truncate">{src.wordCount}w</span>
                      </div>
                      <h5 className="font-bold text-stone-200 text-xs truncate leading-snug group-hover:text-orange-300 transition-colors">
                        {src.title}
                      </h5>
                      {src.summary && (
                        <p className="text-[11px] text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                          {src.summary}
                        </p>
                      )}
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => handleDeleteSource(src.id)}
                      className="opacity-0 group-hover:opacity-100 text-stone-500 hover:text-red-400 p-1 transition-opacity"
                      title="Remove source"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Quick Import Footer from Workstation Tools */}
            <div className="p-3 bg-stone-950 border-t border-stone-800 text-[10px] text-stone-400 space-y-1.5">
              <span className="font-bold uppercase tracking-wider text-stone-500 block">Workspace Cross-Connect:</span>
              <div className="flex gap-1">
                {activeCodeFile && (
                  <button
                    onClick={() => {
                      handleAddSource({
                        title: `[Code] ${activeCodeFile.path}`,
                        type: 'code',
                        content: activeCodeFile.content,
                        wordCount: activeCodeFile.content.split(/\s+/).filter(Boolean).length,
                        chunkCount: 1,
                        isActive: true,
                        tags: ['leecode']
                      });
                    }}
                    className="flex-1 px-2 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-cyan-300 rounded text-[10px] font-bold truncate flex items-center gap-1 justify-center"
                    title="Import current LeeCode active file"
                  >
                    <Code size={11} />
                    <span className="truncate">LeeCode File</span>
                  </button>
                )}
                {agentNotepadContent && (
                  <button
                    onClick={() => {
                      handleAddSource({
                        title: 'Agent Notepad Notes',
                        type: 'research',
                        content: agentNotepadContent,
                        wordCount: agentNotepadContent.split(/\s+/).filter(Boolean).length,
                        chunkCount: 1,
                        isActive: true,
                        tags: ['notepad']
                      });
                    }}
                    className="flex-1 px-2 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-emerald-300 rounded text-[10px] font-bold truncate flex items-center gap-1 justify-center"
                    title="Import notes from Agent Notepad"
                  >
                    <BookOpen size={11} />
                    <span>Notepad</span>
                  </button>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* ===================== COLUMN 2: GROUNDED CHAT ===================== */}
        {(layoutMode === 'studio' || layoutMode === 'chat') && (
          <main className="flex-grow flex flex-col bg-[#14151a] min-w-0 relative">
            {/* Grounding Context Banner */}
            <div className="px-4 py-2 bg-stone-950/70 border-b border-stone-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-orange-400 font-bold flex items-center gap-1">
                  <Sparkles size={13} />
                  <span>Grounded Reasoning:</span>
                </span>
                <span className="text-stone-300 font-medium truncate">
                  {activeSources.length > 0
                    ? `Synthesizing across ${activeSources.length} selected source${activeSources.length > 1 ? 's' : ''}`
                    : 'No sources selected — grounded chat is blocked until evidence is added'}
                </span>
              </div>

              {activeSources.length > 0 && (
                <div className="flex items-center gap-1">
                  {activeSources.slice(0, 3).map((s, i) => (
                    <span
                      key={s.id}
                      onClick={() => setSelectedSourceForDetail(s)}
                      className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 text-[9px] text-stone-300 cursor-pointer hover:border-orange-500 truncate max-w-[90px]"
                    >
                      [{i + 1}] {s.title}
                    </span>
                  ))}
                  {activeSources.length > 3 && (
                    <span className="text-[9px] text-stone-500">+{activeSources.length - 3}</span>
                  )}
                </div>
              )}
            </div>

            {/* Chat Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 text-xs">
              {activeNotebook.chatHistory.length === 0 ? (
                <div className="max-w-xl mx-auto py-10 text-center space-y-5">
                  <div className="w-12 h-12 rounded-2xl bg-orange-950 border border-orange-600/40 text-orange-400 mx-auto flex items-center justify-center shadow-lg">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{activeNotebook.title}</h3>
                    <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                      Ask questions, verify evidence, compare concepts, or request synthesis grounded in your {activeSources.length} active source documents.
                    </p>
                  </div>

                  {/* Grounded starter actions */}
                  {activeSources.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-2">
                      {[
                        'Summarize the selected evidence',
                        'Compare the selected sources',
                        'Generate a study guide from these sources',
                        'List claims that need stronger evidence'
                      ].map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendChat(prompt)}
                          className="p-3 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 hover:border-orange-500/50 text-stone-300 hover:text-white text-xs text-left transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{prompt}</span>
                            <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 text-orange-400 transition-opacity" />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddSourceOpen(true)}
                      className="mx-auto px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-2"
                    >
                      <Plus size={14} />
                      Add First Source
                    </button>
                  )}
                </div>
              ) : (
                activeNotebook.chatHistory.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-2.5 ${
                        msg.role === 'user'
                          ? 'bg-orange-600 text-white rounded-br-xs shadow-md'
                          : 'bg-stone-900/90 border border-stone-800 text-stone-200 rounded-bl-xs shadow-sm'
                      }`}
                    >
                      {/* Message Text with Citation formatting */}
                      <div className="whitespace-pre-wrap select-text font-sans">
                        {msg.text.split(/(\[\d+\])/g).map((chunk, i) => {
                          const isCitation = /^\[\d+\]$/.test(chunk);
                          if (isCitation) {
                            const sourceNum = parseInt(chunk.replace(/\D/g, ''), 10);
                            const matchingSource = activeNotebook.sources[sourceNum - 1];
                            return (
                              <button
                                key={i}
                                onClick={() => matchingSource && setSelectedSourceForDetail(matchingSource)}
                                className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded font-bold text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900 transition-colors"
                                title={matchingSource ? `Source ${sourceNum}: ${matchingSource.title}` : `Source ${sourceNum}`}
                              >
                                {chunk}
                              </button>
                            );
                          }
                          return <span key={i}>{chunk}</span>;
                        })}
                      </div>

                      {/* Cited Sources Footer */}
                      {msg.citedSources && msg.citedSources.length > 0 && (
                        <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center gap-1.5 text-[10px] text-stone-400">
                          <span className="font-bold uppercase tracking-wider text-stone-500">Cited:</span>
                          {msg.citedSources.map(cs => (
                            <span
                              key={cs.index}
                              onClick={() => {
                                const s = activeNotebook.sources[cs.index - 1];
                                if (s) setSelectedSourceForDetail(s);
                              }}
                              className="px-2 py-0.5 bg-stone-950 rounded border border-stone-800 text-emerald-400 font-semibold cursor-pointer hover:border-emerald-500 transition-colors"
                            >
                              [{cs.index}] {cs.title}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Suggested Follow-up Questions */}
                      {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                        <div className="pt-2 border-t border-stone-800/80 space-y-1">
                          <span className="text-[10px] font-bold text-orange-400 block">Explore next:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.suggestedQuestions.map((q, qIdx) => (
                              <button
                                key={qIdx}
                                onClick={() => handleSendChat(q)}
                                className="text-left px-2.5 py-1 rounded-lg bg-stone-950 hover:bg-stone-800 border border-stone-800 text-[11px] text-stone-300 hover:text-white transition-colors"
                              >
                                💡 {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <span className="text-[9px] text-stone-500 mt-1 px-1">
                      {msg.role === 'user' ? 'You' : 'Open Notebook'} • {msg.timestamp}
                    </span>
                  </div>
                ))
              )}

              {isChatLoading && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-stone-900 border border-stone-800 max-w-sm text-xs text-orange-400 animate-pulse">
                  <Loader2 size={15} className="animate-spin text-orange-400" />
                  <span>Grounding response across {activeSources.length} sources...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 bg-stone-950 border-t border-stone-800 shrink-0">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendChat();
                }}
                className="flex items-center gap-2 bg-stone-900 border border-stone-700 rounded-xl p-1.5 focus-within:border-orange-500 transition-all shadow-inner"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder={`Ask Open Notebook about ${activeNotebook.title}...`}
                  className="flex-grow bg-transparent px-3 py-1 text-xs text-stone-100 placeholder-stone-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatInput.trim()}
                  className="p-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white rounded-lg transition-all"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </main>
        )}

        {/* ===================== COLUMN 3: STUDIO & NOTES ===================== */}
        {(layoutMode === 'studio' || layoutMode === 'notes') && (
          <aside className={`flex flex-col bg-[#171920] border-l border-stone-800 shrink-0 ${
            layoutMode === 'notes' ? 'w-full' : 'w-80 md:w-96'
          }`}>
            {/* Studio Navigation Tabs */}
            <div className="p-2 bg-stone-950/70 border-b border-stone-800 flex items-center justify-between gap-1 overflow-x-auto text-xs">
              {[
                { id: 'audio', label: 'Audio Podcast', icon: Volume2 },
                { id: 'study', label: 'Study Guide', icon: Sparkles },
                { id: 'briefing', label: 'Briefing & FAQ', icon: FileText },
                { id: 'notes', label: 'Notes', icon: BookOpen },
                { id: 'map', label: 'Concept Map', icon: Layers }
              ].map(tab => {
                const IconComp = tab.icon;
                const isSelected = activeStudioTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveStudioTab(tab.id as any)}
                    className={`px-2 py-1 rounded-md text-[10.5px] font-bold flex items-center gap-1 transition-all whitespace-nowrap ${
                      isSelected
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                    }`}
                  >
                    <IconComp size={12} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Studio Body */}
            <div className="flex-grow overflow-y-auto p-3 space-y-3">
              {/* Tab 1: Audio Overview */}
              {activeStudioTab === 'audio' && (
                <div className="space-y-3">
                  <AudioOverviewPlayer
                    artifact={audioArtifact}
                    notebookTitle={activeNotebook.title}
                    isGenerating={isGeneratingArtifact}
                    onGenerateNew={() => handleGenerateArtifact('audio_overview')}
                  />
                </div>
              )}

              {/* Tab 2: Study Guide */}
              {activeStudioTab === 'study' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-200">Interactive Study Guide</h4>
                    <button
                      onClick={() => handleGenerateArtifact('study_guide')}
                      disabled={isGeneratingArtifact}
                      className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded text-[10px] font-bold flex items-center gap-1 disabled:opacity-50"
                    >
                      {isGeneratingArtifact ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                      <span>Generate Study Guide</span>
                    </button>
                  </div>

                  {studyArtifact ? (
                    <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl text-xs space-y-3 font-sans leading-relaxed text-stone-200 select-text whitespace-pre-wrap">
                      {studyArtifact.content}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-stone-900/50 border border-stone-800 rounded-xl text-xs text-stone-400 space-y-2">
                      <Sparkles size={24} className="mx-auto text-orange-400" />
                      <p>No study guide created yet.</p>
                      <button
                        onClick={() => handleGenerateArtifact('study_guide')}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold"
                      >
                        Create Study Guide from Sources
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Briefing Doc & FAQ */}
              {activeStudioTab === 'briefing' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-200">Executive Briefing & FAQ</h4>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleGenerateArtifact('briefing_doc')}
                        disabled={isGeneratingArtifact}
                        className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-[10px] font-bold"
                      >
                        Briefing
                      </button>
                      <button
                        onClick={() => handleGenerateArtifact('faq')}
                        disabled={isGeneratingArtifact}
                        className="px-2 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded text-[10px] font-bold"
                      >
                        FAQ Bank
                      </button>
                    </div>
                  </div>

                  {briefingArtifact ? (
                    <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl text-xs space-y-3 font-sans leading-relaxed text-stone-200 select-text whitespace-pre-wrap">
                      {briefingArtifact.content}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-stone-900/50 border border-stone-800 rounded-xl text-xs text-stone-400 space-y-2">
                      <FileText size={24} className="mx-auto text-stone-500" />
                      <p>Generate an executive synthesis or questions bank.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Notes Scratchpad */}
              {activeStudioTab === 'notes' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-200">Notebook Notes ({activeNotebook.notes.length})</h4>
                    <button
                      onClick={() => setIsAddingNote(true)}
                      className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded text-[10px] font-bold flex items-center gap-1"
                    >
                      <Plus size={11} />
                      <span>New Note</span>
                    </button>
                  </div>

                  {/* Add Note Inline Form */}
                  {isAddingNote && (
                    <form onSubmit={handleAddNote} className="p-3 bg-stone-900 border border-orange-500/50 rounded-xl space-y-2 text-xs">
                      <input
                        type="text"
                        value={newNoteTitle}
                        onChange={e => setNewNoteTitle(e.target.value)}
                        placeholder="Note title..."
                        className="w-full bg-stone-950 border border-stone-700 rounded p-2 text-stone-100 outline-none"
                        autoFocus
                      />
                      <textarea
                        rows={4}
                        value={newNoteContent}
                        onChange={e => setNewNoteContent(e.target.value)}
                        placeholder="Write your research synthesis, hypotheses, or ideas..."
                        className="w-full bg-stone-950 border border-stone-700 rounded p-2 text-stone-100 font-mono text-xs outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingNote(false)}
                          className="px-2.5 py-1 text-stone-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded font-bold"
                        >
                          Save Note
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Notes List */}
                  <div className="space-y-2">
                    {activeNotebook.notes.map(note => (
                      <div
                        key={note.id}
                        className="p-3 bg-stone-900/90 border border-stone-800 rounded-xl text-xs space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-stone-200 flex items-center gap-1.5">
                            {note.isPinned && <Pin size={11} className="text-amber-400" />}
                            <span>{note.title}</span>
                          </h5>
                          <span className="text-[10px] text-stone-500">{note.updatedAt}</span>
                        </div>

                        <p className="text-[11px] text-stone-400 leading-relaxed whitespace-pre-wrap line-clamp-3">
                          {note.content}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-stone-800 text-[10px]">
                          <button
                            onClick={() => handleConvertNoteToSource(note)}
                            className="text-emerald-400 hover:underline font-bold"
                            title="Turn this note into an active grounded source"
                          >
                            + Convert to Source
                          </button>

                          <div className="flex items-center gap-2">
                            {onExportToFile && (
                              <button
                                onClick={() => handleExportNoteToLeeCode(note)}
                                className="text-cyan-400 hover:underline"
                                title="Send note content to a LeeCode file"
                              >
                                Export to LeeCode
                              </button>
                            )}
                            <button
                              onClick={() => {
                                updateCurrentNotebook(nb => ({
                                  ...nb,
                                  notes: nb.notes.filter(n => n.id !== note.id)
                                }));
                              }}
                              className="text-stone-500 hover:text-red-400"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 5: Concept Map */}
              {activeStudioTab === 'map' && (
                <ConceptMap
                  sources={activeNotebook.sources}
                  notebookTitle={activeNotebook.title}
                />
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Add Source Modal */}
      <AddSourceModal
        isOpen={isAddSourceOpen}
        onClose={() => setIsAddSourceOpen(false)}
        onAddSource={handleAddSource}
        activeCodeFile={activeCodeFile}
        agentNotepadContent={agentNotepadContent}
      />

      {/* Source Detail Modal */}
      <SourceDetailModal
        source={selectedSourceForDetail}
        onClose={() => setSelectedSourceForDetail(null)}
        onToggleActive={handleToggleSourceActive}
        onDelete={handleDeleteSource}
      />

      {/* New Notebook Modal */}
      {isNewNotebookOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Create New Research Notebook</h3>
            <form onSubmit={handleCreateNotebook} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-300 font-bold mb-1">Notebook Title</label>
                <input
                  type="text"
                  required
                  value={newNotebookTitle}
                  onChange={e => setNewNotebookTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus in Agent Clusters"
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2.5 text-stone-100 outline-none focus:border-orange-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-stone-300 font-bold mb-1">Description / Thesis</label>
                <input
                  type="text"
                  value={newNotebookDesc}
                  onChange={e => setNewNotebookDesc(e.target.value)}
                  placeholder="Brief summary of what this notebook investigates..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2.5 text-stone-100 outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewNotebookOpen(false)}
                  className="px-3 py-1.5 text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold"
                >
                  Create Notebook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-stone-900 text-white border border-stone-700 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <Check size={14} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
