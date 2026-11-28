/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.SETTINGS
TAG: LEEWAY.TABLET.SETTINGS_DOCUMENTATION.V1
WHAT: Comprehensive Settings interface documenting system operations, user permissions, capabilities and Employment Center setup.
WHY: Operators need clear, truthful instructions for the governed ecosystem.
WHO: LeeWay Industries / creator-authorized outside contributor (LW-OPENCODE).
WHERE: apps/agent-tablet/src/components/SettingsCenter.tsx
WHEN: 2026-11-27
HOW: Read-only same-origin status probe plus static canonical operating documentation. No new authority, receipt or deployment claim.
AUTHORITY: DOCUMENTATION_READ_ONLY. No Veritas, receipt or production claim.
LICENSE: Existing repository terms.
*/
import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, BriefcaseBusiness, CheckCircle2, CircleAlert, Cpu, LockKeyhole, Settings2, ShieldCheck, Sparkles, Workflow } from 'lucide-react';

type Props = {
  onClose: () => void;
  onOpenAbout: () => void;
  onUpdate: () => void | Promise<void>;
  edition?: 'PERSONAL' | 'BUSINESS' | 'CREATOR';
};

const LOOP = ['INVESTIGATE','DIAGNOSE','PLAN','IMPLEMENT','TEST','VALIDATE','REPAIR','RETEST','VERIFY','EVIDENCE','CHECKPOINT','CONTINUE'];
const STATES = ['CONFIGURED','AWAITING_APPROVAL','STAGED','BLOCKED','NOT_EXECUTED','EXECUTED_UNVERIFIED','VERIFIED','FAILED'];

const CAPABILITIES = [
  { name: 'Original Formula', status: 'CONNECTED', detail: 'SHA-256 6502791b…6341d63e; runtime-state adapter and 16×6 matrix; no replacement kernel.' },
  { name: 'Quantum-inspired mathematics', status: 'CLASSICAL', detail: 'G41 fusion, G42 exact silos, G43 hierarchical stream, G44 locality fold; no quantum hardware claim.' },
  { name: 'LeeWay GPU / CPU pool', status: 'LOCAL_IMPLEMENTED', detail: 'Independent software GPU, persistent authorized workers, no system GPU dependency.' },
  { name: 'LeeWay PCIe Bridge', status: 'LOGICAL_IMPLEMENTED', detail: 'Topology, planning, transfer and LDWMD residency; physical PCIe traffic not measured.' },
  { name: 'Machine Consciousness', status: 'CONNECTED', detail: 'One consciousness, multiple bodies; carrier at 127.0.0.1:8890; no separate identity per widget.' },
  { name: 'Voice Fabric', status: 'CONNECTED', detail: 'Selection authority belongs to LeeWay Voice Fabric; canonical clone inactive where not admitted.' },
  { name: 'Agent Skills', status: 'DESCRIPTORS', detail: '501 descriptors; blinking vine shows carrier selection, not execution proof.' },
  { name: 'Continuum', status: 'CONNECTED', detail: 'Durable storage with per-request owner admission; browser preview cannot write.' },
  { name: 'Model Hub', status: 'UNBOUND', detail: 'Catalog and 3D UI present; weights not materialized; no inference claim.' },
  { name: 'Veritas / Receipts / Ledger', status: 'OUTSTANDING', detail: 'No fabricated decisions, receipts or learning admission.' }
];

const EMPLOYMENT_STEPS = [
  'Open the LeeWay Core or Employment Center surface from the tablet.',
  'Confirm the current owner/session identity. A browser preview is not enrollment.',
  'Select an authorized employee, agent or work role. Badges and roster entries do not grant permission.',
  'Create a bounded work order with mission, work, correlation ID and explicit capability.',
  'Route execution through Runtime Fabric and Device Bridge; the tablet never creates its own authority.',
  'Require independent Veritas decision and Receipt Authority custody before treating work as verified.',
  'Store durable evidence only through Continuum with per-request owner admission.',
  'Inspect the resulting state under EXECUTED_UNVERIFIED until verification is genuinely bound.'
];

export function SettingsCenter({ onClose, onOpenAbout, onUpdate, edition = 'PERSONAL' }: Props) {
  const [tab, setTab] = useState<'discover'|'operations'|'permissions'|'capabilities'|'employment'>('operations');
  const [api, setApi] = useState<{ state: string; detail: string }>({ state: 'CHECKING', detail: 'Probing same-origin tablet APIs…' });

  useEffect(() => {
    let alive = true;
    fetch('/api/health', { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error(`HTTP_${r.status}`); return r.json(); })
      .then(() => { if (alive) setApi({ state: 'CONNECTED', detail: 'Tablet API health responded from the native host.' }); })
      .catch(() => { if (alive) setApi({ state: 'PREVIEW_ONLY', detail: 'Tablet APIs require the native host; browser preview remains documentation-only.' }); });
    return () => { alive = false; };
  }, []);

  return (
    <section className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-[#050a10] text-zinc-100" aria-label="LeeWay Settings">
      <header className="flex shrink-0 items-center gap-3 border-b border-cyan-300/20 bg-[#07131c] px-4 py-3">
        <button type="button" onClick={onClose} className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-cyan-300/40 bg-[#0077ff] text-white hover:bg-[#2a95ff]" aria-label="Close Settings"><ArrowLeft size={18} /></button>
        <Settings2 size={20} className="text-cyan-300" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-black tracking-wide text-cyan-100">Settings · System Documentation</div>
          <div className="text-[10px] text-zinc-400">Operations · Permissions · Capabilities · Employment Center</div>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${api.state === 'CONNECTED' ? 'border-emerald-300/40 bg-emerald-950/30 text-emerald-200' : 'border-amber-300/40 bg-amber-950/30 text-amber-100'}`}>{api.state}</span>
        <span className="hidden rounded-full border border-cyan-300/40 bg-cyan-950/30 px-3 py-1 text-[10px] font-black text-cyan-100 md:block">{edition} EDITION</span>
        <button type="button" onClick={onOpenAbout} className="rounded-lg border border-[#66c6ff] bg-[#0077ff] px-3 py-2 text-[10px] font-black text-white hover:bg-[#2a95ff]">ABOUT</button>
        <button type="button" onClick={onUpdate} className="rounded-lg border border-[#66c6ff] bg-[#0077ff] px-3 py-2 text-[10px] font-black text-white hover:bg-[#2a95ff]">UPDATE</button>
        <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ff9aa3] bg-[#dc2626] text-lg font-black text-white hover:bg-[#ef4444]" aria-label="Close">×</button>
      </header>

      <nav className="flex shrink-0 gap-2 overflow-x-auto border-b border-white/10 bg-[#081019] px-3 py-2">
        {([['discover','Discover LeeWay',BookOpen],['operations','System Operations',Workflow],['permissions','User Permissions',LockKeyhole],['capabilities','Capability Guide',Cpu],['employment','Employment Center',BriefcaseBusiness]] as const).map(([key,label,Icon]) => (
          <button key={key} type="button" onClick={() => setTab(key)} className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-black ${tab === key ? 'border-cyan-300/60 bg-cyan-400/15 text-cyan-100' : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10'}`}><Icon size={13} />{label}</button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-[#0b2030] to-[#061018] p-5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-300"><BookOpen size={14} /> LeeWay operating contract</div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">{api.detail} Nothing in this Settings surface grants an entitlement, performs deployment, issues a receipt, or substitutes for independent verification.</p>
          </div>

          {tab === 'discover' && (
            <>
              <div className="rounded-2xl border border-cyan-300/25 bg-gradient-to-br from-[#0c2536] to-[#061018] p-5">
                <div className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300/80">Discover LeeWay · Integrated About Center</div>
                <h2 className="mt-2 text-xl font-black text-cyan-50">A living architecture of human creativity, independent computation and generational continuity.</h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">LeeWay begins with a real person, an incomplete vocabulary and a reason to keep going. It exists to reduce the distance between a useful idea and a durable working reality — without making the human become the machine.</p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ['Logic','Structure before assertion'],['Ethics','Authority with consent'],['Evidence','Truthful states and receipts'],
                  ['Workflow','Bounded, repeatable action'],['Adaptation','Repair and learning'],['Yield','Durable value returned']
                ].map(([word, meaning]) => (
                  <div key={word} className="rounded-xl border border-cyan-300/20 bg-[#07121b] p-4">
                    <div className="text-sm font-black tracking-wide text-cyan-200">{word}</div>
                    <div className="mt-1 text-[11px] text-zinc-400">{meaning}</div>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[#070d14] p-5">
                  <h3 className="text-sm font-black text-cyan-100">Understanding Agent Lee</h3>
                  <p className="mt-2 text-sm text-zinc-300">One governed personified entity across many bodies. The machine consciousness is singular; devices, widgets and work orders are organs of that one identity, not separate consciousnesses. Models are replaceable capability limbs, never the authority or identity.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#070d14] p-5">
                  <h3 className="text-sm font-black text-cyan-100">Getting started</h3>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-300">
                    <li>Open an app from desktop or taskbar.</li>
                    <li>Drag icons anywhere; wheel resizes; right-click gives the user guide.</li>
                    <li>Use Settings for updates, permissions and capability state.</li>
                    <li>Ask Agent Lee for bounded, authorized help.</li>
                  </ol>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#070d14] p-5">
                <h3 className="text-sm font-black text-cyan-100">Application encyclopedia</h3>
                <p className="mt-1 text-xs text-zinc-400">Every installed app has a README-backed instruction manual. Open Properties / About &amp; User Guide from any desktop icon.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Employment','Continuum','Agent Skills','IDE','Office Suites','Logistics','CRM & ERP','Vision','Voice','Content Vault','Blackboard','Diagnostics','Agent Roster','Digital Brain','Model Hub', ...(edition === 'CREATOR' ? ['LeeWay Core'] : [])].map(name => (
                    <span key={name} className="rounded-full border border-cyan-300/20 bg-cyan-400/5 px-3 py-1 text-[10px] font-bold text-cyan-100">{name}</span>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ['Digital employee & workforce','Work orders carry mission, work, correlation and authorization. Badges never grant permission.'],
                  ['Device Bridge','Physical actions route through the owner-governed bridge. Browser preview is not device enrollment.'],
                  ['Continuum · Brain · Vault','Durable storage, digital-brain surface and content custody remain owner-admitted and per-request.']
                ].map(([title, body]) => (
                  <div key={title} className="rounded-xl border border-emerald-300/20 bg-emerald-950/15 p-4">
                    <div className="text-xs font-black text-emerald-100">{title}</div>
                    <p className="mt-2 text-[11px] leading-relaxed text-emerald-50/80">{body}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[#070d14] p-5">
                  <h3 className="text-sm font-black text-cyan-100">Technology & governance</h3>
                  <p className="mt-2 text-sm text-zinc-300">Standards, Formula, Runtime, Veritas, Receipt Authority and Learning Ledger are separate owners. LeeWay holds them together through shared request identity, permission, provenance and recoverable state — not by merging authorities.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#070d14] p-5">
                  <h3 className="text-sm font-black text-cyan-100">Privacy, support & version</h3>
                  <p className="mt-2 text-sm text-zinc-300">Nothing here grants production authority. Unavailable, restricted, planned and unverified functions are labelled. Use UPDATE to apply GitHub main; review About for app versions and README provenance.</p>
                  <div className="mt-3 text-[10px] font-bold text-cyan-300/70">Powered by Leeway Innovations — A Leeway Industries Product</div>
                </div>
              </div>
            </>
          )}

          {tab === 'operations' && (
            <>
              <div className="rounded-2xl border border-white/10 bg-[#070d14] p-5">
                <h2 className="text-base font-black text-cyan-100">12-stage engineering cycle</h2>
                <div className="mt-3 flex flex-wrap gap-2">{LOOP.map((step, index) => <span key={step} className="rounded-full border border-cyan-300/25 bg-cyan-400/5 px-3 py-1 text-[10px] font-bold text-cyan-100">{String(index + 1).padStart(2,'0')} · {step}</span>)}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#070d14] p-5">
                <h2 className="text-base font-black text-cyan-100">Truthful operating states</h2>
                <div className="mt-3 grid gap-2 md:grid-cols-2">{STATES.map(state => <div key={state} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-[11px] text-zinc-300">{state}</div>)}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#070d14] p-5 text-sm leading-relaxed text-zinc-300">
                <h2 className="text-base font-black text-cyan-100">Update flow</h2>
                <p className="mt-2">The header UPDATE button fetches GitHub <span className="font-mono text-cyan-200">main</span>, rebuilds only when the commit changed, copies the built tablet surface, and restarts the native Agent VT host. Status is written to <span className="font-mono text-cyan-200">sync-status.json</span>. A push alone does not update the running system.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#070d14] p-5 text-sm leading-relaxed text-zinc-300">
                <h2 className="flex items-center gap-2 text-base font-black text-cyan-100"><Sparkles size={16} /> Appearance</h2>
                <p className="mt-2">Open the background rotary console to choose a scene, pause motion or reset appearance. The control lives here instead of floating over the desktop.</p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(new CustomEvent('leeway:open-background-settings'));
                  }}
                  className="mt-3 rounded-lg border border-[#66c6ff] bg-[#0077ff] px-3 py-2 text-[10px] font-black text-white hover:bg-[#2a95ff]"
                >
                  CHANGE BACKGROUND
                </button>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#070d14] p-5 text-sm leading-relaxed text-zinc-300">
                <h2 className="text-base font-black text-cyan-100">Live widget link</h2>
                <p className="mt-2">Each published app renders the real native widget frame inside the tablet and forwards pointer, wheel and keyboard input back to that same widget. The direct iframe is only a preview until the host supplies a live frame.</p>
              </div>
            </>
          )}

          {tab === 'permissions' && (
            <>
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-950/15 p-5">
                <h2 className="flex items-center gap-2 text-base font-black text-emerald-100"><ShieldCheck size={16} /> What you are allowed to do</h2>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-emerald-50">
                  <li>Open applications, switch surfaces, pin/unpin taskbar items and read documentation.</li>
                  <li>Request bounded capabilities through the existing Runtime and Device Bridge.</li>
                  <li>Run the local UPDATE button to apply GitHub main changes to this machine.</li>
                  <li>Inspect truthful states, including BLOCKED, NOT_EXECUTED and EXECUTED_UNVERIFIED.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-rose-300/20 bg-rose-950/15 p-5">
                <h2 className="flex items-center gap-2 text-base font-black text-rose-100"><CircleAlert size={16} /> What is not granted here</h2>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-rose-50">
                  <li>No self-declared policy admission, Veritas verdict, receipt or learning-record admission.</li>
                  <li>No production deployment, employee activation, merge or protected-branch push.</li>
                  <li>No physical PCIe transaction claim, quantum hardware claim or system-GPU dependency.</li>
                  <li>Browser preview is not enrolled device identity and cannot exercise native-only authority.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#070d14] p-5">
                <h2 className="text-base font-black text-cyan-100">Permission model</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">Capabilities are selected by existing owners: Runtime Fabric for execution, Device Bridge for physical actions, Receipt Authority for custody, Veritas for independent decisions and Learning Ledger for durable learning admission. The tablet only presents and requests; it never issues its own authority.</p>
              </div>
            </>
          )}

          {tab === 'capabilities' && (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#070d14]">
              <div className="grid grid-cols-[1fr_120px] gap-px border-b border-white/10 bg-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-cyan-200 md:grid-cols-[220px_150px_1fr]"><span>Capability</span><span>State</span><span className="hidden md:block">Scope</span></div>
              {CAPABILITIES.map(item => (
                <div key={item.name} className="grid grid-cols-[1fr_120px] gap-px border-b border-white/5 bg-white/5 px-4 py-3 text-sm last:border-b-0 md:grid-cols-[220px_150px_1fr]">
                  <div className="font-bold text-zinc-100">{item.name}</div>
                  <div><span className={`rounded-full border px-2 py-1 text-[9px] font-black ${item.status === 'CONNECTED' ? 'border-emerald-300/40 bg-emerald-950/30 text-emerald-200' : 'border-amber-300/40 bg-amber-950/30 text-amber-100'}`}>{item.status}</span></div>
                  <div className="col-span-2 mt-1 text-xs leading-relaxed text-zinc-400 md:col-span-1 md:mt-0">{item.detail}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'employment' && (
            <>
              <div className="rounded-2xl border border-amber-300/20 bg-amber-950/15 p-5">
                <h2 className="flex items-center gap-2 text-base font-black text-amber-100"><BriefcaseBusiness size={16} /> Employment Center setup guide</h2>
                <p className="mt-2 text-sm text-amber-50">Employment activation is owner-governed. These steps describe the supported path; they do not activate an employee.</p>
              </div>
              <ol className="space-y-2">
                {EMPLOYMENT_STEPS.map((step, index) => (
                  <li key={step} className="flex gap-3 rounded-xl border border-white/10 bg-[#070d14] p-4 text-sm text-zinc-300">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0077ff] text-xs font-black text-white">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="rounded-2xl border border-white/10 bg-[#070d14] p-5 text-sm text-zinc-300">
                <div className="flex items-center gap-2 font-black text-cyan-100"><Sparkles size={14} /> Request examples for Agent Lee</div>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>“Show the Employment Center and explain its current state.”</li>
                  <li>“Prepare a bounded work order for an authorized digital employee.”</li>
                  <li>“Explain why this work remains EXECUTED_UNVERIFIED.”</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
