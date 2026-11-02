import React, { useState } from 'react';
import { X, FileText, Globe, Upload, Code, BookOpen, Loader2, Sparkles, Check } from 'lucide-react';
import { Source } from '../../types';

interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSource: (source: Omit<Source, 'id' | 'createdAt'>) => void;
  activeCodeFile?: { path: string; content: string };
  agentNotepadContent?: string;
}

export const AddSourceModal: React.FC<AddSourceModalProps> = ({
  isOpen,
  onClose,
  onAddSource,
  activeCodeFile,
  agentNotepadContent
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'url' | 'file' | 'code' | 'notepad'>('text');
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let finalTitle = title.trim();
    let content = textContent.trim();
    let type: Source['type'] = 'text';
    let url: string | undefined = undefined;

    if (activeTab === 'url') {
      type = 'url';
      url = urlInput.trim();
      if (!finalTitle) finalTitle = url || 'Web Resource';
    } else if (activeTab === 'code') {
      type = 'code';
      if (!finalTitle) finalTitle = activeCodeFile?.path || 'Workspace Code File';
      content = activeCodeFile?.content || '';
    } else if (activeTab === 'notepad') {
      type = 'research';
      if (!finalTitle) finalTitle = 'Agent Notepad Notes';
      content = agentNotepadContent || '';
    }

    if (!content) {
      setError('Source content cannot be empty.');
      return;
    }

    const words = content.split(/\s+/).filter(Boolean).length;
    const chunks = Math.max(1, Math.ceil(words / 150));

    onAddSource({
      title: finalTitle || 'Untitled Source',
      type,
      content,
      wordCount: words,
      chunkCount: chunks,
      isActive: true,
      url,
      summary: content.slice(0, 140) + '...',
      tags: [type]
    });

    // Reset and close
    setTitle('');
    setTextContent('');
    setUrlInput('');
    onClose();
  };

  const handleFetchUrl = async () => {
    if (!urlInput.trim()) return;
    setIsLoadingUrl(true);
    setError('');

    try {
      const res = await fetch('/api/web/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.state || `HTTP ${res.status}`);
      }
      const extracted = data.text || data.markdown || '';
      if (extracted) {
        setTextContent(extracted);
        if (!title) setTitle(data.title || urlInput.trim());
      }
    } catch (err: any) {
      setError('Could not extract URL content automatically. You can paste the content directly below.');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setTextContent(text || '');
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-600/30 text-orange-400 border border-orange-500/40 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Add Sources to Open Notebook</h3>
              <p className="text-[11px] text-stone-400">Sources are automatically parsed, indexed, and cited in AI responses.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-stone-800 bg-stone-950/50 px-3 pt-2 gap-1 overflow-x-auto text-xs">
          {[
            { id: 'text', label: 'Paste Text', icon: FileText },
            { id: 'url', label: 'Web Link', icon: Globe },
            { id: 'file', label: 'Upload File', icon: Upload },
            { id: 'code', label: 'Import from LeeCode', icon: Code },
            { id: 'notepad', label: 'Import from Notepad', icon: BookOpen },
          ].map(tab => {
            const IconComp = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-t-lg font-medium flex items-center gap-1.5 transition-all text-[11px] whitespace-nowrap ${
                  isSelected
                    ? 'bg-stone-900 text-orange-400 border-t-2 border-orange-500 font-bold'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/40'
                }`}
              >
                <IconComp size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex-grow overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 rounded-lg text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-stone-300 font-bold mb-1">Source Title / Reference Name</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. System Architecture Specification 2026"
              className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2.5 text-stone-200 placeholder-stone-600 outline-none focus:border-orange-500"
            />
          </div>

          {activeTab === 'url' && (
            <div className="space-y-2">
              <label className="block text-stone-300 font-bold">Web URL to Ingest</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://arxiv.org/abs/... or https://github.com/..."
                  className="flex-grow bg-stone-950 border border-stone-700 rounded-lg p-2.5 text-stone-200 placeholder-stone-600 outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={handleFetchUrl}
                  disabled={isLoadingUrl || !urlInput.trim()}
                  className="px-3.5 bg-orange-700 hover:bg-orange-600 text-white rounded-lg font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isLoadingUrl ? <Loader2 size={13} className="animate-spin" /> : <Globe size={13} />}
                  <span>Fetch Content</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="border-2 border-dashed border-stone-700 rounded-xl p-6 text-center hover:border-orange-500/60 transition-colors">
              <Upload size={28} className="mx-auto text-stone-500 mb-2" />
              <p className="text-stone-300 font-semibold mb-1">Upload Document or Code</p>
              <p className="text-[11px] text-stone-500 mb-3">Supports .txt, .md, .json, .ts, .py, .csv</p>
              <input
                type="file"
                accept=".txt,.md,.json,.ts,.js,.tsx,.py,.csv"
                onChange={handleFileUpload}
                className="text-xs text-stone-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-orange-900/50 file:text-orange-200 hover:file:bg-orange-800/50 cursor-pointer"
              />
            </div>
          )}

          {activeTab === 'code' && (
            <div className="p-3 bg-stone-950 border border-stone-800 rounded-lg text-stone-300 space-y-1">
              <div className="text-[11px] font-bold text-cyan-400">Current Workspace File:</div>
              <div className="font-mono text-xs text-stone-200 bg-stone-900 p-2 rounded border border-stone-800 truncate">
                {activeCodeFile?.path || 'No active file selected in LeeCode'}
              </div>
              <p className="text-[11px] text-stone-500">
                Clicking "Add Source" will index all {activeCodeFile?.content.length || 0} characters of this file into the current research notebook.
              </p>
            </div>
          )}

          {activeTab === 'notepad' && (
            <div className="p-3 bg-stone-950 border border-stone-800 rounded-lg text-stone-300 space-y-1">
              <div className="text-[11px] font-bold text-emerald-400">Current Agent Notepad Content:</div>
              <div className="text-xs text-stone-400 bg-stone-900 p-2 rounded border border-stone-800 max-h-24 overflow-y-auto">
                {agentNotepadContent ? agentNotepadContent.slice(0, 300) + '...' : 'Notepad is currently empty'}
              </div>
              <p className="text-[11px] text-stone-500">
                Syncs your working scratchpad findings directly into the notebook grounding bank.
              </p>
            </div>
          )}

          {(activeTab === 'text' || activeTab === 'url') && (
            <div>
              <label className="block text-stone-300 font-bold mb-1">Source Text Content</label>
              <textarea
                rows={7}
                value={textContent}
                onChange={e => setTextContent(e.target.value)}
                placeholder="Paste research paper abstract, document excerpts, meeting transcripts, or markdown notes..."
                className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2.5 text-stone-200 placeholder-stone-600 font-mono text-xs outline-none focus:border-orange-500"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-md"
            >
              <Check size={14} />
              <span>Add Source</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
