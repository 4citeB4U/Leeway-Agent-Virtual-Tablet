import React, { useState, useEffect } from 'react';
import {
  Github,
  Check,
  AlertCircle,
  ExternalLink,
  Download,
  Copy,
  Terminal,
  Lock,
  Globe,
  Loader2,
  X,
  RefreshCw,
  FolderGit2
} from 'lucide-react';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({ isOpen, onClose, showToast }) => {
  const [username, setUsername] = useState(() => localStorage.getItem('leeway_gh_username') || '');
  const [token, setToken] = useState(() => localStorage.getItem('leeway_gh_token') || '');
  const [repoName, setRepoName] = useState(() => localStorage.getItem('leeway_gh_reponame') || 'LeeWay-Agent-Workstation-Open-Notebook');
  const [isPrivate, setIsPrivate] = useState(false);
  const [commitMessage, setCommitMessage] = useState('Initial commit: LeeWay Agent Workstation & Open Notebook');
  const [showToken, setShowToken] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [statusLogs, setStatusLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

  const [gitStatus, setGitStatus] = useState<{
    branch: string;
    lastCommit: string;
    dirty: boolean;
    changedFiles: string[];
  } | null>(null);

  // Fetch local git status
  const fetchGitStatus = async () => {
    try {
      const res = await fetch('/api/github/status');
      if (res.ok) {
        const data = await res.json();
        setGitStatus(data);
      }
    } catch (_err) {}
  };

  useEffect(() => {
    if (isOpen) {
      fetchGitStatus();
      setError(null);
      setSuccessUrl(null);
    }
  }, [isOpen]);

  const handlePush = async () => {
    if (!username.trim()) {
      setError('Please provide your GitHub username.');
      return;
    }
    if (!token.trim()) {
      setError('Please provide a GitHub Personal Access Token (classic with repo scope or fine-grained).');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessUrl(null);
    setStatusLogs(['Initiating GitHub push pipeline...']);

    // Save preferences
    try {
      localStorage.setItem('leeway_gh_username', username.trim());
      localStorage.setItem('leeway_gh_reponame', repoName.trim());
      localStorage.setItem('leeway_gh_token', token.trim());
    } catch (_e) {}

    try {
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          username: username.trim(),
          repoName: repoName.trim(),
          isPrivate,
          commitMessage: commitMessage.trim()
        })
      });

      const data = await res.json();

      if (data.logs && Array.isArray(data.logs)) {
        setStatusLogs(data.logs);
      }

      if (!res.ok || data.status !== 'ok') {
        throw new Error(data.message || 'Push failed with unspecified error');
      }

      setSuccessUrl(data.repoUrl);
      showToast('Successfully pushed repository to GitHub!');
      fetchGitStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to push to GitHub');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCommands = () => {
    const targetUrl = `https://github.com/${username || '<YOUR_USERNAME>'}/${repoName}.git`;
    const script = `# CLI Push Instructions:
git init -b main
git add -A
git commit -m "${commitMessage}"
git remote add origin ${targetUrl}
git push -u origin main`;
    navigator.clipboard.writeText(script);
    showToast('Copied Git CLI commands to clipboard');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#121318] border border-zinc-700 w-full max-w-2xl rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-200 font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1a1b23] border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-zinc-800 rounded text-white">
              <Github size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Push to GitHub
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                  LeeWay Standards
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Push &quot;LeeWay Agent Workstation &amp; Open Notebook&quot; directly to your GitHub account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Target Repository Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                GitHub Username / Organization <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. agentlee2912 or octocat"
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Repository Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={repoName}
                onChange={e => setRepoName(e.target.value)}
                placeholder="LeeWay-Agent-Workstation-Open-Notebook"
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono font-bold"
              />
            </div>
          </div>

          {/* GitHub Personal Access Token */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-zinc-300 font-medium flex items-center gap-1.5">
                <Lock size={12} className="text-amber-400" />
                Personal Access Token (PAT) <span className="text-rose-400">*</span>
              </label>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=LeeWay+Agent+Workstation"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5"
              >
                Create token on GitHub (repo scope) <ExternalLink size={10} />
              </a>
            </div>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="Paste an authorized GitHub token for this session"
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono pr-16"
              />
              <button
                type="button"
                onClick={() => setShowToken(prev => !prev)}
                className="absolute right-2 top-1.5 text-[10px] text-zinc-400 hover:text-zinc-200 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700"
              >
                {showToken ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">
              Credentials are only used to authenticate the push transaction and are never persisted in plain git configuration.
            </p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Commit Message</label>
              <input
                type="text"
                value={commitMessage}
                onChange={e => setCommitMessage(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={e => setIsPrivate(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-0"
                />
                <span className="text-zinc-300 text-xs">Create as Private Repository</span>
              </label>
            </div>
          </div>

          {/* Success Banner */}
          {successUrl && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-600 rounded-md text-emerald-200 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-emerald-300">
                  <Check size={16} className="text-emerald-400" />
                  Repository successfully pushed to GitHub!
                </div>
                <a
                  href={successUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold text-[11px] flex items-center gap-1.5 transition-colors"
                >
                  View on GitHub <ExternalLink size={12} />
                </a>
              </div>
              <p className="text-[11px] text-emerald-300/80 font-mono break-all">
                {successUrl}
              </p>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-rose-950/70 border border-rose-600 rounded-md text-rose-200 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs text-rose-300">
                <AlertCircle size={15} />
                Push Failed
              </div>
              <p className="text-[11px] text-rose-300/90">{error}</p>
            </div>
          )}

          {/* Live Pipeline Logs */}
          {statusLogs.length > 0 && (
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider mb-1 flex items-center gap-1.5">
                <Terminal size={11} />
                Pipeline Output
              </div>
              <div className="bg-black/90 border border-zinc-800 rounded p-2.5 font-mono text-[10.5px] text-emerald-400/90 max-h-36 overflow-y-auto space-y-0.5">
                {statusLogs.map((log, i) => (
                  <div key={i} className="leading-relaxed">{log}</div>
                ))}
              </div>
            </div>
          )}

          {/* Secondary Actions / Manual CLI instructions */}
          <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyCommands}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded flex items-center gap-1.5 transition-colors"
                title="Copy standard git push commands for Termux or local bash"
              >
                <Copy size={12} />
                Copy Terminal Commands
              </button>

              <a
                href="/api/download/repo-archive"
                download="leeway_agent_workstation_source.tar.gz"
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded flex items-center gap-1.5 transition-colors"
                title="Download full project source code as .tar.gz archive"
              >
                <Download size={12} />
                Download Repo Archive (.tar.gz)
              </a>
            </div>

            {gitStatus && (
              <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-2">
                <FolderGit2 size={11} />
                <span>Branch: {gitStatus.branch}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#16171f] border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handlePush}
            disabled={isLoading}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Pushing to GitHub...
              </>
            ) : (
              <>
                <Github size={13} />
                Push to GitHub Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
