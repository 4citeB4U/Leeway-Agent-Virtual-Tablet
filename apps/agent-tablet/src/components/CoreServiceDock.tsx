/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT.TABLET.CORE.DOCK
TAG: LEEWAY.TABLET.CORE.SERVICE.ENTRYPOINT.V1
5WH:
WHAT = Provide a single user-owned Tablet entrypoint to existing ecosystem surfaces and future native widgets.
WHY = Users interact through the Tablet, while Device Bridge and Runtime retain execution authority.
WHO = LeeWay Tablet under Creator and LeeWay Standards.
WHERE = apps/agent-tablet/src/components/CoreServiceDock.tsx.
WHEN = 2026-11-16.
HOW = User-initiated popout, truth-preserving unverified states and existing Tablet navigation only.
LICENSE = Existing repository terms (Apache-2.0), no new rights asserted.
*/
import React, { useState } from 'react';
import type { WorkstationAppId } from '../types';

type CoreSurface = {
  id: string;
  title: string;
  group: 'Control' | 'Intelligence' | 'Compute' | 'Memory' | 'Sensory' | 'Network';
  description: string;
  relatedTabletView?: WorkstationAppId;
};

const coreSurfaces: readonly CoreSurface[] = [
  { id: 'agent-lee', title: 'Agent Lee / Machine Consciousness', group: 'Intelligence', description: 'The existing individual Agent Lee identity; not an embedded model or duplicate agent.', relatedTabletView: 'desktop' },
  { id: 'device-bridge', title: 'Device Bridge', group: 'Control', description: 'Owner-authorized device, desktop, phone and host execution. Requires a real execute-scoped Runtime/Bridge connection.', relatedTabletView: 'diagnostics' },
  { id: 'agent-skills', title: 'Agent Skills', group: 'Control', description: 'Canonical LeeWay Agent Skills capability discovery and invocation; runtime tool binding not yet verified.' },
  { id: 'runtime', title: 'Runtime, Formula & Evidence', group: 'Control', description: 'Existing Runtime Fabric, Formula, independent Veritas, Receipt Authority and Learning Ledger.' },
  { id: 'workforce', title: 'Workforce & Blackboard', group: 'Control', description: 'Existing worker roster, assignments and authenticated collaboration.', relatedTabletView: 'workforce' },
  { id: 'gpu', title: 'GPU, LDWMD & VRAM', group: 'Compute', description: 'Physical GPU execution, buffer leases and durable VRAM checkpoints. Catalog visibility is not compute proof.', relatedTabletView: 'modelHub' },
  { id: 'model-hub', title: 'Model Hub', group: 'Compute', description: 'Approved model catalog and model activation through its existing bound service.', relatedTabletView: 'modelHub' },
  { id: 'continuum', title: 'Continuum', group: 'Memory', description: 'Owner-scoped continuity and durable evidence; no second memory authority.', relatedTabletView: 'continuum' },
  { id: 'brain', title: 'Digital Brain & Diagnostics', group: 'Memory', description: 'Two separate products owned by the physical device, not by LeeWay or the user.', relatedTabletView: 'diagnostics' },
  { id: 'seafile', title: 'Seafile & Data Fabric', group: 'Memory', description: 'Preserved file/data service and approved source projections; not automatically an active host.', relatedTabletView: 'database' },
  { id: 'voice', title: 'Voice Fabric / Listening', group: 'Sensory', description: 'Approved speech, microphone consent, streaming, interruptibility and speaker readback.' },
  { id: 'vision', title: 'Vision Fabric / Cameras', group: 'Sensory', description: 'Per-device camera consent, authenticated streams and actual frame-readback evidence.' },
  { id: 'edge-rtc', title: 'Edge RTC', group: 'Network', description: 'Real-time voice/video transport; sessions and client authority are separate from this UI.' },
  { id: 'federate', title: 'Federate Web / Edge', group: 'Network', description: 'Standards-backed discovery and qualified peer federation; public pages are not native execution.' },
];

export function CoreServiceDock({ onOpenSurface }: { onOpenSurface: (surface: WorkstationAppId) => void }) {
  const [visible, setVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = coreSurfaces.find(surface => surface.id === selectedId);

  return (
    <div className="fixed bottom-10 right-3 z-[90] max-w-[calc(100vw-1.5rem)] text-zinc-100">
      {visible && (
        <section aria-label="LeeWay core service controls" className="mb-2 max-h-[min(70vh,620px)] w-[min(90vw,440px)] overflow-y-auto rounded-xl border border-cyan-700 bg-[#0b1422] p-4 shadow-2xl">
          <header className="mb-3 flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">LeeWay Agent Virtual Tablet</div>
              <h2 className="text-base font-bold">Core control ground</h2>
            </div>
            <button type="button" onClick={() => { setVisible(false); setSelectedId(null); }} aria-label="Close core services" className="rounded border border-zinc-600 px-2 py-1 text-xs">Close</button>
          </header>
          {selected ? (
            <div className="space-y-3">
              <button type="button" onClick={() => setSelectedId(null)} className="text-xs text-cyan-300">Back to all systems</button>
              <h3 className="text-sm font-bold">{selected.title}</h3>
              <p className="text-xs leading-relaxed text-zinc-300">{selected.description}</p>
              <p role="status" className="rounded border border-amber-700 bg-amber-950/20 p-2 text-xs text-amber-200">LIVE SERVICE: NOT VERIFIED IN THIS TABLET SESSION. This panel does not execute device commands or claim connected cameras, models or voice.</p>
              {selected.relatedTabletView ? (
                <button type="button" className="rounded bg-cyan-900 px-3 py-2 text-xs font-bold" onClick={() => { onOpenSurface(selected.relatedTabletView!); setVisible(false); setSelectedId(null); }}>
                  Open related Tablet workspace
                </button>
              ) : (
                <p className="text-xs text-zinc-400">No execution-qualified Tablet adapter is connected for this service yet.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {coreSurfaces.map(surface => (
                <button type="button" key={surface.id} onClick={() => setSelectedId(surface.id)}
                  className="rounded border border-zinc-700 bg-zinc-900/80 p-2.5 text-left hover:border-cyan-600"
                  aria-label={'Inspect ' + surface.title}>
                  <span className="block text-[9px] uppercase tracking-wider text-cyan-300">{surface.group}</span>
                  <span className="mt-1 block text-xs font-semibold">{surface.title}</span>
                </button>
              ))}
            </div>
          )}
          <p className="mt-3 text-[10px] text-zinc-500">Existing authorities remain external. Studios and additional products enter only after core execution is qualified.</p>
        </section>
      )}
      <button type="button" aria-expanded={visible} aria-label="Toggle LeeWay core service widget" onClick={() => { setVisible(v => !v); setSelectedId(null); }}
        className="ml-auto block rounded-full border border-cyan-500 bg-[#10243a] px-4 py-2 text-xs font-black shadow-lg hover:bg-[#174263]">
        LeeWay Core
      </button>
    </div>
  );
}
