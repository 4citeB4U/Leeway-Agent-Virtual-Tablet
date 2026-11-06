/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal as TerminalIcon,
  Code as CodeIcon,
  Globe as GlobeIcon,
  Folder,
  File as FileIcon,
  FileText,
  Database,
  Cpu,
  Layers,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Home,
  Save,
  Search,
  X,
  Send,
  Download,
  Activity,
  Play,
  Volume2,
  Sparkles,
  Plus,
  ExternalLink,
  BookOpen,
  Check,
  Maximize2,
  Minimize2,
  Keyboard as KeyboardIcon,
  PanelRightOpen,
  PanelRightClose,
  RefreshCw,
  Share2,
  Bot,
  Github
} from 'lucide-react';
import { WorkstationAppId } from './types';
import { LeeWayEditor } from './components/editor/LeeWayEditor';
import { OpenNotebookApp } from './components/opennotebook/OpenNotebookApp';
import { OpenNotebookDrawer } from './components/opennotebook/OpenNotebookDrawer';
import { TerminalGateway } from './components/TerminalGateway';
import { DiagnosticsBoard } from './components/DiagnosticsBoard';
import { GitHubSyncModal } from './components/GitHubSyncModal';
import { AgentVTWorkforceCommandCenter } from './components/AgentVTWorkforceCommandCenter';
import { TabletDestination } from './components/TabletDestination';
import { AgentRosterBoard } from './components/AgentRosterBoard';
import { AgentCommandCenter } from './components/AgentCommandCenter';
import { WorkboardRuntimePanel } from './components/WorkboardRuntimePanel';
import { AgentNotepadBlackboard } from './components/AgentNotepadBlackboard';

// Base initial files for LeeCode
const initialFiles: Record<string, string> = {
  '/src/App.tsx': `import React from 'react';

export default function CompositionPreview() {
  return (
    <main className="p-6 font-sans">
      <h1 className="text-2xl font-bold">Composition preview</h1>
      <p className="mt-2 text-sm text-zinc-500">Build or load a composition in LeeWay Editor to preview it here.</p>
    </main>
  );
}`,
  '/src/open-notebook-extension.ts': `// Open Notebook Modular Extension Hook
export interface NotebookBridge {
  registerSource: (title: string, content: string) => Promise<void>;
  queryGrounded: (prompt: string) => Promise<string>;
}

export const leewayNotebookBridge: NotebookBridge = {
  async registerSource(title, content) {
    console.log('[OpenNotebook Bridge] Ingesting source:', title);
  },
  async queryGrounded(prompt) {
    return 'Grounded response from Open Notebook engine.';
  }
};`,
  '/README.md': `# LeeWay Agent Workstation & Open Notebook
A sovereign agent desktop environment integrating:
- Open Notebook: Full-featured, self-hosted NotebookLM research engine
- Termux & Linux Terminal: Android ARM64, Ubuntu Bash, and PowerShell Core
- LeeCode: Virtual TypeScript and Python development environment
- Web Research: Governed metasearch and page extractor
- Agent Blackboard: LeeWay Workboard source of truth for assignments and communication
- Data Fabric: Unified read-only access to SQLite, Trino, and vector memory
- Memory Pallium: Distributed cognitive cache lake`,
  '/termux/setup.sh': `#!/data/data/com.termux/files/usr/bin/bash
# Termux Environment Bootstrap for Open Notebook
echo "[Termux] Updating package catalog..."
pkg update -y
echo "[Termux] Installing Python, Node.js, and Termux API..."
pkg install -y python nodejs git termux-api
echo "[Termux] Initializing Open Notebook Grounded Agent..."
open-notebook status
echo "[Termux] Setup complete. Ready for mobile research."`,
  '/termux/termux.properties': `# Termux Configuration
extra-keys = [['ESC','TAB','CTRL','ALT','~','/','-','|','UP','DOWN']]
bell-character = ignore
fullscreen = true
use-black-ui = true`,
  '/config.json': `{
  "agent": "Agent Lee",
  "version": "4.2.0-modular",
  "extensions": ["open-notebook", "termux-terminal", "blackboard", "telemetry"],
  "memoryNodes": 5,
  "telemetry": true,
  "securityLevel": "maximum"
}`
};

const DATA_SOURCES = [
  { id: 'evidence-vault', label: 'Evidence Vault / SQLite', role: 'Receipts + evidence hot tier' },
  { id: 'open-notebook-store', label: 'Open Notebook Vectors', role: 'Indexed research source chunks' },
  { id: 'trino', label: 'Trino', role: 'Federated query surface' },
  { id: 'gravitino', label: 'Gravitino', role: 'Metadata/catalog surface' },
  { id: 'sql-server', label: 'SQL Server', role: 'Structured relational source' },
  { id: 'forgejo', label: 'Forgejo', role: 'Repository/file authority projection' },
  { id: 'seafile', label: 'Seafile', role: 'File/object collaboration projection' }
];

export default function App() {
  // Main Navigation App
  const [currentApp, setCurrentApp] = useState<WorkstationAppId>(() => (
    new URLSearchParams(window.location.search).get('view') === 'preview' ? 'editor' : 'desktop'
  ));
  const [isChassisMode, setIsChassisMode] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isRuntimeCardDismissed, setIsRuntimeCardDismissed] = useState(() => {
    try {
      return localStorage.getItem('leeway_agent_vt_runtime_card_dismissed_v1') === 'true';
    } catch {
      return false;
    }
  });

  const dismissRuntimeCard = () => {
    setIsRuntimeCardDismissed(true);
    try {
      localStorage.setItem('leeway_agent_vt_runtime_card_dismissed_v1', 'true');
    } catch {
      // Dismiss for this session even when this device cannot save preferences.
    }
  };

  const activeAgentId = 'workstation-local';

  // LeeCode state
  const [files, setFiles] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('leeway_virtual_files');
      if (saved) return JSON.parse(saved);
    } catch (_e) {}
    return initialFiles;
  });
  const [activeFile, setActiveFile] = useState<string>('/src/App.tsx');
  const [fileContent, setFileContent] = useState<string>(initialFiles['/src/App.tsx'] || '');

  // LeeCode chat
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; text: string }>>([
    { role: 'system', text: 'No chat provider is connected. This panel will not simulate agent responses.' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Web Research state
  // Autonomous Multi-Engine Research State
  const [browserUrl, setBrowserUrl] = useState('about:blank');
  const [urlInput, setUrlInput] = useState('');
  const [browserHistory, setBrowserHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'ready' | 'empty' | 'unbound'>('idle');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchBriefing, setSearchBriefing] = useState<string>('');
  const [consensusScore, setConsensusScore] = useState<number>(0);
  const [enginesQueried, setEnginesQueried] = useState<string[]>([]);
  const [searchError, setSearchError] = useState('');
  const [researchMode, setResearchMode] = useState<'results' | 'page' | 'extracted'>('results');
  const [extractedPage, setExtractedPage] = useState<{ url: string; title: string; markdown: string } | null>(null);

  // Agent Notepad state
  const [notepadText, setNotepadText] = useState(() => {
    return `# Shared Intake Workspace\n\nGoal: Build local voice-assistant and research partner.\nEvidence state: awaiting verified source ingestion.`;
  });

  // Data Fabric state
  const [dataSource, setDataSource] = useState('evidence-vault');
  const [dataQuery, setDataQuery] = useState('');
  const [dataRows, setDataRows] = useState<any[]>([]);
  const [dataStatus, setDataStatus] = useState<'IDLE' | 'QUERYING' | 'CONNECTED' | 'UNBOUND'>('IDLE');

  // Workboard state
  const [workboardUrl, setWorkboardUrl] = useState('http://localhost:5339');
  const [workboardStatus, setWorkboardStatus] = useState('CHECKING');

  useEffect(() => {
    let stopped = false;
    const checkWorkboard = async () => {
      try {
        const parsed = new URL(workboardUrl);
        const response = await fetch(`/api/runtime/probe?url=${encodeURIComponent(parsed.toString())}`, { cache: 'no-store' });
        const result = await response.json() as { state?: string };
        if (!response.ok || result.state !== 'UP') throw new Error('Workboard endpoint is unavailable.');
        if (!stopped) setWorkboardStatus('ENDPOINT REACHABLE · UI UNVERIFIED');
      } catch {
        if (!stopped) setWorkboardStatus('UNAVAILABLE');
      }
    };
    void checkWorkboard();
    const intervalId = window.setInterval(() => { void checkWorkboard(); }, 15_000);
    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [workboardUrl]);

  // Diagnostics state
  const [telemetry, setTelemetry] = useState({ cpu: 0, ram: 0, disk: 0, temp: 0 });

  // Memory Pallium
  const [syncedNodes, setSyncedNodes] = useState(5);

  // Open Notebook Drawer toggle (Alt+N)
  const [isNotebookDrawerOpen, setIsNotebookDrawerOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);

  // Global Alt+N shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setIsNotebookDrawerOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Save files to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('leeway_virtual_files', JSON.stringify(files));
    } catch (_e) {}
  }, [files]);

  // Real host telemetry from the Agent Tablet backend. Unsupported fields remain zero until an adapter exists.
  useEffect(() => {
    let stopped = false;
    const pollTelemetry = async () => {
      try {
        const response = await fetch('/api/diagnostics/snapshot', { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (stopped) return;
        setTelemetry({
          cpu: Number(data.telemetry?.cpu || 0),
          ram: Number(data.telemetry?.ram || 0),
          disk: Number(data.telemetry?.disk || 0),
          temp: Number(data.telemetry?.temp || 0)
        });
      } catch {
        if (!stopped) setTelemetry({ cpu: 0, ram: 0, disk: 0, temp: 0 });
      }
    };
    pollTelemetry();
    const interval = window.setInterval(pollTelemetry, 2500);
    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, []);

  // Save current file in LeeCode
  const handleSaveFile = () => {
    setFiles(prev => ({ ...prev, [activeFile]: fileContent }));
    showToast(`Saved ${activeFile}`);
  };

  // Switch active file in LeeCode
  const handleSelectFile = (path: string) => {
    setActiveFile(path);
    setFileContent(files[path] || '');
  };

  // Autonomous Web Research: Multi-Engine Consensus for Agent Lee & Assisting Agents
  const runWebSearch = async (query: string) => {
    const q = query.trim();
    if (!q) return;
    setUrlInput(q);
    setResearchMode('results');
    setSearchStatus('searching');
    setSearchError('');
    setSearchResults([]);
    setSearchBriefing('');

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&agent_id=${encodeURIComponent(activeAgentId)}`);
      const data = await res.json();
      if (!res.ok) {
        setSearchResults([]);
        setSearchBriefing('');
        setConsensusScore(0);
        setEnginesQueried([]);
        setSearchStatus('unbound');
        setSearchError(data.evidence || data.error || `Search provider returned ${res.status}`);
        return;
      }
      const results = data.results || [];
      setSearchResults(results);
      setSearchBriefing(data.agentBriefing || '');
      setConsensusScore(Number(data.consensusScore || 0));
      setEnginesQueried(data.enginesQueried || []);
      setSearchStatus(results.length > 0 ? 'ready' : 'empty');

    } catch (err: any) {
      setSearchStatus('unbound');
      setSearchError(`Search capability unavailable: ${err?.message || 'unbound provider'}`);
    }
  };

  // Open direct URL in research browser
  const openDirectUrl = (url: string) => {
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = `https://${finalUrl}`;
    setBrowserUrl(finalUrl);
    setUrlInput(finalUrl);
    setResearchMode('page');
  };

  // Extract page content
  const extractPage = async (url: string) => {
    try {
      const res = await fetch('/api/web/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, agent_id: activeAgentId })
      });
      const data = await res.json();
      setExtractedPage({
        url,
        title: data.title || url,
        markdown: data.markdown || ''
      });
      setResearchMode('extracted');
    } catch (err: any) {
      showToast(`Extraction failed: ${err?.message}`);
    }
  };

  const openWorkboardForEvidence = () => {
    setCurrentApp('workboard');
    showToast('Nothing was sent: no approved Workboard evidence-ingest API is configured. Use the connected Workboard UI.');
  };

  // Query Data Fabric
  const handleDataQuery = async () => {
    setDataStatus('QUERYING');
    try {
      const res = await fetch('/api/data/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: dataSource, query: dataQuery, agent_id: activeAgentId })
      });
      const data = await res.json();
      if (!res.ok) {
        setDataRows([]);
        setDataStatus('UNBOUND');
        return;
      }
      setDataRows(data.rows || []);
      setDataStatus('CONNECTED');
    } catch (_err) {
      setDataStatus('UNBOUND');
    }
  };

  // LeeCode Chat send
  const handleSendLeeCodeChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [
      ...prev,
      { role: 'user', text: chatInput.trim() },
      { role: 'system', text: 'UNBOUND_MODEL_PROVIDER: no chat response was generated. Connect an approved model provider or use the Workboard for agent communication.' }
    ]);
    setChatInput('');
  };

  if (isMinimized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0d0e12]">
        <div
          onClick={() => setIsMinimized(false)}
          className="p-4 bg-[#c0b9a3] border-4 border-white rounded shadow-2xl flex items-center gap-3 cursor-pointer hover:scale-105 transition-all text-black select-none"
        >
          <div className="w-4 h-4 rounded-full bg-orange-500 animate-ping"></div>
          <div>
            <div className="text-xs font-bold">LEEWAY WORKSTATION & OPEN NOTEBOOK (MINIMIZED)</div>
            <div className="text-[10px] text-zinc-700">Click anywhere to restore workstation window</div>
          </div>
        </div>
      </div>
    );
  }

  const appContent = (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#18191f]">
      {/* OS Taskbar */}
      <div className="order-2 h-8 bg-[#c0c0c0] border-t border-black flex items-center px-1 shrink-0 z-30 text-[9px] font-bold gap-1 select-none overflow-x-auto">
        {/* Eight user-facing tablet destinations. Implementation tools live inside their owning workspace. */}
        {[
          { id: 'desktop' as const, label: 'Home', icon: TerminalIcon },
          { id: 'workforce' as const, label: 'Workforce', icon: Bot },
          { id: 'notepad' as const, label: 'Blackboard', icon: FileText },
          { id: 'editor' as const, label: 'LeeWay Office', icon: Layers },
          { id: 'continuum' as const, label: 'Continuum', icon: BookOpen },
          { id: 'diagnostics' as const, label: 'Diagnostics', icon: Activity },
          { id: 'preview' as const, label: 'Preview', icon: GlobeIcon },
          { id: 'apps' as const, label: 'Apps / Developments', icon: CodeIcon }
        ].map(app => {
          const IconComp = app.icon;
          const isActive = currentApp === app.id;
          return (
            <button
              key={app.id}
              onClick={() => setCurrentApp(app.id)}
              className={`px-2.5 py-0.5 border text-[8.5px] uppercase active:bg-zinc-400 border-t-white border-l-white border-r-gray-600 border-b-gray-600 flex items-center gap-1 whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-zinc-400 text-blue-950 font-black border-inner'
                  : 'bg-gray-300 hover:bg-zinc-100 text-black'
              }`}
            >
              <IconComp size={11} />
              <span>{app.label}</span>
            </button>
          );
        })}

        <div className="ml-auto" />

      </div>

      {/* Main Canvas Area */}
      <div className="order-1 flex-grow flex overflow-hidden relative">
        {/* The editor stays mounted so opening Blackboard cannot discard an active edit. */}
        <LeeWayEditor visible={currentApp === 'editor'} files={files}
          onOpenBlackboard={() => setCurrentApp('workboard')}
          onOpenDiagnostics={() => setCurrentApp('diagnostics')}
          onSave={(target, html, expected) => {
            const stored = JSON.parse(localStorage.getItem('leeway_virtual_files') || '{}') as Record<string, string>;
            if ((files[target] ?? null) !== expected || (stored[target] ?? null) !== expected) {
              throw new Error('SANDBOX_REVISION_CONFLICT: the file changed. Reopen it before saving.');
            }
            const next = { ...files, ...stored, [target]: html };
            localStorage.setItem('leeway_virtual_files', JSON.stringify(next));
            if (JSON.parse(localStorage.getItem('leeway_virtual_files') || '{}')[target] !== html) {
              throw new Error('SANDBOX_WRITE_NOT_VERIFIED');
            }
            setFiles(next); setActiveFile(target); setFileContent(html);
          }} />
        {/* ================= 1. DESKTOP VIEW ================= */}
        {currentApp === 'desktop' && (
          <AgentCommandCenter
            workboardStatus={workboardStatus}
            onOpenSurface={(surface) => setCurrentApp(surface)}
          />
        )}
        {false && (
          <div className="flex-grow bg-[#008080] p-6 flex flex-wrap content-start gap-6 overflow-y-auto relative select-none">
            <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>

            {[
              { id: 'openNotebook' as const, label: 'Open Notebook', icon: BookOpen, desc: 'NotebookLM Grounded Research', badge: 'GROUNDED AI', color: 'text-amber-400' },
              { id: 'crm' as const, label: 'CRM', icon: Database, desc: 'Voice · Scheduling · Translation · Pipeline', badge: 'BUSINESS OPS', color: 'text-blue-300' },
              { id: 'editor' as const, label: 'LeeWay Editor', icon: Layers, desc: 'Local composition · Existing sandbox', badge: 'EDIT / PREVIEW', color: 'text-emerald-300' },
              { id: 'standalone' as const, label: 'Standalone 1-HTML', icon: Download, desc: 'Single-File Portable Bundle', badge: '100% STANDALONE', color: 'text-emerald-400' },
              { id: 'workboard' as const, label: 'Agent Blackboard', icon: FileText, desc: 'Assignments & agent communication', badge: 'WORKBOARD', color: 'text-amber-300' },
              { id: 'browser' as const, label: 'Research Fabric', icon: GlobeIcon, desc: 'Provider-bound federated research', badge: 'PROVIDER', color: 'text-cyan-300' },
              { id: 'vscode' as const, label: 'LeeCode IDE', icon: CodeIcon, desc: 'Agent Workspace & Runtime', color: 'text-blue-300' },
              { id: 'terminal' as const, label: 'Terminal Gateway', icon: TerminalIcon, desc: 'Termux / Ubuntu / PowerShell', color: 'text-green-400' },
              { id: 'diagnostics' as const, label: 'Diagnostics Board', icon: Activity, desc: 'Flow Radar & Telemetry', color: 'text-rose-400' },
              { id: 'workforce' as const, label: 'Workforce Center', icon: Bot, desc: 'W00–W17 evidence projection', badge: 'READ ONLY', color: 'text-cyan-300' },
              { id: 'agentRoster' as const, label: 'Agent Roster', icon: Bot, desc: 'Providers · instances · missions · voice', badge: 'OBSERVE', color: 'text-violet-300' },
              { id: 'workboard' as const, label: 'Workboard Runtime', icon: Layers, desc: 'Docker team runtime · :5339', color: 'text-amber-400' },
              { id: 'database' as const, label: 'Data Fabric', icon: Database, desc: 'Unified Vector & SQL Access', color: 'text-purple-300' },
              { id: 'pallium' as const, label: 'Memory Pallium', icon: Layers, desc: 'Distributed Cognitive Cache', color: 'text-teal-300' },
              { id: 'github' as const, label: 'Push to GitHub', icon: Github, desc: 'Sync & Push under same name', badge: 'GIT SYNC', color: 'text-white' }
            ].map(item => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'github') {
                      setIsGitHubModalOpen(true);
                    } else {
                      setCurrentApp(item.id as WorkstationAppId);
                    }
                  }}
                  className="w-28 flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer hover:bg-white/20 active:bg-white/30 text-white transition-all group"
                >
                  <div className="w-14 h-14 bg-[#232733] rounded-xl border border-white/30 shadow-lg flex items-center justify-center group-hover:scale-110 group-hover:border-cyan-400 transition-all relative">
                    <IconComp size={28} className={item.color} />
                    {item.badge && (
                      <span className="absolute -top-2 -right-2 bg-cyan-600 text-black font-extrabold text-[7.5px] px-1.5 py-0.5 rounded-full uppercase shadow">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold mt-2 text-center leading-tight drop-shadow">
                    {item.label}
                  </span>
                  <span className="text-[8px] text-white/70 text-center line-clamp-1 mt-0.5">
                    {item.desc}
                  </span>
                </div>
              );
            })}

            {/* Sovereign Multi-Agent Control Card */}
            {!isRuntimeCardDismissed && (
            <div role="region" aria-label="Agent Lee runtime information" className="relative ml-auto basis-full w-full bg-zinc-950/95 border border-cyan-500/40 p-4 rounded-2xl max-w-sm text-xs text-zinc-200 shadow-2xl backdrop-blur-md">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0 flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-sm">
                    <Bot size={16} className="shrink-0" />
                    <span>Agent Lee Sovereign Runtime</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[8px] font-mono font-bold">
                    MODEL OPTIONAL
                  </span>
                </div>
                <button
                  type="button"
                  onClick={dismissRuntimeCard}
                  aria-label="Dismiss Agent Lee runtime information"
                  title="Dismiss runtime information"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-600 bg-zinc-900 text-zinc-200 hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed mb-2.5">
                Governed workstation for Agent Lee and assisting agents. Provider-dependent capabilities report their actual bound or unbound state; no synthetic execution is promoted as live evidence.
              </p>
              <div className="flex flex-wrap gap-1 text-[8px] font-mono text-zinc-400 mb-3">
                <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-cyan-300">Identity: NOT VERIFIED</span>
                <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-emerald-300">Search: {searchStatus.toUpperCase()}</span>
                <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-amber-300">Terminal: Termux + Bash</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentApp('workboard')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-extrabold rounded-lg text-[11px] flex items-center gap-1.5 shadow"
                >
                  <FileText size={12} />
                  <span>Open Agent Blackboard</span>
                </button>
                <button
                  onClick={() => setCurrentApp('browser')}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-cyan-800 rounded-lg font-bold text-[11px] flex items-center gap-1.5"
                >
                  <GlobeIcon size={12} />
                  <span>Research Fabric</span>
                </button>
              </div>
            </div>
            )}
          </div>
        )}

        {/* ================= CRM BUSINESS OPERATIONS ================= */}
        {currentApp === 'crm' && (
          <div className="flex-grow flex flex-col overflow-hidden bg-white">
            <div className="h-10 shrink-0 bg-[#071f49] text-white flex items-center justify-between px-4 border-b border-[#d99a1e]">
              <div className="flex items-center gap-3">
                <Database size={14} className="text-[#d99a1e]" />
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.16em]">LeeWay Business Operations</div>
                  <div className="text-[8px] text-blue-200">Canonical LeeWay Agentic CRM/ERP · shared records not yet verified</div>
                </div>
              </div>
              <a href="https://4citeb4u.github.io/Leeway-Agentic-CRM-ERP/" target="_blank" rel="noreferrer"
                 className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-[8px] font-bold uppercase tracking-wider">
                Open Full CRM/ERP
              </a>
            </div>
            <iframe title="LeeWay Agentic CRM/ERP" src="https://4citeb4u.github.io/Leeway-Agentic-CRM-ERP/"
              className="flex-grow w-full border-0 bg-white"
              allow="microphone; geolocation; clipboard-read; clipboard-write" />
          </div>
        )}

        {/* ================= FULL OPEN NOTEBOOK APPLICATION ================= */}
        {currentApp === 'openNotebook' && (
          <div className="flex-grow flex flex-col overflow-hidden">
            <OpenNotebookApp
              onExportToFile={(path, content) => {
                setFiles(prev => ({ ...prev, [path]: content }));
                setActiveFile(path);
                setFileContent(content);
              }}
              onSyncToNotepad={(text) => {
                setNotepadText(prev => prev + '\n\n' + text);
              }}
              activeCodeFile={{ path: activeFile, content: fileContent }}
              agentNotepadContent={notepadText}
              onOpenApp={setCurrentApp}
            />
          </div>
        )}

        {/* ================= 3. LEECODE WORKSPACE ================= */}
        {currentApp === 'vscode' && (
          <div className="flex-grow flex bg-[#1e1e1e] text-zinc-200 overflow-hidden">
            {/* Activity Bar */}
            <div className="w-11 bg-[#252526] flex flex-col items-center py-3 gap-4 border-r border-black shrink-0">
              <Folder size={18} className="text-cyan-400 cursor-pointer" />
              <CodeIcon size={18} className="text-zinc-500 hover:text-white cursor-pointer" />
              <div className="mt-auto">
                <button
                  onClick={() => setCurrentApp('workboard')}
                  title="Open Multi-Agent Blackboard"
                  className="p-1.5 bg-amber-950 text-amber-400 hover:bg-amber-900 border border-amber-700/60 rounded-lg"
                >
                  <FileText size={16} />
                </button>
              </div>
            </div>

            {/* VFS Explorer */}
            <div className="w-48 bg-[#181818] border-r border-black overflow-y-auto p-2 shrink-0 text-xs">
              <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider mb-2 border-b border-zinc-800 pb-1 flex justify-between items-center">
                <span>WORKSPACE FILES</span>
                <span className="text-[7.5px] text-cyan-400">{Object.keys(files).length} files</span>
              </div>
              <div className="space-y-1 text-[11px]">
                {Object.keys(files).map(filePath => (
                  <div
                    key={filePath}
                    onClick={() => handleSelectFile(filePath)}
                    className={`px-2 py-1 rounded-md cursor-pointer flex items-center gap-1.5 truncate ${
                      activeFile === filePath
                        ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800 font-semibold'
                        : 'hover:bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <FileIcon size={12} className={activeFile === filePath ? 'text-cyan-400' : 'text-zinc-500'} />
                    <span className="truncate">{filePath}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Code Editor Body */}
            <div className="flex-grow flex flex-col overflow-hidden">
              <div className="h-8 bg-[#2d2d2d] border-b border-black flex items-center justify-between px-3 text-xs select-none shrink-0">
                <div className="flex items-center gap-2 text-zinc-300">
                  <FileIcon size={13} className="text-cyan-400" />
                  <span className="font-mono">{activeFile}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={openWorkboardForEvidence}
                    className="px-2.5 py-1 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/60 rounded text-[10px] font-bold flex items-center gap-1"
                    title="Open Workboard; this action does not send the file"
                  >
                    <Share2 size={11} />
                    <span>Open Workboard</span>
                  </button>
                  <button
                    onClick={handleSaveFile}
                    className="px-3 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded text-[10px] font-bold flex items-center gap-1"
                  >
                    <Save size={11} />
                    <span>Save</span>
                  </button>
                </div>
              </div>
              <div className="flex-grow relative bg-[#1e1e1e] p-2 overflow-hidden flex">
                <div className="w-8 select-none text-[10px] text-zinc-600 text-right pr-2 font-mono shrink-0 overflow-hidden leading-relaxed">
                  {fileContent.split('\n').map((_, idx) => (
                    <div key={idx}>{idx + 1}</div>
                  ))}
                </div>
                <textarea
                  value={fileContent}
                  onChange={e => setFileContent(e.target.value)}
                  spellCheck="false"
                  className="flex-grow bg-transparent text-zinc-200 font-mono text-[11px] leading-relaxed resize-none outline-none overflow-y-auto whitespace-pre pl-2 border-l border-zinc-800"
                />
              </div>
            </div>

            {/* LeeCode Assistant Chat */}
            <div className="w-64 bg-[#181818] border-l border-black flex flex-col p-2 shrink-0">
              <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider mb-2 border-b border-zinc-800 pb-1">
                LeeCode Copilot
              </div>
              <div className="flex-grow overflow-y-auto space-y-2 mb-2 pr-1">
                {chatMessages.map((m, i) => (
                  <div
                    key={i}
                    className={`p-2 text-[10px] rounded-lg border leading-tight ${
                      m.role === 'user'
                        ? 'bg-blue-950/40 text-blue-200 border-blue-800'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                    }`}
                  >
                    <span className="text-[7.5px] uppercase font-bold text-zinc-500 block mb-0.5">{m.role}</span>
                    {m.text}
                  </div>
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendLeeCodeChat()}
                  placeholder="Ask LeeCode..."
                  className="flex-grow bg-black text-green-400 text-[10px] p-1.5 border border-zinc-800 rounded outline-none focus:border-cyan-700"
                />
                <button
                  onClick={handleSendLeeCodeChat}
                  className="px-2.5 bg-cyan-800 hover:bg-cyan-700 text-white rounded text-[10px]"
                >
                  <Send size={11} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= 4. WEB RESEARCH BROWSER ================= */}
        {currentApp === 'browser' && (
          <div className="flex-grow flex flex-col bg-white text-zinc-900 overflow-hidden select-none">
            {/* Chrome Bar */}
            <div className="h-10 bg-[#35363a] flex items-center px-3 gap-2 shrink-0">
              <button
                onClick={() => setResearchMode('results')}
                className="w-7 h-7 rounded-full grid place-items-center text-zinc-200 hover:bg-white/10"
              >
                <Home size={13} />
              </button>
              <div className="flex-grow h-8 bg-[#202124] rounded-full flex items-center px-3 border border-transparent focus-within:border-zinc-500">
                <Search size={13} className="text-zinc-400 mr-2" />
                <input
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      if (/^https?:\/\//i.test(urlInput)) openDirectUrl(urlInput);
                      else runWebSearch(urlInput);
                    }
                  }}
                  placeholder="Search web or enter URL..."
                  className="flex-grow bg-transparent text-[11px] text-zinc-100 outline-none"
                />
                <button
                  onClick={() => runWebSearch(urlInput)}
                  className="text-[9px] font-bold bg-cyan-600 hover:bg-cyan-500 text-white px-2.5 py-0.5 rounded"
                >
                  SEARCH
                </button>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#202124] border border-amber-800/80 rounded-full text-[9px] font-mono text-amber-300 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span className="font-bold text-zinc-300">SEARCH:</span>
                <span className="text-amber-300 font-bold hidden md:inline">PROVIDER REQUIRED · DIRECT URL EXTRACTION READY</span>
              </div>
            </div>

            {/* Results or Direct Frame */}
            {researchMode === 'page' ? (
              <div className="flex-grow flex flex-col bg-white">
                <div className="h-7 px-3 bg-zinc-100 border-b border-zinc-200 text-[9px] text-zinc-600 flex items-center justify-between">
                  <span className="truncate">{browserUrl}</span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => extractPage(browserUrl)}
                      className="text-cyan-700 hover:underline font-bold"
                    >
                      Extract Content
                    </button>
                    <button
                      onClick={openWorkboardForEvidence}
                      className="text-amber-700 hover:underline font-bold"
                    >
                      + Open Workboard
                    </button>
                  </div>
                </div>
                <iframe
                  src={browserUrl}
                  className="flex-grow w-full border-none"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              </div>
            ) : researchMode === 'extracted' ? (
              <div className="flex-grow overflow-y-auto p-6 bg-zinc-50 select-text">
                <div className="max-w-3xl mx-auto bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <h3 className="text-base font-bold text-zinc-900">{extractedPage?.title}</h3>
                      <p className="text-xs text-green-700">{extractedPage?.url}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (extractedPage) {
                            openWorkboardForEvidence();
                          }
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-black rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow"
                      >
                        <Share2 size={12} />
                        <span>Open Workboard</span>
                      </button>
                      <button
                        onClick={() => {
                          if (extractedPage) {
                            const slug = extractedPage.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
                            const targetPath = `/extracted/${slug}.md`;
                            setFiles(prev => ({ ...prev, [targetPath]: extractedPage.markdown }));
                            showToast(`Saved to LeeCode workspace: ${targetPath}`);
                          }
                        }}
                        className="px-3 py-1.5 bg-cyan-900 hover:bg-cyan-800 text-cyan-200 rounded-lg text-xs font-bold"
                      >
                        Save to LeeCode
                      </button>
                      <button
                        onClick={() => setResearchMode('results')}
                        className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-lg text-xs font-bold"
                      >
                        Back to Search
                      </button>
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-zinc-800">
                    {extractedPage?.markdown}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-grow overflow-y-auto p-6 bg-white select-text">
                {searchStatus === 'idle' && (
                  <div className="max-w-xl mx-auto py-12 text-center space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-800 text-[10px] font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      <span>LIVE SEARCH PROVIDER UNBOUND</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-zinc-900">
                      <span className="text-cyan-600">LeeWay</span> Research Workspace
                    </h2>
                    <p className="text-xs text-zinc-600 leading-relaxed max-w-md mx-auto">
                      Direct URL browsing and real source extraction are available now. Federated search remains explicitly unbound until an authorized search adapter is connected.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center pt-2">
                      {['multi-agent consensus architecture', 'whisper stt latency bounds', 'blackboard coordination protocol', 'sovereign local llm inference'].map((q, i) => (
                        <button
                          key={i}
                          onClick={() => runWebSearch(q)}
                          className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-full text-[10px] text-zinc-800 font-mono"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchStatus === 'searching' && (
                  <div className="py-20 text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-cyan-300 border border-cyan-700 rounded-full text-xs font-mono animate-pulse">
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Checking the bound search capability...</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono">No source result will be displayed unless a real provider returns evidence.</div>
                  </div>
                )}

                {searchStatus === 'unbound' && (
                  <div className="max-w-xl mx-auto py-16 text-center">
                    <div className="border border-amber-200 bg-amber-50 rounded-xl p-6">
                      <div className="text-[10px] font-black uppercase tracking-widest text-amber-700">Search Capability Unbound</div>
                      <p className="text-xs text-zinc-600 mt-3 leading-relaxed">{searchError || 'No authorized search provider is connected.'}</p>
                      <p className="text-[10px] text-zinc-500 mt-3">Paste a full HTTP/HTTPS URL above to use the real page extraction path.</p>
                    </div>
                  </div>
                )}

                {searchStatus === 'ready' && (
                  <div className="max-w-3xl mx-auto space-y-5">
                    {/* Top Autonomous Agent Consensus Briefing Card */}
                    {searchBriefing && (
                      <div className="bg-[#0e121a] border border-cyan-700/80 rounded-xl p-4 shadow-lg text-zinc-200 mb-6 font-mono">
                        <div className="flex items-center justify-between border-b border-cyan-900/80 pb-2.5 mb-3 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="font-bold text-white tracking-wide">PROVIDER RESEARCH BRIEFING</span>
                            <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-950 text-emerald-300 border border-emerald-700">
                              {consensusScore > 0 ? `${consensusScore}% REPORTED SCORE` : 'PROVIDER RESULT'}
                            </span>
                          </div>
                          <button
                            onClick={openWorkboardForEvidence}
                            className="px-3 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded text-[10px] font-bold flex items-center gap-1.5 transition-all shadow"
                          >
                            <Share2 size={11} />
                            <span>Open Workboard</span>
                          </button>
                        </div>
                        <p className="text-xs leading-relaxed text-cyan-100 font-sans mb-3">
                          {searchBriefing}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 text-[8.5px] text-zinc-400 border-t border-cyan-950 pt-2">
                          <span className="font-bold text-zinc-400">ENGINES QUERIED:</span>
                          {enginesQueried.map(eng => (
                            <span key={eng} className="px-1.5 py-0.5 rounded bg-black/60 border border-zinc-800 text-zinc-300">
                              ✓ {eng}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-zinc-500 border-b pb-2 flex items-center justify-between">
                      <span>Provider results: {searchResults.length} source records for "{urlInput}"</span>
                      <span className="text-[10px] text-cyan-700 font-mono">BOUND PROVIDER DISCOVERY</span>
                    </div>

                    {searchResults.map((r, i) => {
                      const engineName = r.engine || 'Provider';
                      const badgeColors: Record<string, string> = {
                        'arXiv': 'bg-purple-100 text-purple-800 border-purple-300',
                        'SearXNG': 'bg-cyan-100 text-cyan-800 border-cyan-300',
                        'DuckDuckGo': 'bg-blue-100 text-blue-800 border-blue-300',
                        'TechDocs': 'bg-amber-100 text-amber-800 border-amber-300',
                        'Wikipedia': 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      };
                      const badgeStyle = badgeColors[engineName] || 'bg-zinc-100 text-zinc-800 border-zinc-300';

                      return (
                        <div key={i} className="space-y-1.5 border-b border-zinc-100 pb-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border ${badgeStyle}`}>
                              {engineName.toUpperCase()}
                            </span>
                            <span className="text-[10px] text-zinc-400 truncate">{r.url}</span>
                            <span className="ml-auto text-[8px] text-emerald-700 font-mono font-bold">
                              {r.score ? `${Math.round(r.score * 100)}% Match` : 'SOURCE RESULT'}
                            </span>
                          </div>
                          <button
                            onClick={() => openDirectUrl(r.url)}
                            className="text-left text-sm font-bold text-blue-700 hover:underline block"
                          >
                            {r.title}
                          </button>
                          <p className="text-xs text-zinc-600 leading-relaxed">{r.snippet}</p>
                          <div className="flex gap-3 pt-1 text-[10px]">
                            <button
                              onClick={openWorkboardForEvidence}
                              className="text-amber-700 hover:underline font-bold flex items-center gap-1"
                            >
                              <Share2 size={10} />
                              <span>Open Workboard</span>
                            </button>
                            <button
                              onClick={() => extractPage(r.url)}
                              className="text-cyan-700 hover:underline"
                            >
                              Extract / Read
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= 5. TERMINAL GATEWAY (TERMUX, UBUNTU, POWERSHELL) ================= */}
        {currentApp === 'terminal' && (
          <TerminalGateway
            activeAgentId={activeAgentId}
            files={files}
            onSaveFile={(path, content) => {
              setFiles(prev => ({ ...prev, [path]: content }));
              if (path === activeFile) {
                setFileContent(content);
              }
            }}
            onDeleteFile={(path) => {
              setFiles(prev => {
                const next = { ...prev };
                delete next[path];
                return next;
              });
            }}
            onOpenApp={(appId) => setCurrentApp(appId)}
            onToggleDrawer={() => setIsNotebookDrawerOpen(prev => !prev)}
            onShowToast={showToast}
            telemetry={telemetry}
            syncedNodes={syncedNodes}
          />
        )}

        {/* ================= 7. DATA FABRIC ================= */}
        {currentApp === 'database' && (
          <div className="flex-grow flex flex-col bg-[#101216] text-zinc-300 font-mono overflow-hidden">
            <div className="h-9 bg-[#000080] text-white px-3 flex items-center gap-3 text-xs font-bold shrink-0">
              <span>LEEWAY DATA FABRIC & OPEN NOTEBOOK VECTORS</span>
              <select
                value={dataSource}
                onChange={e => setDataSource(e.target.value)}
                className="bg-[#111] border border-blue-300/40 rounded px-2 py-0.5 text-[10px]"
              >
                {DATA_SOURCES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <span className="ml-auto text-[10px] text-green-300">STATUS: {dataStatus}</span>
            </div>

            <div className="grid grid-cols-[220px_1fr] flex-grow min-h-0">
              <div className="border-r border-zinc-800 bg-black/40 p-3 overflow-y-auto text-xs">
                <div className="text-[8px] uppercase tracking-wider text-zinc-500 mb-2 font-bold">
                  Canonical Projections
                </div>
                {DATA_SOURCES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setDataSource(s.id)}
                    className={`w-full text-left p-2 mb-1.5 rounded border text-xs ${
                      dataSource === s.id
                        ? 'border-cyan-700 bg-cyan-950/40'
                        : 'border-zinc-800 bg-zinc-900/60'
                    }`}
                  >
                    <div className="font-bold text-cyan-300">{s.label}</div>
                    <div className="text-[9px] text-zinc-500 mt-0.5">{s.role}</div>
                  </button>
                ))}
              </div>

              <div className="flex flex-col min-w-0">
                <div className="p-3 border-b border-zinc-800 bg-zinc-950/60 flex gap-2">
                  <input
                    value={dataQuery}
                    onChange={e => setDataQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleDataQuery()}
                    placeholder="Enter query across vectors or evidence vault..."
                    className="flex-grow bg-black border border-zinc-800 rounded px-3 py-1 text-xs outline-none text-white"
                  />
                  <button
                    onClick={handleDataQuery}
                    className="px-4 bg-blue-800 hover:bg-blue-700 text-white rounded text-xs font-bold"
                  >
                    QUERY
                  </button>
                </div>
                <div className="flex-grow overflow-auto p-4 select-text">
                  <pre className="text-xs text-green-300 whitespace-pre-wrap">
                    {dataRows.length > 0
                      ? JSON.stringify(dataRows, null, 2)
                      : 'No rows returned. Click QUERY to pull data fabric records.'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= SINGLE AGENT BLACKBOARD / WORKBOARD ================= */}
        {currentApp === 'workboard' && (
          <WorkboardRuntimePanel
            initialUrl={workboardUrl}
            onStatusChange={setWorkboardStatus}
            onUrlChange={setWorkboardUrl}
          />
        )}

        {/* ================= AGENT PAD / LOCAL NOTEPAD RESTORATION ================= */}
        {currentApp === 'notepad' && (
          <AgentNotepadBlackboard
            onShowToast={showToast}
            onExportWorkspace={(title, content) => {
              const target = `/workspace/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
              setFiles((prev) => ({ ...prev, [target]: content }));
              setActiveFile(target);
              setFileContent(content);
              showToast(`Saved ${title} to LeeWay Editor`);
            }}
          />
        )}

        {/* ================= 8. DIAGNOSTICS ================= */}
        {currentApp === 'diagnostics' && (
          <DiagnosticsBoard
            telemetry={telemetry}
            openNotebookStatus="LOCAL API :3200"
            workboardStatus={workboardStatus}
            terminalStatus="LOCAL GATEWAY"
            dataStatus={dataStatus}
            activeAgentId={activeAgentId}
            onOptimizeWorkloads={() => {
              showToast('No workload-optimization adapter is bound; telemetry was not changed.');
            }}
          />
        )}

        {/* ================= 8A. AGENT VT WORKFORCE COMMAND CENTER ================= */}
        {currentApp === 'workforce' && (
          <AgentVTWorkforceCommandCenter onShowToast={showToast} />
        )}

        {currentApp === 'continuum' && (
          <TabletDestination destination="continuum" onOpen={setCurrentApp} />
        )}

        {currentApp === 'preview' && (
          <TabletDestination destination="preview" onOpen={setCurrentApp} />
        )}

        {currentApp === 'apps' && (
          <TabletDestination destination="apps" onOpen={setCurrentApp} />
        )}

        {currentApp === 'agentRoster' && <AgentRosterBoard />}

        {/* ================= 9. PALLIUM ================= */}
        {currentApp === 'pallium' && (
          <div className="flex-grow flex flex-col bg-[#111] text-[#00ffcc] p-6 font-mono select-none">
            <div className="bg-[#000080] text-white px-3 py-1.5 mb-4 border border-[#00ffcc]/30 flex justify-between items-center text-xs font-bold">
              <span>Agent Working Memory • {activeAgentId}</span>
              <span className="text-[#00ffcc]">Status: ONLINE</span>
            </div>
            <div className="flex-grow bg-black/80 border border-[#00ffcc]/30 p-6 text-xs flex flex-col gap-4 rounded-xl">
              <div>Cognitive Nodes Synced: <span className="text-white font-bold">{syncedNodes} / 5 Established</span></div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSyncedNodes(n => n + 1)}
                  className="px-3 py-1.5 bg-[#00ffcc]/10 border border-[#00ffcc]/40 hover:bg-[#00ffcc]/20 text-[#00ffcc] font-bold text-xs rounded-lg"
                >
                  Ping Brain Lake
                </button>
                <button
                  onClick={() => showToast('Memory sync cache refreshed')}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-400 font-bold text-xs rounded-lg"
                >
                  Clear Sync Cache
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* On-Screen Virtual Keyboard */}
      {showKeyboard && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-[#c0c0c0] p-2.5 border-2 border-white shadow-2xl z-[100] flex flex-col gap-1 rounded-xl select-none">
          <div className="flex justify-between items-center px-1 mb-1 border-b border-zinc-400 pb-1">
            <span className="text-[8px] font-bold text-zinc-700">VIRTUAL ON-SCREEN KEYBOARD</span>
            <button onClick={() => setShowKeyboard(false)} className="text-zinc-700 hover:text-red-600">
              <X size={12} />
            </button>
          </div>
          {[
            ['1','2','3','4','5','6','7','8','9','0','BKSP'],
            ['Q','W','E','R','T','Y','U','I','O','P'],
            ['A','S','D','F','G','H','J','K','L','ENTER'],
            ['SPACE']
          ].map((row, rIdx) => (
            <div key={rIdx} className="flex gap-0.5 justify-center">
              {row.map(k => (
                <button
                  key={k}
                  onClick={() => {
                    if (k === 'BKSP') {
                      if (currentApp === 'vscode') setFileContent(c => c.slice(0, -1));
                    } else if (k === 'ENTER') {
                      if (currentApp === 'vscode') setFileContent(c => c + '\n');
                    } else if (k === 'SPACE') {
                      if (currentApp === 'vscode') setFileContent(c => c + ' ');
                    } else {
                      if (currentApp === 'vscode') setFileContent(c => c + k.toLowerCase());
                    }
                  }}
                  className={`bg-gray-200 border border-t-white border-l-white border-r-zinc-600 border-b-zinc-600 rounded text-[8px] font-bold p-1 h-6 flex items-center justify-center hover:bg-white active:bg-gray-300 text-black ${
                    k === 'SPACE' ? 'w-24' : k === 'ENTER' ? 'w-12' : k === 'BKSP' ? 'w-12' : 'w-7'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Global Toast */}
      {toastMsg && (
        <div className="fixed bottom-4 left-4 z-50 px-3.5 py-1.5 bg-stone-900 text-white border border-orange-500/60 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2">
          <Check size={13} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Modular Open Notebook Extension Drawer */}
      <OpenNotebookDrawer
        isOpen={isNotebookDrawerOpen}
        onClose={() => setIsNotebookDrawerOpen(false)}
        onMaximizeToFullTab={() => {
          setIsNotebookDrawerOpen(false);
          setCurrentApp('openNotebook');
        }}
        onExportToFile={(path, content) => {
          setFiles(prev => ({ ...prev, [path]: content }));
          setActiveFile(path);
          setFileContent(content);
          setCurrentApp('vscode');
          showToast(`Saved to ${path}`);
        }}
        onSyncToNotepad={(text) => {
          setNotepadText(prev => prev + '\n\n' + text);
          showToast('Saved to local notebook context; not published to Workboard.');
        }}
        activeCodeFile={{ path: activeFile, content: fileContent }}
        agentNotepadContent={notepadText}
      />

      {/* GitHub Sync & Push Modal */}
      <GitHubSyncModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        showToast={showToast}
      />
    </div>
  );

  // If in retro CRT chassis mode:
  if (isChassisMode) {
    return (
      <div className="relative h-screen w-screen bg-[#111215] flex flex-col p-2 md:p-3 overflow-hidden select-none">
        {/* Retro CRT Chassis Bezel Frame */}
        <div className="relative flex-grow bg-[#dcd7c0] rounded-[18px] shadow-2xl border-[6px] border-[#c0b9a3] overflow-hidden flex flex-col p-1.5 md:p-2.5">
          {/* Inner Screen Bezel */}
          <div className="flex-grow bg-[#1a1b1e] rounded-[8px] border-[4px] border-[#ada68f] overflow-hidden flex flex-col relative">
            {appContent}
          </div>

          {/* Chassis Bottom Control Bar */}
          <div className="h-8 flex items-center justify-between px-2 mt-1 select-none">
            <div className="flex items-center gap-2">
              <span className="text-[8.5px] text-[#847e67] font-extrabold tracking-tight italic">
                LEEWAY_AGENT_WORKSTATION // OPEN_NOTEBOOK_INTEGRATED
              </span>
              <span className="text-[7.5px] bg-[#ada68f]/50 px-1.5 py-0.5 rounded text-zinc-900 font-extrabold">
                MODULAR RESEARCH EXTENSION ACTIVE
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setShowKeyboard(!showKeyboard)}
                className={`px-2.5 py-0.5 rounded text-[8px] font-bold border transition-colors ${
                  showKeyboard ? 'bg-green-700 text-white border-green-900' : 'bg-gray-300 shadow-sm border-zinc-400 hover:bg-gray-200 text-black'
                }`}
              >
                KEYBOARD
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="w-3.5 h-3.5 rounded-full border border-red-900 bg-red-500 shadow hover:bg-red-400 active:scale-90"
                title="Minimize VM Window"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full screen mode
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#111215]">
      {appContent}
    </div>
  );
}
