import React from 'react';
import { X, FileText, Globe, Code, Trash2, CheckCircle, Circle, ExternalLink } from 'lucide-react';
import { Source } from '../../types';

interface SourceDetailModalProps {
  source: Source | null;
  onClose: () => void;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
}

export const SourceDetailModal: React.FC<SourceDetailModalProps> = ({
  source,
  onClose,
  onToggleActive,
  onDelete
}) => {
  if (!source) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-950 border border-orange-700/60 text-orange-400 flex items-center justify-center font-bold">
              {source.type === 'url' ? <Globe size={18} /> : source.type === 'code' ? <Code size={18} /> : <FileText size={18} />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white max-w-md truncate">{source.title}</h3>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-stone-400">
                <span className="uppercase font-semibold text-orange-400">{source.type}</span>
                <span>•</span>
                <span>{source.wordCount} words</span>
                <span>•</span>
                <span>{source.chunkCount} vector chunks</span>
                <span>•</span>
                <span>{source.createdAt}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action strip */}
        <div className="px-4 py-2 bg-stone-950/60 border-b border-stone-800 flex items-center justify-between text-xs">
          <button
            onClick={() => onToggleActive(source.id)}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg font-bold border transition-colors ${
              source.isActive
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                : 'bg-stone-800 text-stone-400 border-stone-700'
            }`}
          >
            {source.isActive ? <CheckCircle size={14} className="text-emerald-400" /> : <Circle size={14} />}
            <span>{source.isActive ? 'Included in Grounding Context' : 'Excluded from Grounding'}</span>
          </button>

          <div className="flex items-center gap-2">
            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-sky-400 hover:underline px-2 py-1"
              >
                <span>Open Link</span>
                <ExternalLink size={12} />
              </a>
            )}
            <button
              onClick={() => {
                if (confirm(`Remove "${source.title}" from this notebook?`)) {
                  onDelete(source.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1 text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-950/40"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Source Content Preview */}
        <div className="p-5 flex-grow overflow-y-auto space-y-3 text-xs leading-relaxed text-stone-300 font-mono bg-stone-900/60 whitespace-pre-wrap select-text">
          {source.content}
        </div>
      </div>
    </div>
  );
};
