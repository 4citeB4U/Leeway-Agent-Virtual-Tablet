import React from 'react';
import { X, Maximize2, ExternalLink } from 'lucide-react';
import { OpenNotebookApp } from './OpenNotebookApp';

interface OpenNotebookDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onMaximizeToFullTab: () => void;
  onExportToFile?: (path: string, content: string) => void;
  onSyncToNotepad?: (text: string) => void;
  activeCodeFile?: { path: string; content: string };
  agentNotepadContent?: string;
}

export const OpenNotebookDrawer: React.FC<OpenNotebookDrawerProps> = ({
  isOpen,
  onClose,
  onMaximizeToFullTab,
  onExportToFile,
  onSyncToNotepad,
  activeCodeFile,
  agentNotepadContent
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[540px] md:w-[680px] lg:w-[760px] bg-[#14151a] shadow-2xl border-l border-orange-500/50 flex flex-col transition-all duration-300">
      {/* Extension Drawer Top Bar */}
      <div className="h-9 bg-[#101115] border-b border-stone-800 px-3 flex items-center justify-between text-xs shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
          <span className="font-bold text-white text-[11px] uppercase tracking-wider">
            Open Notebook • Modular Extension
          </span>
          <span className="text-[10px] text-stone-500 bg-stone-800 px-1.5 py-0.2 rounded font-mono">
            Alt+N
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onMaximizeToFullTab}
            title="Open in full workstation tab"
            className="flex items-center gap-1 px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded text-[10px] font-bold"
          >
            <Maximize2 size={11} />
            <span className="hidden sm:inline">Maximize</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded hover:bg-stone-800"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Drawer Body with OpenNotebookApp embedded */}
      <div className="flex-grow overflow-hidden flex flex-col">
        <OpenNotebookApp
          isExtensionDrawer={true}
          onCloseExtension={onClose}
          onExportToFile={onExportToFile}
          onSyncToNotepad={onSyncToNotepad}
          activeCodeFile={activeCodeFile}
          agentNotepadContent={agentNotepadContent}
        />
      </div>
    </div>
  );
};
