import React from 'react';
import type { WorkstationAppId } from '../types';
import { PUBLISHED_LEEWAY_APPS } from '../publishedApps';
import { tabletAssetUrl } from '../assetUrl';

type Destination = 'continuum' | 'preview' | 'apps';

interface TabletDestinationProps {
  destination: Destination;
  onOpen: (surface: WorkstationAppId) => void;
}

const copy: Record<Destination, { title: string; subtitle: string; body: string }> = {
  continuum: {
    title: 'Continuum',
    subtitle: 'Memory, continuity, and synchronization evidence',
    body: 'This is the single continuity destination. Existing notebook and memory tools remain available here as internal surfaces; no separate Pallium authority is presented.'
  },
  preview: {
    title: 'Preview',
    subtitle: 'Present work to the Creator',
    body: 'Use Preview to review an artifact, site, report, image, or other output before it is treated as finished. A preview is not a deployment or a receipt.'
  },
  apps: {
    title: 'Apps / Developments',
    subtitle: 'Employee tool entitlements and development surfaces',
    body: 'Tools are opened from this workspace according to the selected worker and its approved package. This page does not imply universal access.'
  }
};

export function TabletDestination({ destination, onOpen }: TabletDestinationProps) {
  const view = copy[destination];
  const appDirectory: Array<{ title: string; detail: string; target?: WorkstationAppId; state: string }> = [
    { title: 'Agent Lee / Machine Consciousness', detail: 'Presence, conversation, voice-carrier evidence, orchestration, and agent roster.', target: 'agentRoster', state: 'RUNTIME OBSERVATION' },
    { title: 'Workforce Center', detail: 'Workers, coordination, onboarding, assignments, and Creator approvals.', target: 'workforce', state: 'AUTHORITY-BOUND' },
    { title: 'Blackboard', detail: 'Shared intake, workboard, notepad, and agent communication workspace.', target: 'notepad', state: 'LOCAL + CONTINUUM' },
    { title: 'Continuum', detail: 'Memory, storage, grounded sources, and synchronization evidence.', target: 'continuum', state: 'EVIDENCE VIEW' },
    { title: 'Diagnostics', detail: 'Host health, Digital Brain observations, and qualified controls.', target: 'diagnostics', state: 'LIVE WHEN BOUND' },
    { title: 'Office Suite', detail: 'Documents, composition, notebook, and productivity tools.', target: 'officeSuite', state: 'CANONICAL UI' },
    { title: 'CRM & ERP', detail: 'The published sovereign Agentic CRM/ERP package inside the tablet shell.', target: 'erpCrm', state: 'CANONICAL UI' },
    { title: 'IDE / Development', detail: 'LeeWay orchestration workspace, development canvas, and terminal planning.', target: 'leewayIde', state: 'CANONICAL UI' },
    { title: 'Device Bridge', detail: 'Registered devices, declared capabilities, and authorized device operations. Enrollment status is not exposed by this tablet server yet.', state: 'STATUS UNAVAILABLE' },
    { title: 'LeeWay Applications', detail: 'Model Hub, Formula, GPU/VRAM, Agent Skills, Voice Fabric, Vision Fabric, Edge RTC, and ecosystem services. No duplicate authority is created here.', target: 'agentRoster', state: 'SERVICE DIRECTORY' }
  ];
  const platforms = [
    ['Windows', 'Current native host and preserved Floating Widget implementation'],
    ['Linux', 'Linux and Ubuntu capabilities remain under this platform'],
    ['Apple', 'Apple native implementation remains a platform-owned application'],
    ['Android', 'Android application and Termux capabilities remain under this platform']
  ] as const;
  return (
    <section className="flex-grow overflow-auto bg-[radial-gradient(circle_at_80%_10%,rgba(124,58,237,.22),transparent_34%),radial-gradient(circle_at_10%_70%,rgba(6,182,212,.18),transparent_35%),#080d18] p-5 text-zinc-200" aria-labelledby={`${destination}-title`}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 border-b border-zinc-800 pb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">LeeWay Agent Tablet</p>
          <h1 id={`${destination}-title`} className="mt-1 text-2xl font-black">{view.title}</h1>
          <p className="mt-1 text-sm text-zinc-400">{view.subtitle}</p>
        </header>
        <div className="rounded-[28px] border border-white/10 bg-zinc-950/65 p-5 shadow-xl backdrop-blur-xl">
          <p className="max-w-3xl text-sm leading-6 text-zinc-300">{view.body}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {destination === 'continuum' && <button type="button" onClick={() => onOpen('openNotebook')} className="rounded-lg border border-cyan-800 bg-cyan-950/30 p-4 text-left hover:bg-cyan-900/40"><strong>Open Notebook</strong><span className="mt-1 block text-xs text-zinc-400">Grounded notes and sources</span></button>}
            {destination === 'preview' && <button type="button" onClick={() => onOpen('editor')} className="rounded-lg border border-emerald-800 bg-emerald-950/30 p-4 text-left hover:bg-emerald-900/40"><strong>LeeWay Editor Preview</strong><span className="mt-1 block text-xs text-zinc-400">Open the existing composition preview</span></button>}
            {destination === 'apps' && <>
              <button type="button" onClick={() => onOpen('modelHub')} className="rounded-3xl border border-sky-700 bg-sky-950/20 p-4 text-left shadow-lg hover:border-cyan-400"><strong>LeeWay Model Hub</strong><span className="mt-1 block text-xs leading-5 text-zinc-400">Published model catalog and widget. Inference remains owner-authorized through Runtime and Device Bridge.</span></button>
              <button type="button" onClick={() => onOpen('logistics')} className="rounded-3xl border border-sky-700 bg-sky-950/20 p-4 text-left shadow-lg hover:border-cyan-400"><strong>LeeWay Logistics</strong><span className="mt-1 block text-xs leading-5 text-zinc-400">Published transit and spatial operations surface. Live location remains permission-gated.</span></button>
            </>}
            {destination === 'apps' && appDirectory.map(app => (
              <button key={app.title} type="button" disabled={!app.target} onClick={() => app.target && onOpen(app.target)} className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-800/90 to-zinc-950 p-4 text-left shadow-lg transition hover:-translate-y-0.5 hover:border-cyan-400/50 disabled:cursor-default disabled:hover:translate-y-0">
                <span className="flex items-start justify-between gap-2"><strong>{app.title}</strong><span className="rounded bg-cyan-950 px-1.5 py-0.5 text-[8px] font-black text-cyan-300">{app.state}</span></span>
                <span className="mt-1 block text-xs leading-5 text-zinc-400">{app.detail}</span>
              </button>
            ))}
          </div>
        </div>
        {destination === 'apps' && <div className="mt-5 rounded-[28px] border border-cyan-500/20 bg-[#07131f]/90 p-5 shadow-xl backdrop-blur-xl">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">Canonical published applications</p><h2 className="mt-1 text-lg font-black">Exact LeeWay UI directory</h2></div>
            <p className="max-w-xl text-[10px] leading-4 text-zinc-500">Selecting an application loads its published UI inside the tablet. In the native host it also raises the application window; pop-out restore and close remain controlled from the tablet rail.</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PUBLISHED_LEEWAY_APPS.map(app => <button key={app.id} type="button" onClick={() => onOpen(app.id)} className={`group overflow-hidden rounded-3xl border text-left shadow-xl transition hover:-translate-y-1 hover:border-cyan-300 ${app.accent}`}><span className="relative block aspect-[16/8] overflow-hidden"><img src={tabletAssetUrl(app.iconImage)} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /><span className={`absolute inset-0 bg-gradient-to-t ${app.gradient} opacity-20`} /></span><span className="block p-4"><strong className="block text-sm text-white">{app.title}</strong><span className="mt-1 block text-[10px] leading-4 text-zinc-400">{app.description}</span><span className="mt-3 block text-[8px] font-black uppercase tracking-[0.12em] text-cyan-300">OPEN TRUE UI + WIDGET</span></span></button>)}
          </div>
        </div>}
        {destination === 'apps' && <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
          <h2 className="text-sm font-black uppercase tracking-[0.16em] text-zinc-200">Canonical platform directory</h2>
          <p className="mt-1 text-xs text-zinc-500">Manufacturers and enrolled devices belong beneath these four categories; enrollment is not inferred from a platform label.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{platforms.map(([name, detail], index) => <article key={name} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3"><div className="text-[9px] font-black text-cyan-400">{index + 1}</div><strong className="mt-1 block">{name}</strong><p className="mt-1 text-[10px] leading-4 text-zinc-400">{detail}</p></article>)}</div>
        </div>}
      </div>
    </section>
  );
}
