import React from 'react';

type Destination = 'continuum' | 'preview' | 'apps';

interface TabletDestinationProps {
  destination: Destination;
  onOpen: (surface: 'openNotebook' | 'editor' | 'browser' | 'crm' | 'modelHub' | 'logistics' | 'vscode' | 'terminal') => void;
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
  return (
    <section className="flex-grow overflow-auto bg-[#111318] p-5 text-zinc-200" aria-labelledby={`${destination}-title`}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 border-b border-zinc-800 pb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">LeeWay Agent Tablet</p>
          <h1 id={`${destination}-title`} className="mt-1 text-2xl font-black">{view.title}</h1>
          <p className="mt-1 text-sm text-zinc-400">{view.subtitle}</p>
        </header>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-xl">
          <p className="max-w-3xl text-sm leading-6 text-zinc-300">{view.body}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {destination === 'continuum' && <button type="button" onClick={() => onOpen('openNotebook')} className="rounded-lg border border-cyan-800 bg-cyan-950/30 p-4 text-left hover:bg-cyan-900/40"><strong>Open Notebook</strong><span className="mt-1 block text-xs text-zinc-400">Grounded notes and sources</span></button>}
            {destination === 'preview' && <button type="button" onClick={() => onOpen('editor')} className="rounded-lg border border-emerald-800 bg-emerald-950/30 p-4 text-left hover:bg-emerald-900/40"><strong>LeeWay Editor Preview</strong><span className="mt-1 block text-xs text-zinc-400">Open the existing composition preview</span></button>}
            {destination === 'apps' && <>
              <button type="button" onClick={() => onOpen('editor')} className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-left hover:bg-zinc-800"><strong>LeeWay Office</strong><span className="mt-1 block text-xs text-zinc-400">Documents and composition</span></button>
              <button type="button" onClick={() => onOpen('browser')} className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-left hover:bg-zinc-800"><strong>Research Fabric</strong><span className="mt-1 block text-xs text-zinc-400">Provider-bound research surface</span></button>
              <button type="button" onClick={() => onOpen('vscode')} className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-left hover:bg-zinc-800"><strong>LeeCode</strong><span className="mt-1 block text-xs text-zinc-400">Development workspace</span></button>
              <button type="button" onClick={() => onOpen('terminal')} className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-left hover:bg-zinc-800"><strong>Terminal Gateway</strong><span className="mt-1 block text-xs text-zinc-400">Authorized shell surface</span></button>
              <button type="button" onClick={() => onOpen('crm')} className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-left hover:bg-zinc-800"><strong>Operations</strong><span className="mt-1 block text-xs text-zinc-400">Existing CRM and workflow tools</span></button>
              <button type="button" onClick={() => onOpen('modelHub')} className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-left hover:bg-zinc-800"><strong>LeeWay Model Hub</strong><span className="mt-1 block text-xs text-zinc-400">Existing registered-model catalog and widget. Live inference requires an authenticated LeeWay host.</span></button>
              <button type="button" onClick={() => onOpen('logistics')} className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-left hover:bg-zinc-800"><strong>LeeWay Logistics</strong><span className="mt-1 block text-xs text-zinc-400">Transit World spatial and business operations. Device location requires explicit permission; training map data is not live GPS.</span></button>
            </>}
          </div>
        </div>
      </div>
    </section>
  );
}
