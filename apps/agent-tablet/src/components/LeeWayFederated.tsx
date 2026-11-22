import { CheckCircle2, Cloud, KeyRound, Laptop, ShieldCheck, Smartphone, Webhook, Users, ClipboardList } from 'lucide-react';

/**
 * A presentation of LeeWay Federated inside the existing tablet.  This is
 * deliberately not a new authority, vault, key store, or Device Bridge: it
 * states the required integration boundaries and their observed availability.
 */
export function LeeWayFederated() {
  const journey = [
    { icon: ShieldCheck, step: 'SET UP ONCE', title: 'My LeeWay', detail: 'One account shows registered devices, permitted products, recoverable checkpoints, and approved local or cloud connections.', boundary: 'Identity and authorization remain with existing ZITADEL + Runtime Fabric.' },
    { icon: Smartphone, step: 'ADD DEVICES', title: 'Authenticate, approve, install', detail: 'A new phone, tablet, or computer signs in, requests a device passport, receives owner approval, and installs only its appropriate native package.', boundary: 'Device Bridge + Passport authority performs enrollment; this tablet does not mint credentials.' },
    { icon: Cloud, step: 'RECOVER ANYWHERE', title: 'Review, then restore', detail: 'On a replacement device, review encrypted snapshots, authorized applications, settings, and Agent Lee work before approving staged restoration.', boundary: 'Continuum and recovery staging validate bytes and authorization before any live files are replaced.' }
  ];
  const boundaries = [
    { icon: Webhook, title: 'Device Bridge + Passports', state: 'EXISTING DEVICE AUTHORITY', detail: 'Registered-device identity, capability selection, and owner-authorized operations.' },
    { icon: KeyRound, title: 'Recovery keys and snapshots', state: 'NOT VERIFIED ON THIS DEVICE', detail: 'No backup scope, encrypted envelope, or recovery key is created by this tablet screen.' },
    { icon: Laptop, title: 'Universal Extension', state: 'NOT ENROLLED', detail: 'Browser recovery and native messaging require a signed, owner-approved extension and native host.' }
  ];
  const lifecycle = [
    ['01', 'Idea & discovery', '5W1H, product identity, customer hypothesis, assumptions and discovery evidence.'],
    ['02', 'Plan & design', 'Requirements, business case, architecture, roadmap, risks and acceptance criteria.'],
    ['03', 'Workforce first', 'Employment, onboarding, roster readiness, task-specific skills and permissions.'],
    ['04', 'Build & engineer', 'Capability-routed Office, IDE, Content Foundry and CRM/ERP work packages.'],
    ['05', 'Test & validate', 'Model → Work → Test → Contrary Evidence → Review; defects and qualification.'],
    ['06', 'Prepare & launch', 'Packaging, market readiness, pricing rationale, support and release approval.'],
    ['07', 'Operate & support', 'Approved production, monitoring, customer operations, maintenance and recovery.'],
    ['08', 'Replicate & train', 'Reproducible packages, onboarding, training, restoration and transfer.'],
    ['09', 'Improve', 'Feedback, incident learning, controlled updates and lifecycle review.']
  ];
  return <section className="flex-grow overflow-auto bg-[radial-gradient(circle_at_75%_5%,rgba(168,85,247,.25),transparent_30%),radial-gradient(circle_at_8%_84%,rgba(34,211,238,.18),transparent_34%),#070b15] p-5 text-zinc-100">
    <div className="mx-auto max-w-5xl">
      <header className="rounded-[28px] border border-cyan-300/20 bg-slate-950/75 p-6 shadow-2xl backdrop-blur-xl">
        <p className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-300">LeeWay Federated · owner-controlled continuity</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Product Lifecycle Workspace</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-300">The canonical LeeWay work surface: one product identity, one lifecycle, shared permissions, provenance, recoverable state, and evidence gates across the ecosystem.</p>
      </header>
      <section className="mt-5 rounded-[28px] border border-cyan-300/20 bg-slate-950/70 p-5 shadow-xl"><div className="flex items-center gap-2"><ClipboardList size={18} className="text-cyan-300" /><h2 className="font-black">5W1H product record</h2></div><p className="mt-2 text-xs leading-5 text-zinc-400">WHO, WHAT, WHEN, WHERE, WHY and HOW are durable project fields—not a one-time chat prompt. A workspace cannot pass a stage gate merely because a model produced text.</p><div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">{['Who','What','When','Where','Why','How'].map(label => <div key={label} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-center text-[10px] font-black uppercase tracking-[.14em] text-cyan-200">{label}</div>)}</div></section>
      <section className="mt-5 rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-xl"><div className="flex items-center gap-2"><Users size={18} className="text-cyan-300" /><h2 className="font-black">Workforce-first operating rule</h2></div><p className="mt-2 text-xs leading-5 text-zinc-400">Before work is distributed, Agent Lee must define roles, onboard qualified workers, register readiness, equip task-specific skills and permissions, and coordinate every handoff through Blackboard. Blackboard records coordination; it never grants execution authority.</p></section>
      <section className="mt-5 rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-xl"><h2 className="font-black">Canonical lifecycle</h2><div className="mt-4 grid gap-3 md:grid-cols-3">{lifecycle.map(([number,title,detail]) => <article key={number} className="rounded-2xl border border-white/10 bg-black/25 p-4"><span className="text-xs font-black text-cyan-300">{number}</span><h3 className="mt-1 text-sm font-black">{title}</h3><p className="mt-2 text-[11px] leading-5 text-zinc-400">{detail}</p><span className="mt-3 inline-flex rounded-full border border-amber-300/20 bg-amber-400/10 px-2 py-1 text-[8px] font-black tracking-[.12em] text-amber-200">ADAPTER QUALIFICATION REQUIRED</span></article>)}</div></section>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {journey.map(({ icon: Icon, step, title, detail, boundary }, index) => <article key={step} className="relative rounded-3xl border border-white/10 bg-slate-950/75 p-5 shadow-xl"><span className="absolute right-5 top-5 text-4xl font-black text-white/5">0{index + 1}</span><Icon size={24} className="text-cyan-300" /><p className="mt-4 text-[9px] font-black tracking-[.17em] text-cyan-300">{step}</p><h2 className="mt-1 text-lg font-black text-white">{title}</h2><p className="mt-2 text-xs leading-5 text-zinc-300">{detail}</p><p className="mt-4 border-t border-white/10 pt-3 text-[10px] leading-4 text-zinc-500">{boundary}</p></article>)}
      </div>
      <section className="mt-5 rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-xl"><div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-cyan-300" /><h2 className="font-black">Existing LeeWay integration boundaries</h2></div><div className="mt-4 grid gap-3 md:grid-cols-3">{boundaries.map(({ icon: Icon, title, state, detail }) => <article key={title} className="rounded-2xl border border-white/10 bg-black/25 p-4"><Icon size={20} className="text-violet-300" /><h3 className="mt-3 text-sm font-black">{title}</h3><span className="mt-2 inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-1 text-[8px] font-black tracking-[.12em] text-cyan-200">{state}</span><p className="mt-3 text-[11px] leading-5 text-zinc-400">{detail}</p></article>)}</div></section>
      <p className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-xs leading-5 text-amber-100">Recovery can restore only data inside an authorized, encrypted backup scope. Provider connections are restored as configuration metadata and must obtain fresh provider authentication whenever required. This screen cannot bypass those controls.</p>
    </div>
  </section>;
}
