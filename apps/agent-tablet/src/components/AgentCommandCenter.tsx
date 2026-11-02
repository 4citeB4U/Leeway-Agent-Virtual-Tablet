import React, { useCallback, useEffect, useState } from 'react';
import { Activity, ArrowRight, BookOpen, CircleDashed, FileText, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import type { WorkstationAppId } from '../types';

type Props = {
  workboardStatus: string;
  onOpenSurface: (surface: WorkstationAppId) => void;
};

type ProviderObservation = {
  id: string;
  provider: string;
  agent: string;
  state: string;
  evidenceState: string;
  execution: string;
  configured?: boolean;
};

type RosterSnapshot = {
  state: string;
  fetchedAt: string;
  clients: ProviderObservation[];
};

const EMPTY_ROSTER: RosterSnapshot = { state: 'NOT_READ', fetchedAt: '', clients: [] };

export function AgentCommandCenter({ workboardStatus, onOpenSurface }: Props) {
  const [roster, setRoster] = useState(EMPTY_ROSTER);
  const [rosterError, setRosterError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const refreshRoster = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/agent-roster', { cache: 'no-store', signal });
      if (!response.ok) throw new Error(`Provider observation failed (HTTP ${response.status}).`);
      const next = await response.json() as RosterSnapshot;
      setRoster({
        state: typeof next.state === 'string' ? next.state : 'UNVERIFIED',
        fetchedAt: typeof next.fetchedAt === 'string' ? next.fetchedAt : '',
        clients: Array.isArray(next.clients) ? next.clients : [],
      });
      setRosterError('');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setRoster(EMPTY_ROSTER);
      setRosterError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refreshRoster(controller.signal);
    const intervalId = window.setInterval(() => { void refreshRoster(); }, 15_000);
    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [refreshRoster]);

  const configuredCount = roster.clients.filter(client => client.configured).length;
  return (
    <div className="flex-grow overflow-y-auto bg-[#06111e] text-zinc-100">
      <div className="mx-auto max-w-[1500px] space-y-4 p-4 md:p-6">
        <header className="rounded-2xl border border-cyan-800/80 bg-gradient-to-br from-[#12324a] via-[#0b1b2c] to-[#07121e] p-5 shadow-[0_0_32px_rgba(14,165,233,0.16)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-700 text-2xl font-black shadow-[0_0_22px_rgba(34,211,238,0.45)]">LW</div><div><div className="text-[10px] font-black tracking-[0.24em] text-cyan-300">LEEWAY AGENT TABLET</div><h1 className="mt-1 text-3xl font-black tracking-tight">LeeWay Home</h1><p className="text-sm text-zinc-400">Digital Workforce Command Center</p></div></div>
            <div className="text-right text-[10px]"><div className="text-zinc-400">Creator: <strong className="text-white">Leona Lee</strong></div><div className="mt-1 text-emerald-300">System: Runtime observation active</div></div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-xl border border-cyan-700/70 bg-cyan-950/40 p-3"><div className="text-[9px] uppercase text-cyan-300">Observed agents</div><div className="mt-1 text-2xl font-black">{roster.clients.length || '—'}</div></div><div className="rounded-xl border border-blue-700/70 bg-blue-950/40 p-3"><div className="text-[9px] uppercase text-blue-300">Configured clients</div><div className="mt-1 text-2xl font-black">{roster.clients.length ? configuredCount : '—'}</div></div><div className="rounded-xl border border-emerald-700/70 bg-emerald-950/40 p-3"><div className="text-[9px] uppercase text-emerald-300">Workboard</div><div className="mt-1 text-sm font-black">{workboardStatus}</div></div><div className="rounded-xl border border-violet-700/70 bg-violet-950/40 p-3"><div className="text-[9px] uppercase text-violet-300">Evidence state</div><div className="mt-1 text-sm font-black">{roster.state}</div></div></div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
          <aside className="rounded-2xl border border-cyan-900/70 bg-[#0b1c2d] p-4"><div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">Active Agent</div><div className="mt-4 flex items-center gap-3"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-800 text-2xl">🧠</div><div><div className="text-lg font-black text-white">Agent Lee</div><div className="text-[10px] text-zinc-400">PRIME · Program Lead</div><div className="mt-1 text-[10px] text-emerald-300">● Runtime identity separately verified</div></div></div><div className="mt-5 rounded-xl border border-cyan-900 bg-cyan-950/30 p-3 text-xs leading-relaxed text-zinc-300">Home is the entry point. Select Workforce to inspect positions, Blackboard to review communication, or Preview to present work.</div></aside>
          <section className="rounded-2xl border border-zinc-800 bg-[#0b1725] p-4"><div className="flex items-center justify-between"><h2 className="text-sm font-black">System Status</h2><button type="button" onClick={() => void refreshRoster()} disabled={isLoading} className="rounded border border-cyan-700 bg-cyan-950/50 px-3 py-1.5 text-[10px] font-bold text-cyan-200"><RefreshCw size={12} className={`mr-1 inline ${isLoading ? 'animate-spin' : ''}`} />REFRESH</button></div><div className="mt-4 space-y-3 text-xs"><div className="flex items-center justify-between border-b border-zinc-800 pb-2"><span>Runtime Fabric</span><span className="text-emerald-300">● {roster.state}</span></div><div className="flex items-center justify-between border-b border-zinc-800 pb-2"><span>Workboard service</span><span className="text-amber-300">● {workboardStatus}</span></div><div className="flex items-center justify-between border-b border-zinc-800 pb-2"><span>Provider observations</span><span className="text-cyan-300">● {roster.clients.length ? 'Available' : 'Not observed'}</span></div><div className="flex items-center justify-between"><span>Receipt / execution</span><span className="text-zinc-400">Not inferred</span></div></div></section>
          <section className="rounded-2xl border border-zinc-800 bg-[#0b1725] p-4"><h2 className="text-sm font-black">Recent Activity</h2><div className="mt-4 space-y-3">{roster.clients.length ? roster.clients.slice(0, 6).map(client => <div key={client.id} className="flex items-start gap-2 border-b border-zinc-800 pb-2 text-[10px]"><Activity size={13} className="mt-0.5 text-cyan-300" /><div><div className="font-bold text-zinc-200">{client.agent}</div><div className="text-zinc-500">{client.provider} · {client.state} · {client.execution}</div></div></div>) : <div className="text-xs text-zinc-500">No provider activity has been observed.</div>}</div></section>
        </div>

        {rosterError && <p role="alert" className="rounded border border-amber-800 bg-amber-950/30 p-3 text-xs text-amber-300">{rosterError}</p>}
        <section className="grid gap-3 md:grid-cols-3"><button type="button" onClick={() => onOpenSurface('workforce')} className="rounded-xl border border-cyan-800/60 bg-cyan-950/20 p-4 text-left hover:border-cyan-500"><Users size={18} className="text-cyan-300" /><div className="mt-3 text-xs font-black">OPEN WORKFORCE</div><div className="mt-1 text-[10px] text-zinc-400">Inspect the active roster and assignments.</div></button><button type="button" onClick={() => onOpenSurface('editor')} className="rounded-xl border border-emerald-800/60 bg-emerald-950/20 p-4 text-left hover:border-emerald-500"><FileText size={18} className="text-emerald-300" /><div className="mt-3 text-xs font-black">PREVIEW WORK</div><div className="mt-1 text-[10px] text-zinc-400">Open the existing composition preview.</div></button><button type="button" onClick={() => onOpenSurface('openNotebook')} className="rounded-xl border border-violet-800/60 bg-violet-950/20 p-4 text-left hover:border-violet-500"><BookOpen size={18} className="text-violet-300" /><div className="mt-3 text-xs font-black">CONTINUUM / EVIDENCE</div><div className="mt-1 text-[10px] text-zinc-400">Review grounded sources and continuity records.</div></button></section>
      </div>
    </div>
  );
}

export default AgentCommandCenter;
