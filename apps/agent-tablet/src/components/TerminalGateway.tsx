import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal as TerminalIcon,
  Maximize2,
  Minimize2,
  Copy,
  Trash2,
  CornerDownLeft,
  Smartphone,
  Server,
  Code2,
  BookOpen,
  Sparkles,
  Check,
  ChevronRight,
  ExternalLink,
  Shield,
  Layers,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { TerminalShellType, Notebook, Source } from '../types';

interface TerminalGatewayProps {
  activeAgentId: string;
  files: Record<string, string>;
  onSaveFile: (path: string, content: string) => void;
  onDeleteFile?: (path: string) => void;
  onOpenApp: (appId: any) => void;
  onToggleDrawer: () => void;
  onShowToast: (msg: string) => void;
  telemetry: { cpu: number; ram: number; disk: number; temp: number };
  syncedNodes: number;
}

interface TermLine {
  id: string;
  type: 'prompt' | 'output' | 'error' | 'info' | 'success' | 'system' | 'banner';
  text: string;
  timestamp?: string;
}

export const TerminalGateway: React.FC<TerminalGatewayProps> = ({
  activeAgentId,
  files,
  onSaveFile,
  onDeleteFile,
  onOpenApp,
  onToggleDrawer,
  onShowToast,
  telemetry,
  syncedNodes
}) => {
  // Shell Type state: ubuntu | powershell | termux
  const [shell, setShell] = useState<TerminalShellType>(() => {
    return (localStorage.getItem('leeway_terminal_shell') as TerminalShellType) || 'termux';
  });

  const [input, setInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('leeway_terminal_history');
      if (saved) return JSON.parse(saved);
    } catch (_e) {}
    return ['termux-info', 'open-notebook status', 'pkg list-installed'];
  });
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [fontSize, setFontSize] = useState<'small' | 'normal' | 'large'>('normal');
  const [termuxPackages, setTermuxPackages] = useState<string[]>([
    'bash', 'coreutils', 'curl', 'git', 'nodejs-lts', 'python', 'open-notebook', 'termux-api', 'sqlite'
  ]);

  // Terminal Lines
  const [lines, setLines] = useState<TermLine[]>(() => {
    return getInitialBanner('termux', activeAgentId);
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new output
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines, isExecuting]);

  // Focus input on mount or click
  useEffect(() => {
    inputRef.current?.focus();
  }, [shell]);

  // Save shell preference
  const handleShellChange = (newShell: TerminalShellType) => {
    setShell(newShell);
    localStorage.setItem('leeway_terminal_shell', newShell);
    const newBanner = getInitialBanner(newShell, activeAgentId);
    setLines(prev => [
      ...prev,
      {
        id: `switch-${Date.now()}`,
        type: 'info',
        text: `--- Switched environment to ${getShellDisplayName(newShell)} ---`
      },
      ...newBanner
    ]);
  };

  function getShellDisplayName(s: TerminalShellType): string {
    switch (s) {
      case 'termux':
        return 'Termux (Android / Linux ARM64)';
      case 'ubuntu':
        return 'Ubuntu Linux (Bash 5.2)';
      case 'powershell':
        return 'PowerShell Core 7.4 (WinGet / Posh)';
    }
  }

  function getPromptPrefix(s: TerminalShellType, agent: string): string {
    switch (s) {
      case 'termux':
        return `u0_a291@localhost:~$`;
      case 'ubuntu':
        return `${agent}@leeway-workstation:~$`;
      case 'powershell':
        return `PS LeeWay:\\${agent}>`;
    }
  }

  function getInitialBanner(s: TerminalShellType, agent: string): TermLine[] {
    const now = new Date().toLocaleTimeString();
    if (s === 'termux') {
      return [
        {
          id: 'termux-b1',
          type: 'banner',
          text: `Welcome to Termux!\n\nDocs:       https://wiki.termux.com\nCommunity:  https://termux.com/community\nGitter:     https://gitter.im/termux/termux\nIRC:        #termux on libera.chat\n\nWorking with packages:\n * Search packages:   pkg search <query>\n * Install a package: pkg install <package>\n * Upgrade packages:  pkg upgrade\n\nOpen Notebook Termux Suite (lfnovo/open-notebook):\n * Check status:       open-notebook status\n * Ask grounded AI:    open-notebook ask "<question>"\n * Ingest source:      open-notebook add <title> <content/url>\n * List sources:       open-notebook list\n * Open Notebook GUI:  open-notebook open\n\nSubscribed repositories:\n * apt.termux.dev/main\n * apt.termux.dev/science\n * github.com/lfnovo/open-notebook\n\nType 'help' for available command list.`
        }
      ];
    } else if (s === 'ubuntu') {
      return [
        {
          id: 'ubu-b1',
          type: 'banner',
          text: `Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-31-generic x86_64)\n\n * Documentation:  https://help.ubuntu.com\n * Management:     https://landscape.canonical.com\n * Support:        https://ubuntu.com/pro\n\nSystem load:  0.18               Processes:             142\nMemory usage: ${telemetry.ram}%                IPv4 address for eth0: 10.0.4.15\nUsage of /:   ${telemetry.disk}% of 100GB       Agent identity:        ${agent}\n\nOpen Notebook Engine: ONLINE (/opt/open-notebook)\nCommands: help, notebook, open-notebook, status, ls, cat, clear`
        }
      ];
    } else {
      return [
        {
          id: 'ps-b1',
          type: 'banner',
          text: `PowerShell 7.4.2\nLoading personal and system profiles took 284ms.\n(c) Microsoft Corporation. All rights reserved.\nhttps://aka.ms/powershell\n\nType 'Get-Help' or 'help' for command assistance.\nOpen Notebook module: Imported [v4.2.0-modular]`
        }
      ];
    }
  }

  // Retrieve current active notebook from localStorage
  const getActiveNotebook = (): Notebook | null => {
    try {
      const saved = localStorage.getItem('leeway_open_notebooks_v1');
      if (!saved) return null;
      const nbs: Notebook[] = JSON.parse(saved);
      const activeId = localStorage.getItem('leeway_active_notebook_id') || nbs[0]?.id;
      return nbs.find(n => n.id === activeId) || nbs[0] || null;
    } catch (_e) {
      return null;
    }
  };

  // Add source to active notebook
  const addSourceToNotebook = (title: string, content: string, url?: string): boolean => {
    try {
      const saved = localStorage.getItem('leeway_open_notebooks_v1');
      let nbs: Notebook[] = saved ? JSON.parse(saved) : [];
      if (nbs.length === 0) return false;

      const activeId = localStorage.getItem('leeway_active_notebook_id') || nbs[0].id;
      const target = nbs.find(n => n.id === activeId) || nbs[0];

      const newSrc: Source = {
        id: `src-term-${Date.now()}`,
        title: title.slice(0, 80),
        type: url ? 'url' : 'text',
        url,
        content,
        wordCount: content.split(/\s+/).filter(Boolean).length,
        chunkCount: Math.max(1, Math.ceil(content.split(/\s+/).length / 150)),
        isActive: true,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        summary: content.slice(0, 140) + '...',
        tags: ['terminal-ingest', shell]
      };

      target.sources = [newSrc, ...(target.sources || [])];
      localStorage.setItem('leeway_open_notebooks_v1', JSON.stringify(nbs));
      return true;
    } catch (_e) {
      return false;
    }
  };

  // Handle Command Submission
  const handleCommand = async (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    // Save to history
    const updatedHistory = [cmd, ...history.filter(h => h !== cmd)].slice(0, 50);
    setHistory(updatedHistory);
    try {
      localStorage.setItem('leeway_terminal_history', JSON.stringify(updatedHistory));
    } catch (_e) {}
    setHistoryIndex(-1);

    const promptText = `${getPromptPrefix(shell, activeAgentId)} ${cmd}`;
    const promptLine: TermLine = {
      id: `p-${Date.now()}`,
      type: 'prompt',
      text: promptText
    };

    setLines(prev => [...prev, promptLine]);
    setInput('');
    setIsExecuting(true);

    const parts = cmd.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
    const mainCommand = (parts[0] || '').toLowerCase();
    const args = parts.slice(1).map(a => a.replace(/^["']|["']$/g, ''));

    // Command Dispatcher
    try {
      if (mainCommand === 'clear' || mainCommand === 'cls') {
        setLines([]);
        setIsExecuting(false);
        return;
      }

      if (mainCommand === 'help' || mainCommand === 'get-help' || mainCommand === '?') {
        let helpText = '';
        if (shell === 'termux') {
          helpText = `Termux Shell Commands:
  pkg <install|search|upgrade|list-installed> : Termux package manager
  termux-info             : Detailed Android environment & Termux specs
  termux-battery-status   : Show device battery & power stats
  termux-toast "<text>"   : Show Android native toast notification
  termux-setup-storage    : Grant and simulate Android shared storage
  termux-open-url <url>   : Open URL in research browser
  open-notebook <subcmd>  : Open Notebook sovereign research CLI
    open-notebook status  : Active notebook & grounding health
    open-notebook list    : List indexed sources & citations
    open-notebook ask "q" : Ask grounded AI with bracket citations
    open-notebook add <s> : Ingest new document or URL
    open-notebook open    : Launch full GUI workstation
    open-notebook drawer  : Slide out modular research panel
  ls, cat, touch, echo    : File system operations
  whoami, uname -a, pwd   : System and identity queries
  python, node, git       : Runtime environments
  clear                   : Clear terminal display`;
        } else if (shell === 'ubuntu') {
          helpText = `Ubuntu Bash Commands:
  open-notebook <subcmd>  : Sovereign research suite (status, list, ask, add, open)
  ls [-la] [path]         : List directory contents
  cat <file>              : View file content
  touch <file>            : Create virtual workspace file
  echo <text> [> file]    : Output text or write to file
  git <status|clone>      : Version control operations
  python3 [args]          : Python runtime
  uname -a, whoami, pwd   : System discovery
  status                  : Telemetry and node synchronizer
  clear                   : Clear console`;
        } else {
          helpText = `PowerShell Core Commands:
  Get-OpenNotebook        : Query Open Notebook engine
  open-notebook <subcmd>  : CLI research commands
  Get-ChildItem (ls, dir) : List items in directory
  Get-Content (cat) <file>: Read file content
  Set-Content (echo)      : Write file
  Get-Process (ps)        : List running processes
  Clear-Host (clear, cls) : Clear terminal buffer`;
        }

        appendLine('info', helpText);
        setIsExecuting(false);
        return;
      }

      // ================= 1. TERMUX SPECIALIZED COMMANDS =================
      if (mainCommand === 'pkg' || mainCommand === 'apt') {
        const sub = (args[0] || '').toLowerCase();
        if (sub === 'install' || sub === 'add') {
          const pkgName = args[1] || '';
          if (!pkgName) {
            appendLine('error', `Usage: ${mainCommand} install <package-name>`);
          } else {
            appendLine('output', `Checking availability of ${pkgName} in termux repositories...`);
            await delay(400);
            appendLine('output', `Reading package lists... Done\nBuilding dependency tree... Done`);
            await delay(300);
            appendLine('output', `The following NEW packages will be installed: ${pkgName}\nNeed to get 2.4 MB of archives.\nUnpacking ${pkgName} (aarch64)...`);
            await delay(400);
            appendLine('output', `Setting up ${pkgName} ...\nConfiguring runtime bindings... Done.`);

            if (!termuxPackages.includes(pkgName)) {
              setTermuxPackages(prev => [...prev, pkgName]);
            }
            appendLine('success', `[SUCCESS] Package '${pkgName}' installed successfully in Termux.`);
            onShowToast(`Termux: installed ${pkgName}`);
          }
        } else if (sub === 'search') {
          const query = args[1] || '';
          appendLine('output', `Sorting... Done\nFull Text Search... Done`);
          const allKnown = [
            { name: 'open-notebook', desc: 'Self-hosted AI research engine & grounded citation CLI' },
            { name: 'termux-api', desc: 'Termux Android API hardware interface tools' },
            { name: 'python', desc: 'Python 3.12 interpreter and pip package manager' },
            { name: 'nodejs', desc: 'Node.js JavaScript runtime environment (LTS)' },
            { name: 'clang', desc: 'C/C++ compiler and LLVM toolchain' },
            { name: 'ffmpeg', desc: 'Tools for transcoding and streaming audio/video' },
            { name: 'sqlite', desc: 'Embedded relational database management system' },
            { name: 'git', desc: 'Fast, scalable, distributed revision control system' },
            { name: 'whisper-cpp', desc: 'High-performance local speech recognition' }
          ];
          const matches = allKnown.filter(p => !query || p.name.includes(query) || p.desc.toLowerCase().includes(query.toLowerCase()));
          const out = matches.map(m => `${m.name}/stable [aarch64]\n  ${m.desc}`).join('\n\n');
          appendLine('output', out || `No packages found matching '${query}'`);
        } else if (sub === 'list-installed' || sub === 'list') {
          const out = termuxPackages.map(p => `${p}/now 1.4.2 aarch64 [installed]`).join('\n');
          appendLine('output', `Listing installed packages in Termux:\n${out}`);
        } else if (sub === 'update' || sub === 'upgrade') {
          appendLine('output', `Hit:1 https://packages.termux.dev/apt/termux-main stable InRelease\nHit:2 https://packages.termux.dev/apt/termux-science science InRelease\nHit:3 https://github.com/lfnovo/open-notebook/releases stable InRelease\nReading package lists... Done\nAll packages are up to date.`);
        } else {
          appendLine('output', `Termux Package Manager (pkg):\nCommands: pkg install <pkg>, pkg search <q>, pkg update, pkg list-installed`);
        }
        setIsExecuting(false);
        return;
      }

      if (mainCommand === 'termux-info') {
        const info = `Termux Variables:
TERMUX_VERSION=0.118.1
TERMUX_IS_DEBUGGABLE_BUILD=0
TERMUX_MAIN_PACKAGE_FORMAT=debian
PREFIX=/data/data/com.termux/files/usr
HOME=/data/data/com.termux/files/home

Device Information:
OS: Android 14 (API 34)
Kernel: Linux 5.15.137-android14-aarch64 #1 SMP PREEMPT
Architecture: aarch64 (ARMv8.2-A 64-bit)
CPU Cores: 8 (4x Cortex-A720, 2x Cortex-X4, 2x Cortex-A520)
Hardware: Qualcomm Snapdragon 8 Gen 3
Thermal: ${telemetry.temp}°C
Memory: Total 12GB | Free ${Math.round(12 * (1 - telemetry.ram / 100))}GB
Storage: 256GB UFS 4.0 (/data/data/com.termux)
Active Agent: ${activeAgentId}
Open Notebook Extension: LOADED [v4.2.0-modular]`;
        appendLine('output', info);
        setIsExecuting(false);
        return;
      }

      if (mainCommand === 'termux-battery-status') {
        const batt = {
          health: 'GOOD',
          percentage: 86,
          plugged: 'UNPLUGGED',
          status: 'DISCHARGING',
          temperature: (telemetry.temp - 10).toFixed(1),
          current: -420
        };
        appendLine('output', JSON.stringify(batt, null, 2));
        setIsExecuting(false);
        return;
      }

      if (mainCommand === 'termux-toast') {
        const msg = args.join(' ') || 'Hello from Termux!';
        onShowToast(`[Termux Toast]: ${msg}`);
        appendLine('success', `Toast triggered: "${msg}"`);
        setIsExecuting(false);
        return;
      }

      if (mainCommand === 'termux-setup-storage') {
        appendLine('output', `Requesting Android READ/WRITE_EXTERNAL_STORAGE permissions...`);
        await delay(300);
        appendLine('success', `Access granted.\nSymlinked ~/storage/shared -> /sdcard\nSymlinked ~/storage/downloads -> /sdcard/Download`);
        setIsExecuting(false);
        return;
      }

      if (mainCommand === 'termux-open-url') {
        const targetUrl = args[0] || 'https://github.com/lfnovo/open-notebook.git';
        appendLine('info', `Dispatched Android Intent: android.intent.action.VIEW -> ${targetUrl}`);
        onOpenApp('browser');
        onShowToast(`Opened ${targetUrl} in Web Research`);
        setIsExecuting(false);
        return;
      }

      // ================= 2. OPEN NOTEBOOK CLI COMMANDS =================
      if (mainCommand === 'open-notebook' || mainCommand === 'notebook' || mainCommand === 'get-opennotebook') {
        const sub = (args[0] || '').toLowerCase();
        const nb = getActiveNotebook();

        if (!sub || sub === 'status' || sub === 'info') {
          if (!nb) {
            appendLine('error', 'No active notebook found. Create one in Open Notebook GUI.');
          } else {
            const activeSources = nb.sources.filter(s => s.isActive).length;
            const totalWords = nb.sources.reduce((acc, s) => acc + (s.wordCount || 0), 0);
            const statusCard = `=====================================================
  OPEN NOTEBOOK RESEARCH ENGINE (lfnovo/open-notebook)
=====================================================
Active Notebook:  "${nb.title}"
Notebook ID:      ${nb.id}
Grounding Model:  Gemini 3.8 Flash (Server-Side)
Indexed Sources:  ${nb.sources.length} sources (${activeSources} active in context)
Corpus Size:      ~${totalWords.toLocaleString()} words (~${Math.ceil(totalWords / 150)} chunks)
Notes & Scratch:  ${nb.notes?.length || 0} saved notes
Studio Artifacts: ${nb.artifacts?.length || 0} generated artifacts
Environment:      ${shell.toUpperCase()}
Status:           ONLINE & READY FOR GROUNDED QUERIES
=====================================================
Commands:
  open-notebook list
  open-notebook ask "<your question>"
  open-notebook add "<title>" "<content or url>"
  open-notebook open
  open-notebook drawer`;
            appendLine('output', statusCard);
          }
          setIsExecuting(false);
          return;
        }

        if (sub === 'list' || sub === 'sources') {
          if (!nb || nb.sources.length === 0) {
            appendLine('info', 'No sources indexed in the active notebook.');
          } else {
            let out = `Active Notebook: "${nb.title}" (${nb.sources.length} Sources)\n\n`;
            out += `IDX  STATUS    TYPE      WORDS    TITLE\n`;
            out += `---  --------  --------  -------  ------------------------------------\n`;
            nb.sources.forEach((s, idx) => {
              const statusStr = s.isActive ? '[ACTIVE] ' : '[MUTED]  ';
              const typeStr = (s.type || 'text').padEnd(8).slice(0, 8);
              const wordsStr = String(s.wordCount || 0).padStart(7);
              out += `[${idx + 1}]  ${statusStr} ${typeStr}  ${wordsStr}  ${s.title.slice(0, 42)}\n`;
            });
            appendLine('output', out);
          }
          setIsExecuting(false);
          return;
        }

        if (sub === 'ask' || sub === 'query' || sub === 'chat') {
          const queryText = args.slice(1).join(' ');
          if (!queryText) {
            appendLine('error', 'Usage: open-notebook ask "<your question>"');
            setIsExecuting(false);
            return;
          }

          if (!nb) {
            appendLine('error', 'No active notebook loaded.');
            setIsExecuting(false);
            return;
          }

          const activeSources = nb.sources.filter(s => s.isActive);
          if (activeSources.length === 0) {
            appendLine('info', 'Warning: All sources in this notebook are muted. The grounded query will remain blocked until a source is active.');
          }

          appendLine('info', `[OpenNotebook] Grounding query with ${activeSources.length} active sources. The server will use deterministic retrieval unless an authorized model provider is bound.`);

          try {
            const res = await fetch('/api/notebook/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: queryText,
                sources: activeSources,
                notebookTitle: nb.title
              })
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            let responseText = `\n>>> RESPONSE (Grounded on "${nb.title}"):\n\n${data.answer}\n`;
            if (data.citedSources && data.citedSources.length > 0) {
              responseText += `\n--- CITATIONS & EVIDENCE ---\n`;
              data.citedSources.forEach((c: any) => {
                responseText += `[${c.index}] ${c.title}\n    Snippet: ${c.snippet}\n`;
              });
            }

            if (data.suggestedQuestions && data.suggestedQuestions.length > 0) {
              responseText += `\n--- SUGGESTED FOLLOW-UPS ---\n`;
              data.suggestedQuestions.forEach((q: string) => {
                responseText += `* open-notebook ask "${q}"\n`;
              });
            }

            appendLine('output', responseText);
          } catch (err: any) {
            appendLine('error', `Failed to query Open Notebook: ${err?.message || 'Network error'}`);
          }

          setIsExecuting(false);
          return;
        }

        if (sub === 'add' || sub === 'ingest') {
          const title = args[1];
          const content = args.slice(2).join(' ');

          if (!title || !content) {
            appendLine('error', 'Usage: open-notebook add "<source title>" "<content or url>"');
            setIsExecuting(false);
            return;
          }

          const isUrl = /^https?:\/\//i.test(content);
          const ok = addSourceToNotebook(title, content, isUrl ? content : undefined);
          if (ok) {
            appendLine('success', `[SUCCESS] Source "${title}" ingested and indexed into Open Notebook active corpus.`);
            onShowToast(`Added "${title}" to Open Notebook`);
          } else {
            appendLine('error', 'Could not add source. Make sure a notebook exists.');
          }
          setIsExecuting(false);
          return;
        }

        if (sub === 'open' || sub === 'gui' || sub === 'launch') {
          appendLine('info', 'Opening Open Notebook workstation workspace...');
          onOpenApp('openNotebook');
          setIsExecuting(false);
          return;
        }

        if (sub === 'drawer' || sub === 'toggle') {
          appendLine('info', 'Toggling modular Open Notebook extension drawer...');
          onToggleDrawer();
          setIsExecuting(false);
          return;
        }

        if (sub === 'notes') {
          if (!nb || !nb.notes || nb.notes.length === 0) {
            appendLine('info', 'No notes found in active notebook.');
          } else {
            let out = `Notes in "${nb.title}":\n\n`;
            nb.notes.forEach((n, idx) => {
              out += `[${idx + 1}] ${n.title} (Updated: ${n.updatedAt})\n    ${n.content.slice(0, 100)}...\n\n`;
            });
            appendLine('output', out);
          }
          setIsExecuting(false);
          return;
        }

        appendLine('error', `Unknown open-notebook subcommand '${sub}'. Try: status, list, ask, add, open, drawer, notes`);
        setIsExecuting(false);
        return;
      }

      // ================= 3. CORE FILE & SYSTEM UTILITIES =================
      if (mainCommand === 'ls' || mainCommand === 'dir' || mainCommand === 'get-childitem') {
        const fileNames = Object.keys(files);
        if (shell === 'termux') {
          const list = [
            'storage/ (symlink)',
            'open-notebook-data/',
            ...fileNames.map(f => f.replace(/^\//, ''))
          ];
          appendLine('output', list.join('   '));
        } else if (shell === 'powershell') {
          let out = `    Directory: LeeWay:\\${activeAgentId}\n\nMode                 LastWriteTime         Length Name\n----                 -------------         ------ ----\n`;
          fileNames.forEach(f => {
            const len = files[f]?.length || 0;
            out += `-a---           2026-09-03   10:14          ${len.toString().padStart(6)} ${f}\n`;
          });
          appendLine('output', out);
        } else {
          appendLine('output', fileNames.join('  '));
        }
        setIsExecuting(false);
        return;
      }

      if (mainCommand === 'pwd') {
        if (shell === 'termux') appendLine('output', '/data/data/com.termux/files/home');
        else if (shell === 'powershell') appendLine('output', `LeeWay:\\${activeAgentId}`);
        else appendLine('output', `/home/${activeAgentId}`);
        setIsExecuting(false);
        return;
      }

      if (mainCommand === 'whoami') {
        if (shell === 'termux') appendLine('output', 'u0_a291');
        else appendLine('output', activeAgentId);
        setIsExecuting(false);
        return;
      }

      if (mainCommand === 'uname') {
        if (shell === 'termux') {
          appendLine('output', 'Linux localhost 5.15.137-android14-aarch64 #1 SMP PREEMPT aarch64 GNU/Linux');
        } else if (shell === 'powershell') {
          appendLine('output', 'MINGW64_NT-10.0-22631 3.4.9-341.x86_64 2024-05-15 12:00 UTC x86_64');
        } else {
          appendLine('output', 'Linux leeway-agent-workstation 6.8.0-31-generic #31-Ubuntu SMP PREEMPT_DYNAMIC x86_64 x86_64 x86_64 GNU/Linux');
        }
        setIsExecuting(false);
        return;
      }

      if (mainCommand === 'cat' || mainCommand === 'get-content') {
        const targetPath = args[0] || '';
        if (!targetPath) {
          appendLine('error', 'Usage: cat <filename>');
        } else {
          // Check normalized path
          const fullPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
          const content = files[targetPath] || files[fullPath];
          if (content !== undefined) {
            appendLine('output', content);
          } else {
            appendLine('error', `cat: ${targetPath}: No such file in virtual workspace`);
          }
        }
        setIsExecuting(false);
        return;
      }

      if (mainCommand === 'echo') {
        const text = args.join(' ');
        // Check for redirect `> <filename>`
        const matchRedirect = text.match(/(.*)\s*>\s*([^\s]+)$/);
        if (matchRedirect) {
          const contentToWrite = matchRedirect[1].replace(/^["']|["']$/g, '');
          const targetFilename = matchRedirect[2].trim();
          const fullPath = targetFilename.startsWith('/') ? targetFilename : `/${targetFilename}`;
          onSaveFile(fullPath, contentToWrite);
          appendLine('success', `Written to ${fullPath}`);
          onShowToast(`Created/updated ${fullPath}`);
        } else {
          appendLine('output', text);
        }
        setIsExecuting(false);
        return;
      }

      if (mainCommand === 'touch') {
        const fname = args[0] || '';
        if (!fname) {
          appendLine('error', 'Usage: touch <filename>');
        } else {
          const fullPath = fname.startsWith('/') ? fname : `/${fname}`;
          if (!files[fullPath]) {
            onSaveFile(fullPath, `// Created via ${shell} terminal\n`);
            appendLine('success', `Created empty file ${fullPath}`);
            onShowToast(`Created ${fullPath}`);
          } else {
            appendLine('output', `Updated timestamp on ${fullPath}`);
          }
        }
        setIsExecuting(false);
        return;
      }

      if (mainCommand === 'git') {
        const sub = (args[0] || '').toLowerCase();
        if (sub === 'status') {
          appendLine('output', `On branch main\nYour branch is up to date with 'origin/main'.\n\nChanges to be committed:\n  modified:   /src/open-notebook-extension.ts\n  modified:   /src/App.tsx\n\nVirtual workspace clean.`);
        } else if (sub === 'clone') {
          const repo = args[1] || 'https://github.com/lfnovo/open-notebook.git';
          appendLine('output', `Cloning into 'open-notebook'...\nremote: Enumerating objects: 1240, done.\nremote: Counting objects: 100% (1240/1240), done.\nremote: Compressing objects: 100% (780/780), done.\nReceiving objects: 100% (1240/1240), 14.82 MiB | 9.40 MiB/s, done.\nResolving deltas: 100% (450/450), done.`);
          // Ingest repository reference into Open Notebook
          addSourceToNotebook('Git: lfnovo/open-notebook', `Cloned repository from ${repo}.\nOpen Notebook: Open source NotebookLM alternative with multi-source grounding, audio overviews, and modular agent integration.`, repo);
          appendLine('success', `[SUCCESS] Cloned and auto-indexed '${repo}' into Open Notebook!`);
          onShowToast('Cloned & indexed open-notebook');
        } else {
          appendLine('output', `git version 2.44.0\nCommands: git status, git clone <url>`);
        }
        setIsExecuting(false);
        return;
      }

      if (mainCommand === 'python' || mainCommand === 'python3') {
        if (args.includes('-v') || args.includes('--version')) {
          appendLine('output', 'Python 3.12.3 (main, Apr 10 2026, 08:00:00) [GCC 13.2.0] on linux');
        } else if (args[0] === '-c') {
          const code = args.slice(1).join(' ');
          appendLine('output', `[Python 3.12 executed]: Evaluated code block in sandbox.`);
        } else {
          appendLine('output', `Python 3.12.3 (CPython)\n[GCC 13.2.0 on linux]\nType "help", "copyright", "credits" or "license" for more information.\n>>> Use 'python -c "<code>"' or run scripts from LeeCode workspace.`);
        }
        setIsExecuting(false);
        return;
      }

      if (mainCommand === 'node') {
        if (args.includes('-v') || args.includes('--version')) {
          appendLine('output', 'v20.14.0');
        } else {
          appendLine('output', `Node.js v20.14.0\nWelcome to Node.js virtual REPL.`);
        }
        setIsExecuting(false);
        return;
      }

      if (mainCommand === 'status') {
        appendLine('output', `HARDWARE TELEMETRY:\nCPU: ${telemetry.cpu}% | RAM: ${telemetry.ram}% | DISK: ${telemetry.disk}% | TEMP: ${telemetry.temp}°C\nPALLIUM NODES: ${syncedNodes}/5 Synchronized\nACTIVE AGENT: ${activeAgentId}\nENVIRONMENT: ${shell.toUpperCase()}`);
        setIsExecuting(false);
        return;
      }

      if (mainCommand === 'date') {
        appendLine('output', new Date().toString());
        setIsExecuting(false);
        return;
      }

      if (mainCommand === 'history') {
        appendLine('output', history.map((h, i) => `  ${(i + 1).toString().padStart(3)}  ${h}`).join('\n'));
        setIsExecuting(false);
        return;
      }

      // Unmapped commands are not execution.
      appendLine('error', `${shell}: command is not mapped to an authorized runtime adapter: ${cmd}`);
      setIsExecuting(false);
    } catch (err: any) {
      appendLine('error', `Execution error: ${err?.message || 'Unknown fault'}`);
      setIsExecuting(false);
    }
  };

  const appendLine = (type: TermLine['type'], text: string) => {
    setLines(prev => [
      ...prev,
      {
        id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }
    ]);
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Keyboard navigation for history (Up/Down) and Tab auto-complete
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex < history.length) {
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = historyIndex - 1;
      if (nextIndex >= 0) {
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex]);
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Auto-complete candidates
      const candidates = [
        'open-notebook status',
        'open-notebook list',
        'open-notebook ask "',
        'open-notebook add "',
        'open-notebook open',
        'open-notebook drawer',
        'pkg install ',
        'pkg search ',
        'pkg list-installed',
        'pkg update',
        'termux-info',
        'termux-battery-status',
        'termux-setup-storage',
        'termux-open-url ',
        'termux-toast "',
        'git status',
        'git clone https://github.com/lfnovo/open-notebook.git',
        'cat /src/App.tsx',
        'cat /README.md',
        'ls -la',
        'clear',
        'help'
      ];
      const match = candidates.find(c => c.startsWith(input.trim()));
      if (match) {
        setInput(match);
      }
    }
  };

  // Copy terminal contents to clipboard
  const handleCopyBuffer = () => {
    const text = lines.map(l => l.text).join('\n');
    navigator.clipboard.writeText(text);
    onShowToast('Copied terminal output to clipboard');
  };

  // Termux Extra Keys Bar Buttons
  const insertKey = (key: string) => {
    if (key === 'CLEAR') {
      setLines([]);
    } else if (key === 'TAB') {
      const e = { preventDefault: () => {}, key: 'Tab' } as any;
      handleKeyDown(e);
    } else if (key === 'UP') {
      const e = { preventDefault: () => {}, key: 'ArrowUp' } as any;
      handleKeyDown(e);
    } else if (key === 'DOWN') {
      const e = { preventDefault: () => {}, key: 'ArrowDown' } as any;
      handleKeyDown(e);
    } else if (key === 'PKG') {
      setInput('pkg install open-notebook');
      inputRef.current?.focus();
    } else if (key === 'NOTEBOOK') {
      setInput('open-notebook status');
      inputRef.current?.focus();
    } else {
      setInput(prev => prev + key);
      inputRef.current?.focus();
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-[10px] leading-relaxed';
      case 'large': return 'text-[13px] leading-relaxed';
      default: return 'text-[11.5px] leading-relaxed';
    }
  };

  return (
    <div className="flex-grow flex flex-col h-full w-full bg-[#0c0d11] text-[#22c55e] font-mono overflow-hidden select-text relative">
      {/* Top Controls & Environment Switcher */}
      <div className="h-9 bg-[#12141a] border-b border-stone-800 px-3 flex items-center justify-between shrink-0 select-none text-xs">
        <div className="flex items-center gap-2">
          {shell === 'termux' ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 font-bold text-[10px]">
              <Smartphone size={12} className="text-emerald-400" />
              <span>TERMUX • ANDROID/LINUX</span>
            </div>
          ) : shell === 'ubuntu' ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-orange-950/80 border border-orange-600/60 text-orange-300 font-bold text-[10px]">
              <Server size={12} className="text-orange-400" />
              <span>UBUNTU 24.04 LTS</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-950/80 border border-blue-600/60 text-blue-300 font-bold text-[10px]">
              <Code2 size={12} className="text-blue-400" />
              <span>POWERSHELL 7.4</span>
            </div>
          )}

          <span className="text-stone-500 text-[10px] hidden sm:inline">•</span>
          <span className="text-stone-400 text-[10px] hidden md:inline">Agent: {activeAgentId}</span>
        </div>

        {/* Quick Open Notebook status pill in terminal */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleCommand('open-notebook status')}
            className="px-2 py-0.5 bg-orange-950/80 hover:bg-orange-900 border border-orange-700/60 rounded text-[9.5px] font-bold text-orange-300 flex items-center gap-1"
            title="Query Open Notebook engine status"
          >
            <BookOpen size={10} />
            <span className="hidden sm:inline">Open Notebook:</span>
            <span className="text-emerald-400">Online</span>
          </button>

          {/* Shell Selector Dropdown */}
          <div className="flex items-center gap-1 bg-black/60 border border-stone-700 rounded px-1.5 py-0.5">
            <span className="text-[9px] text-stone-400 font-bold">SHELL:</span>
            <select
              value={shell}
              onChange={e => handleShellChange(e.target.value as TerminalShellType)}
              className="bg-transparent text-white text-[10px] font-bold outline-none cursor-pointer"
            >
              <option value="termux" className="bg-stone-900 text-emerald-400">Termux (Android/Linux)</option>
              <option value="ubuntu" className="bg-stone-900 text-orange-400">Ubuntu Bash</option>
              <option value="powershell" className="bg-stone-900 text-blue-400">PowerShell</option>
            </select>
          </div>

          {/* Buffer Actions */}
          <button
            onClick={handleCopyBuffer}
            title="Copy entire buffer to clipboard"
            className="p-1 hover:bg-stone-800 text-stone-400 hover:text-white rounded"
          >
            <Copy size={12} />
          </button>
          <button
            onClick={() => setLines([])}
            title="Clear terminal screen (clear)"
            className="p-1 hover:bg-stone-800 text-stone-400 hover:text-white rounded"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Suggested Quick Command Chips Bar */}
      <div className="h-7 bg-[#0f1016] border-b border-stone-800/80 px-2.5 flex items-center gap-1.5 overflow-x-auto text-[9.5px] select-none shrink-0">
        <span className="text-stone-500 font-bold uppercase text-[8px] mr-1 shrink-0">QUICK CMDS:</span>
        {[
          { label: 'open-notebook status', cmd: 'open-notebook status' },
          { label: 'open-notebook ask "summarize sources"', cmd: 'open-notebook ask "summarize all sources and core insights"' },
          { label: 'open-notebook list', cmd: 'open-notebook list' },
          ...(shell === 'termux'
            ? [
                { label: 'pkg install open-notebook', cmd: 'pkg install open-notebook' },
                { label: 'termux-info', cmd: 'termux-info' },
                { label: 'termux-battery-status', cmd: 'termux-battery-status' },
                { label: 'termux-toast "Agent Lee ready"', cmd: 'termux-toast "Agent Lee ready"' }
              ]
            : [
                { label: 'uname -a', cmd: 'uname -a' },
                { label: 'ls -la', cmd: 'ls -la' },
                { label: 'cat /src/App.tsx', cmd: 'cat /src/App.tsx' }
              ])
        ].map((item, i) => (
          <button
            key={i}
            onClick={() => {
              setInput(item.cmd);
              inputRef.current?.focus();
            }}
            className="px-2 py-0.5 bg-stone-900 hover:bg-stone-800 border border-stone-700/80 text-stone-300 hover:text-white rounded whitespace-nowrap"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Terminal Main Output Canvas */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={`flex-grow overflow-y-auto p-4 space-y-1.5 ${getFontSizeClass()} ${
          shell === 'termux' ? 'bg-[#08090c]' : shell === 'powershell' ? 'bg-[#012456]/90 text-white' : 'bg-[#0c0d11]'
        }`}
      >
        {lines.map(line => {
          if (line.type === 'banner') {
            return (
              <div
                key={line.id}
                className="whitespace-pre-wrap font-mono p-3 rounded-lg border leading-relaxed bg-black/40 text-stone-300 border-stone-800 text-[11px]"
              >
                {line.text}
              </div>
            );
          }

          if (line.type === 'prompt') {
            return (
              <div key={line.id} className="pt-2 font-bold flex items-start gap-1 text-white">
                <span className="text-emerald-400 shrink-0 select-none">
                  {shell === 'termux' ? '❯' : shell === 'powershell' ? 'PS>' : '$'}
                </span>
                <span className="break-all">{line.text}</span>
              </div>
            );
          }

          if (line.type === 'error') {
            return (
              <div key={line.id} className="text-rose-400 whitespace-pre-wrap pl-3 border-l-2 border-rose-600">
                {line.text}
              </div>
            );
          }

          if (line.type === 'success') {
            return (
              <div key={line.id} className="text-emerald-400 whitespace-pre-wrap pl-3 border-l-2 border-emerald-500 font-semibold">
                {line.text}
              </div>
            );
          }

          if (line.type === 'info') {
            return (
              <div key={line.id} className="text-cyan-400 whitespace-pre-wrap leading-relaxed">
                {line.text}
              </div>
            );
          }

          return (
            <div key={line.id} className="text-stone-300 whitespace-pre-wrap break-words leading-relaxed">
              {line.text}
            </div>
          );
        })}

        {isExecuting && (
          <div className="flex items-center gap-2 text-orange-400 animate-pulse pt-1 text-xs">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
            <span>Executing command and grounding with Open Notebook...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Termux Authentic Mobile Extra-Keys Row (Essential Termux staple) */}
      {shell === 'termux' && (
        <div className="bg-[#14161f] border-t border-stone-800 px-2 py-1 flex items-center justify-between text-[10px] select-none shrink-0 overflow-x-auto gap-1">
          <div className="flex items-center gap-1 font-bold text-stone-300">
            {['ESC', 'TAB', 'CTRL', 'ALT', '~', '/', '-', '|', 'UP', 'DOWN'].map((k) => (
              <button
                key={k}
                onClick={() => insertKey(k)}
                className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 active:bg-emerald-800 border border-stone-700 rounded text-stone-200 text-[9.5px] font-mono"
              >
                {k}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => insertKey('PKG')}
              className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/80 rounded text-emerald-300 text-[9px] font-bold"
            >
              PKG
            </button>
            <button
              onClick={() => insertKey('NOTEBOOK')}
              className="px-2 py-0.5 bg-orange-950 hover:bg-orange-900 border border-orange-700/80 rounded text-orange-300 text-[9px] font-bold"
            >
              NOTEBOOK
            </button>
            <button
              onClick={() => insertKey('CLEAR')}
              className="px-1.5 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded text-[9px]"
            >
              CLS
            </button>
          </div>
        </div>
      )}

      {/* Terminal Input Line */}
      <div className="h-10 bg-black border-t border-stone-800 px-3 flex items-center gap-2 shrink-0 z-10">
        <span className="text-emerald-400 font-bold shrink-0 text-xs select-none">
          {getPromptPrefix(shell, activeAgentId)}
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isExecuting}
          placeholder={shell === 'termux' ? "Try 'pkg install open-notebook' or 'open-notebook status'..." : "Type 'help' or 'open-notebook status'..."}
          className="flex-grow bg-transparent text-white outline-none font-mono text-xs placeholder:text-stone-600"
          autoFocus
          spellCheck="false"
        />
        <button
          onClick={() => handleCommand(input)}
          disabled={!input.trim() || isExecuting}
          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-30 text-white rounded text-[10px] font-bold flex items-center gap-1"
        >
          <span>SEND</span>
          <CornerDownLeft size={11} />
        </button>
      </div>
    </div>
  );
};
