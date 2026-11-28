/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.UPDATE_CENTER
TAG: LEEWAY.TABLET.GITHUB_UPDATE_FLAGS.V1
WHAT: Show GitHub version flags for the tablet and every installed application and route update requests through the native host.
WHY: An update on GitHub must signal every tablet and be actionable per application or system-wide.
WHO: LeeWay Industries / creator-authorized outside contributor (LW-OPENCODE).
WHERE: apps/agent-tablet/src/components/UpdateCenter.tsx
WHEN: 2026-11-27
HOW: Public GitHub commit API reads and existing native update IPC; no new authority or deployment plane.
AUTHORITY: LOCAL_OPERATIONS_ONLY. No production deployment, Veritas or receipt claim.
LICENSE: Existing repository terms.
*/
import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, RefreshCw, ShieldAlert, AlertTriangle } from 'lucide-react';
import { APP_UPDATE_BINDINGS, checkGithubUpdates, type AppUpdateCheck } from '../appUpdates';

type Row = AppUpdateCheck;

export function UpdateCenter({ onClose, onNotice }: { onClose: () => void; onNotice: (message: string) => void }) {
  const [rows, setRows] = useState<Row[]>(() => APP_UPDATE_BINDINGS.map(binding => ({ ...binding, latestCommit: null, state: 'CHECKING' })));
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setRows(APP_UPDATE_BINDINGS.map(binding => ({ ...binding, latestCommit: null, state: 'CHECKING' })));
    setRows(await checkGithubUpdates());
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const runUpdate = async (row: Row) => {
    setBusy(true);
    try {
      if (row.kind === 'TABLET') {
        const result = await window.leewayNative?.runTabletUpdate?.();
        onNotice(result?.state === 'UPDATE_COMPLETED' ? `Tablet update complete: ${result.status?.state || 'OK'}` : `Tablet update failed: ${result?.status?.reason || result?.state || 'NO_NATIVE_BRIDGE'}`);
      } else {
        const result = await window.leewayNative?.runAppUpdate?.(row.appId);
        onNotice(result?.state === 'UPDATE_REQUESTED' ? `${row.label}: update request sent to local host.` : `${row.label}: ${result?.reason || result?.state || 'NO_NATIVE_BRIDGE'}`);
      }
      await refresh();
    } finally { setBusy(false); }
  };

  const available = rows.filter(row => row.state === 'UPDATE_AVAILABLE').length;

  return (
    <section className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-[#050a10] text-zinc-100" aria-label="Update Center">
      <header className="flex shrink-0 items-center gap-3 border-b border-cyan-300/20 bg-[#07131c] px-4 py-3">
        <button type="button" onClick={onClose} className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-cyan-300/40 bg-[#0077ff] text-white hover:bg-[#2a95ff]" aria-label="Close Update Center"><ArrowLeft size={18} /></button>
        <RefreshCw size={18} className="text-cyan-300" />
        <div className="min-w-0 flex-1"><div className="text-sm font-black text-cyan-100">Update Center</div><div className="text-[10px] text-zinc-400">GitHub version flags for the tablet and every installed application</div></div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${available ? 'border-amber-300/50 bg-amber-950/40 text-amber-100' : 'border-emerald-300/40 bg-emerald-950/30 text-emerald-200'}`}>{available ? `${available} UPDATE${available > 1 ? 'S' : ''} AVAILABLE` : 'ALL CURRENT'}</span>
        <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ff9aa3] bg-[#dc2626] text-lg font-black text-white">×</button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8">
        <div className="mx-auto max-w-5xl space-y-3">
          <div className="rounded-2xl border border-cyan-300/20 bg-[#07121b] p-4 text-xs leading-relaxed text-zinc-300">
            Each row compares the installed commit with the canonical GitHub <span className="font-mono text-cyan-200">main</span> commit. A flag means GitHub has a newer version. Whole-system updates and per-application updates are separate actions. No update is applied until you click it and the local host confirms.
          </div>
          {rows.map(row => (
            <div key={row.appId} className="rounded-xl border border-white/10 bg-[#070d14] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-black text-white">{row.label}</div>
                  <div className="font-mono text-[10px] text-zinc-500">{row.owner}/{row.repo} · {row.kind}</div>
                  <div className="mt-1 font-mono text-[10px] text-zinc-400">installed: {row.installedCommit?.slice(0, 12) || 'NOT_RECORDED'} · latest: {row.latestCommit?.slice(0, 12) || 'UNKNOWN'}</div>
                  {row.detail && <div className="mt-1 text-[10px] text-amber-300">{row.detail}</div>}
                </div>
                <div className="flex items-center gap-2">
                  {row.state === 'CURRENT' && <span className="flex items-center gap-1 rounded-full border border-emerald-300/40 px-3 py-1 text-[10px] font-black text-emerald-200"><CheckCircle2 size={12} />CURRENT</span>}
                  {row.state === 'UPDATE_AVAILABLE' && <span className="flex items-center gap-1 rounded-full border border-amber-300/50 px-3 py-1 text-[10px] font-black text-amber-100"><AlertTriangle size={12} />UPDATE FLAG</span>}
                  {row.state === 'CHECKING' && <span className="text-[10px] text-cyan-300">CHECKING…</span>}
                  {row.state === 'ERROR' && <span className="flex items-center gap-1 text-[10px] text-rose-300"><ShieldAlert size={12} />CHECK FAILED</span>}
                  <button type="button" disabled={busy || row.state === 'CHECKING'}
                    onClick={() => void runUpdate(row)}
                    className="rounded-lg border border-[#66c6ff] bg-[#0077ff] px-3 py-2 text-[10px] font-black text-white hover:bg-[#2a95ff] disabled:opacity-40">
                    {row.kind === 'TABLET' ? 'UPDATE SYSTEM' : 'UPDATE APP'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-[11px] leading-relaxed text-zinc-400">
            Every installed application's About & User Guide includes this update path. GitHub changes signal the tablet on the next Update Center check; the local host routes the request to the canonical package mechanism. No third-party application creates its own updater.
          </div>
        </div>
      </div>
    </section>
  );
}
