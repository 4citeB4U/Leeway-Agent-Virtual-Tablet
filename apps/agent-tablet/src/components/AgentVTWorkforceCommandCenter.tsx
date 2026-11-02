/*
 * LEEWAY HEADER — DO NOT REMOVE
 * REGION: WORKFORCE.AGENT_VT_COMMAND_CENTER
 * TAG: WORKFORCE.READ_ONLY.RUNTIME_PROJECTION
 * 5WH: WHAT=Project the existing Runtime readback into the Agent VT workstation;
 * WHY=Show the requested W00–W17 roster without inventing execution state;
 * WHO=Creator / Agent Lee through the existing caller-bound Workforce route;
 * WHERE=apps/agent-tablet/src/components/AgentVTWorkforceCommandCenter.tsx;
 * WHEN=2026;
 * HOW=Fail-closed typed projection with no local authority or worker animation.
 * AUTHORITY: Read-only UI projection; no queue, dispatch, Formula, Veritas, receipt, or learning authority.
 * LICENSE: LeeWay-authored source.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

type UnknownRecord = Record<string, unknown>;

export const WORKFORCE_WORKER_IDS = Object.freeze(
  Array.from({ length: 18 }, (_, index) => `W${String(index).padStart(2, '0')}`)
);

export const WORKFORCE_WORKER_NAMES = Object.freeze([
  'Command Operations',
  'LeeWay Standards',
  'LeeWay Formula',
  'Runtime Fabric',
  'Independent Veritas',
  'Receipt Authority',
  'Learning Ledger',
  'Device Bridge & Pocket ID',
  'Skills & MCP',
  'Continuum & Digital Brain',
  'GPU & VRAM',
  'Agent Lee Intelligence',
  'Voice & RTC',
  'Federation',
  'Digital Workforce',
  'Integration Lead',
  'Security Review',
  'Evidence Review',
]);

export type WorkforceWorkerState =
  | 'QUEUED'
  | 'RUNNING'
  | 'CHECKPOINTED'
  | 'PAUSED'
  | 'BLOCKED'
  | 'FAILED'
  | 'COMPLETED'
  | 'UNVERIFIED';

export interface WorkforceWorkerProjection {
  id: string;
  name: string;
  state: WorkforceWorkerState;
  evidenceState: 'OBSERVED' | 'UNVERIFIED';
  running: boolean;
  reason: string;
  observedAt: string | null;
  workId: string | null;
  stage: string | null;
  nextAction: string | null;
  dependencies: string[];
  evidenceRefs: string[];
  executionResult: string | null;
  error: string | null;
  receipt: string | null;
  verified: boolean;
  executorObserved: boolean;
  source: string | null;
  executionIdentity: string | null;
  threadId: string | null;
  sessionId: string | null;
  turnId: string | null;
  resumed: boolean;
}

export interface WorkforceProjection {
  state: string;
  reason: string | null;
  runtimeDiscovery: string;
  transport: string | null;
  fetchedAt: string;
  productionExecutionAuthorized: boolean;
  formulaExecuted: boolean;
  veritasAccepted: boolean;
  receiptAdmitted: boolean;
  learningAdmitted: boolean;
  authorityBoundary: {
    providerEvidenceOnly: boolean;
    canonicalWorkerIdentityVerified: false;
    primeIdentityVerified: false;
    canonicalAcceptance: false;
  };
  queuedJobs: number | null;
  events: UnknownRecord[];
  primeEvents: UnknownRecord[];
  collaborationEvents: UnknownRecord[];
  approvalsEvents: UnknownRecord[];
  workers: WorkforceWorkerProjection[];
}

const KNOWN_STATES = new Set<WorkforceWorkerState>([
  'QUEUED', 'RUNNING', 'CHECKPOINTED', 'PAUSED', 'BLOCKED', 'FAILED', 'COMPLETED',
]);
const LIVE_HEARTBEAT_MAX_AGE_MS = 45_000;

const asRecord = (value: unknown): UnknownRecord => (
  value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : {}
);

const asText = (value: unknown): string | null => (
  typeof value === 'string' && value.trim() ? value.trim() : null
);

const asRecords = (value: unknown): UnknownRecord[] => (
  Array.isArray(value) ? value.map(asRecord) : []
);

const asStringList = (value: unknown): string[] => (
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map((item) => item.trim()) : []
);

const normalizeState = (value: unknown): WorkforceWorkerState => {
  const state = asText(value)?.toUpperCase() as WorkforceWorkerState | null;
  return state && KNOWN_STATES.has(state) ? state : 'UNVERIFIED';
};

const workerIdentity = (entry: UnknownRecord): string | null => (
  asText(entry.workerId) || asText(entry.id) || asText(entry.brandedId) || asText(entry.workerObjectId)
);

const workerName = (id: string): string => {
  const index = WORKFORCE_WORKER_IDS.indexOf(id);
  return index >= 0 ? WORKFORCE_WORKER_NAMES[index] : 'Unassigned worker';
};

const emptyWorker = (id: string, reason = 'WORKER_IDENTITY_NOT_EXPOSED'): WorkforceWorkerProjection => ({
  id,
  name: workerName(id),
  state: 'UNVERIFIED',
  evidenceState: 'UNVERIFIED',
  running: false,
  reason,
  observedAt: null,
  workId: null,
  stage: null,
  nextAction: null,
  dependencies: [],
  evidenceRefs: [],
  executionResult: null,
  error: null,
  receipt: null,
  verified: false,
  executorObserved: false,
  source: null,
  executionIdentity: null,
  threadId: null,
  sessionId: null,
  turnId: null,
  resumed: false,
});

export function projectWorkforceSnapshot(input: unknown): WorkforceProjection {
  const payload = asRecord(input);
  const reportedAuthorityBoundary = asRecord(payload.authorityBoundary);
  const candidates = [payload.workers, payload.workerStatus, payload.workerStatuses];
  const entries = asRecords(candidates.find(Array.isArray));
  const byId = new Map(entries.map((entry) => [workerIdentity(entry), entry] as const));
  const workers = WORKFORCE_WORKER_IDS.map((id): WorkforceWorkerProjection => {
    const entry = byId.get(id);
    if (!entry) return emptyWorker(id);

    // A status value without a fresh observation, source, and explicit executor evidence
    // is descriptive input, not proof of a live worker.
    const evidenceState = asText(entry.evidenceState || entry.verificationState)?.toUpperCase();
    const observedAt = asText(entry.observedAt || entry.heartbeatAt || entry.updatedAt);
    const source = asText(entry.source || entry.provider || entry.executor);
    const executorObserved = entry.executorObserved === true;
    if (evidenceState !== 'OBSERVED' || !observedAt || !source || !executorObserved) {
      return emptyWorker(id, 'WORKER_STATUS_NOT_INDEPENDENTLY_OBSERVED');
    }

    const state = normalizeState(entry.state || entry.status || entry.runtimeState);
    if (state === 'UNVERIFIED') return emptyWorker(id, 'WORKER_STATE_NOT_RECOGNIZED');
    if (state === 'RUNNING') {
      const observedMs = Date.parse(observedAt);
      const ageMs = Date.now() - observedMs;
      if (!Number.isFinite(observedMs) || ageMs < -5_000 || ageMs > LIVE_HEARTBEAT_MAX_AGE_MS) {
        return emptyWorker(id, 'WORKER_HEARTBEAT_STALE');
      }
    }
    return {
      id,
      name: workerName(id),
      state,
      evidenceState: 'OBSERVED',
      running: state === 'RUNNING',
      reason: 'OBSERVED_BY_RUNTIME_PROVIDER',
      observedAt,
      workId: asText(entry.workId || entry.jobId),
      stage: asText(entry.stage || entry.engineeringStage),
      nextAction: asText(entry.nextAction),
      dependencies: asStringList(entry.dependencies),
      evidenceRefs: asStringList(entry.evidenceRefs || entry.sourceRefs),
      executionResult: asText(entry.executionResult || entry.status || entry.state),
      error: asText(entry.error || entry.turnFailure),
      receipt: asText(entry.receipt || entry.receiptRef),
      verified: entry.verified === true,
      executorObserved,
      source,
      executionIdentity: asText(entry.executionIdentity),
      threadId: asText(entry.threadId),
      sessionId: asText(entry.sessionId),
      turnId: asText(entry.turnId),
      resumed: entry.resumed === true,
    };
  });

  return {
    state: asText(payload.state) || 'BLOCKED',
    reason: asText(payload.reason),
    runtimeDiscovery: asText(payload.runtimeDiscovery) || 'UNVERIFIED',
    transport: asText(payload.transport),
    fetchedAt: new Date().toISOString(),
    productionExecutionAuthorized: payload.productionExecutionAuthorized === true,
    formulaExecuted: payload.formulaExecuted === true,
    veritasAccepted: payload.veritasAccepted === true,
    receiptAdmitted: payload.receiptAdmitted === true,
    learningAdmitted: payload.learningAdmitted === true,
    // The UI has no authority to promote a reported identity or acceptance
    // claim. Those values stay false until a separately qualified authority
    // boundary is introduced and its contract is explicitly bound here.
    authorityBoundary: {
      providerEvidenceOnly: reportedAuthorityBoundary.providerEvidenceOnly === true,
      canonicalWorkerIdentityVerified: false,
      primeIdentityVerified: false,
      canonicalAcceptance: false,
    },
    queuedJobs: typeof payload.queuedJobs === 'number' && Number.isFinite(payload.queuedJobs) ? payload.queuedJobs : null,
    events: asRecords(payload.events),
    primeEvents: asRecords(payload.primeEvents),
    collaborationEvents: asRecords(payload.collaborationEvents),
    approvalsEvents: asRecords(payload.approvalsEvents),
    workers,
  };
}

export async function fetchWorkforceSnapshot(fetchImpl: typeof fetch = fetch, authorization?: string): Promise<WorkforceProjection> {
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (authorization) headers.Authorization = authorization;
    const response = await fetchImpl('/api/workforce/runtime-fabric', { method: 'GET', cache: 'no-store', credentials: 'same-origin', headers });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return projectWorkforceSnapshot({ ...asRecord(body), state: 'BLOCKED', reason: asText(asRecord(body).reason) || `RUNTIME_HTTP_${response.status}` });
    return projectWorkforceSnapshot(body);
  } catch {
    return projectWorkforceSnapshot({ state: 'BLOCKED', reason: 'RUNTIME_READBACK_UNAVAILABLE' });
  }
}

const stateTone: Record<WorkforceWorkerState, string> = {
  QUEUED: 'border-sky-700/60 bg-sky-950/30 text-sky-200', RUNNING: 'border-emerald-600/70 bg-emerald-950/30 text-emerald-200',
  CHECKPOINTED: 'border-amber-600/70 bg-amber-950/30 text-amber-200', PAUSED: 'border-violet-700/60 bg-violet-950/30 text-violet-200',
  BLOCKED: 'border-rose-700/60 bg-rose-950/30 text-rose-200', FAILED: 'border-rose-700/60 bg-rose-950/30 text-rose-200',
  COMPLETED: 'border-cyan-700/60 bg-cyan-950/30 text-cyan-200', UNVERIFIED: 'border-zinc-700 bg-zinc-900/70 text-zinc-400',
};

function WorkerCard({ worker, selected, onSelect }: { worker: WorkforceWorkerProjection; selected: boolean; onSelect: () => void; key?: string }) {
  return <button type="button" onClick={onSelect} aria-pressed={selected} className={`w-full rounded-lg border p-3 text-left ${stateTone[worker.state]} ${selected ? 'ring-2 ring-cyan-400/70' : ''}`} aria-label={`${worker.id} ${worker.state}`}>
    <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full bg-current ${worker.running ? 'animate-pulse' : ''}`} aria-hidden="true" /><span className="font-bold tracking-wide">{worker.id}</span></div><span className="text-[9px] font-black tracking-wider">{worker.state}</span></div>
    <div className="mt-2 text-[10px] font-bold leading-relaxed text-current/90">{worker.name}</div><div className="mt-1 text-[10px] leading-relaxed text-current/75">{worker.reason}</div>
    <div className="mt-2 space-y-0.5 text-[9px] text-current/65"><div>workId: {worker.workId || '—'}</div><div>stage: {worker.stage || '—'}</div><div>result: {worker.executionResult || '—'}</div><div>executor: {worker.executorObserved ? 'observed' : 'not observed'}</div><div>observed: {worker.observedAt || '—'}</div><div>dependencies: {worker.dependencies.length ? worker.dependencies.join(' · ') : 'none reported'}</div><div>evidence: {worker.evidenceRefs.length ? worker.evidenceRefs.join(' · ') : 'none reported'}</div></div>
  </button>;
}

export interface AgentVTWorkforceCommandCenterProps { authorization?: string; onShowToast?: (message: string) => void; }

export function AgentVTWorkforceCommandCenter({ authorization, onShowToast }: AgentVTWorkforceCommandCenterProps) {
  const [projection, setProjection] = useState<WorkforceProjection>(() => projectWorkforceSnapshot({ state: 'BLOCKED', reason: 'INITIAL_READBACK_NOT_ATTEMPTED' }));
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'workers' | 'prime' | 'collaboration' | 'approvals'>('workers');
  const [selectedWorkerId, setSelectedWorkerId] = useState('W00');
  const [authRequired, setAuthRequired] = useState(false);
  const toastRef = useRef(onShowToast);
  const refreshInFlightRef = useRef(false);
  useEffect(() => { toastRef.current = onShowToast; }, [onShowToast]);
  const refresh = useCallback(async () => {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    setIsLoading(true);
    try {
      const next = await fetchWorkforceSnapshot(fetch, authorization);
      setProjection(next);
      setAuthRequired(next.reason === 'POCKET_ID_BEARER_REQUIRED' || next.reason === 'POCKET_ID_OIDC_TOKEN_EXCHANGE_FAILED');
      toastRef.current?.(['AUTHENTICATED_READ_ONLY_OBSERVED', 'AUTHENTICATED_LOCAL_RUNTIME_OBSERVED'].includes(next.state)
        ? 'Runtime readback observed; canonical worker identity remains separately qualified.'
        : `Workforce readback: ${next.reason || next.state}`);
    } finally {
      refreshInFlightRef.current = false;
      setIsLoading(false);
    }
  }, [authorization]);
  useEffect(() => {
    void refresh();
    const intervalId = window.setInterval(() => { void refresh(); }, 2500);
    const onReconnect = () => { void refresh(); };
    window.addEventListener('online', onReconnect);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('online', onReconnect);
    };
  }, [refresh]);
  const counts = useMemo(() => projection.workers.reduce<Record<string, number>>((acc, worker) => { acc[worker.state] = (acc[worker.state] || 0) + 1; return acc; }, {}), [projection.workers]);
  const attentionCount = useMemo(() => projection.workers.filter((worker) => ['BLOCKED', 'FAILED', 'UNVERIFIED'].includes(worker.state)).length, [projection.workers]);
  const qualifiedCount = useMemo(() => projection.workers.filter((worker) => worker.verified && worker.receipt).length, [projection.workers]);
  const selectedWorker = projection.workers.find((worker) => worker.id === selectedWorkerId) || projection.workers[0];
  const connectionObserved = ['AUTHENTICATED_READ_ONLY_OBSERVED', 'AUTHENTICATED_LOCAL_RUNTIME_OBSERVED'].includes(projection.state);
  const viewEvents = view === 'prime' ? projection.primeEvents : view === 'collaboration' ? projection.collaborationEvents : projection.approvalsEvents;
  const eventTitle = (event: UnknownRecord): string => asText(event.title || event.type) || 'Event';
  const eventDescription = (event: UnknownRecord): string => [
    asText(event.description || event.detail || event.workId),
    asText(event.senderWorkerId) && asText(event.recipientWorkerId) ? `${asText(event.senderWorkerId)} → ${asText(event.recipientWorkerId)}` : null,
    asText(event.senderWorkId) && asText(event.recipientWorkId) ? `${asText(event.senderWorkId)} → ${asText(event.recipientWorkId)}` : null,
    asText(event.correlationId) ? `correlation ${asText(event.correlationId)}` : null,
    asText(event.deliveryStatus) ? `delivery ${asText(event.deliveryStatus)}` : null,
    asText(event.executionResult) ? `result ${asText(event.executionResult)}` : null,
    asText(event.failure) ? `error ${asText(event.failure)}` : null,
    asStringList(event.dependencies).length ? `dependencies ${asStringList(event.dependencies).join(', ')}` : null,
    asStringList(event.evidenceRefs || event.sourceRefs).length ? `evidence ${asStringList(event.evidenceRefs || event.sourceRefs).join(', ')}` : null,
  ].filter(Boolean).join(' · ') || 'No independently verified detail supplied.';

  const selectedWorkerFailure = selectedWorker?.error ? (typeof selectedWorker.error === 'string' ? selectedWorker.error : JSON.stringify(selectedWorker.error)) : null;
  return <div className="flex-grow overflow-y-auto bg-[#080b12] p-4 text-zinc-200 select-text"><div className="mx-auto max-w-7xl space-y-4">
    <header className="rounded-xl border border-cyan-800/70 bg-[#0d1522] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-cyan-300"><Activity size={18} aria-hidden="true" /><h1 className="text-sm font-black tracking-widest">AGENT VT WORKFORCE COMMAND CENTER</h1></div><p className="mt-2 max-w-3xl text-xs leading-relaxed text-zinc-400">Evidence-driven visibility into Agent Lee PRIME and W00–W17. This page is a read-only projection of the existing LeeWay Runtime boundary.</p></div><div className="text-right"><div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-black ${connectionObserved ? 'border-emerald-700 bg-emerald-950/50 text-emerald-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400'}`}><span className={`h-2 w-2 rounded-full ${connectionObserved ? 'bg-emerald-400' : 'bg-zinc-500'}`} />{connectionObserved ? 'READ-ONLY OBSERVED' : 'NOT CONNECTED'}</div><p className="mt-2 text-[10px] text-zinc-500">{connectionObserved ? 'Runtime evidence received; canonical identity and acceptance remain separate.' : 'No qualified worker telemetry received.'}</p></div></div></header>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Workforce summary"><div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3"><div className="text-[9px] uppercase text-zinc-500">Worker positions</div><div className="mt-1 text-sm font-black text-cyan-300">{WORKFORCE_WORKER_IDS.length}</div></div><div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3"><div className="text-[9px] uppercase text-zinc-500">Live provider-observed</div><div className="mt-1 text-sm font-black text-emerald-300">{counts.RUNNING || 0}</div></div><div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3"><div className="text-[9px] uppercase text-zinc-500">Queued jobs</div><div className="mt-1 text-sm font-black text-sky-300">{projection.queuedJobs ?? '—'}</div></div><div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3"><div className="text-[9px] uppercase text-zinc-500">Needs attention</div><div className="mt-1 text-sm font-black text-amber-300">{attentionCount}</div></div><div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3"><div className="text-[9px] uppercase text-zinc-500">Qualified outcomes</div><div className="mt-1 text-sm font-black text-violet-300">{qualifiedCount}</div></div></section>
    <nav className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/70 p-2" aria-label="Workforce views">{([['workers', '18 Workers'], ['prime', 'PRIME Activity'], ['collaboration', 'Collaboration'], ['approvals', 'Creator Approvals']] as const).map(([id, label]) => <button key={id} type="button" onClick={() => setView(id)} className={`rounded border px-3 py-1.5 text-[10px] font-bold ${view === id ? 'border-cyan-600 bg-cyan-950/70 text-cyan-200' : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200'}`}>{label}</button>)}<span className="flex-grow" /><button type="button" onClick={() => void refresh()} disabled={isLoading} className="flex items-center gap-2 rounded border border-cyan-700 bg-cyan-950/60 px-3 py-1.5 text-[10px] font-bold text-cyan-200 hover:bg-cyan-900/70 disabled:opacity-50"><RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />{isLoading ? 'READING…' : 'REFRESH NOW'}</button>{authRequired && <button type="button" onClick={() => window.location.assign('/api/auth/start')} className="rounded border border-amber-600 bg-amber-950/60 px-3 py-1.5 text-[10px] font-bold text-amber-200 hover:bg-amber-900/70">AUTHENTICATE WITH POCKET ID</button>}<button type="button" onClick={() => onShowToast?.('Caller-bound authorization is supplied by the approved host session; this page stores no token.')} className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-[10px] font-bold text-zinc-300">CONNECTION SETTINGS</button></nav>
    <section className="rounded-lg border border-amber-800/60 bg-amber-950/20 p-3 text-[11px] text-amber-100" role="status"><div className="flex items-start gap-2">{connectionObserved ? <ShieldCheck size={15} className="mt-0.5 shrink-0" /> : <AlertTriangle size={15} className="mt-0.5 shrink-0" />}<div><div className="font-bold">{projection.reason || 'No authoritative worker telemetry is connected. Worker statuses remain UNVERIFIED.'}</div><div className="mt-1 text-amber-200/70">transport={projection.transport || '—'} · discovery={projection.runtimeDiscovery} · worker identity={projection.authorityBoundary.canonicalWorkerIdentityVerified ? 'verified' : 'unbound'} · PRIME identity={projection.authorityBoundary.primeIdentityVerified ? 'verified' : 'unbound'} · acceptance={projection.authorityBoundary.canonicalAcceptance ? 'admitted' : 'not admitted'} · Formula={projection.formulaExecuted ? 'reported' : 'not executed'} · Veritas={projection.veritasAccepted ? 'reported' : 'not accepted'} · receipt={projection.receiptAdmitted ? 'reported' : 'not admitted'} · learning={projection.learningAdmitted ? 'reported' : 'not admitted'}</div></div></div></section>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.75fr)]"><section className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">{view === 'workers' ? <><h2 className="mb-3 flex items-center gap-2 text-sm font-black text-zinc-200"><CircleDashed size={14} /> Workforce roster <span className="text-[10px] font-normal text-zinc-500">· select a position</span></h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{projection.workers.map((worker) => <WorkerCard key={worker.id} worker={worker} selected={worker.id === selectedWorker?.id} onSelect={() => setSelectedWorkerId(worker.id)} />)}</div>{selectedWorker && <div className="mt-4 rounded-lg border border-cyan-900/70 bg-cyan-950/20 p-4"><div className="flex items-center justify-between gap-2"><strong className="text-sm text-cyan-200">{selectedWorker.id} — {selectedWorker.name}</strong><span className="rounded border border-zinc-700 px-2 py-1 text-[9px] font-black text-zinc-300">{selectedWorker.state}</span></div><div className="mt-3 grid gap-2 text-[10px] sm:grid-cols-2"><div><span className="text-zinc-500">Work ID</span><div>{selectedWorker.workId || 'No authenticated job record'}</div></div><div><span className="text-zinc-500">Engineering stage</span><div>{selectedWorker.stage || 'Unreported'}</div></div><div><span className="text-zinc-500">Execution result</span><div>{selectedWorker.executionResult || 'Unreported'}</div></div><div><span className="text-zinc-500">Dependencies</span><div>{selectedWorker.dependencies.length ? selectedWorker.dependencies.join(' · ') : 'None reported'}</div></div><div><span className="text-zinc-500">Evidence references</span><div className="break-all">{selectedWorker.evidenceRefs.length ? selectedWorker.evidenceRefs.join(' · ') : 'None reported'}</div></div><div><span className="text-zinc-500">Error</span><div className="break-all">{selectedWorkerFailure || 'None reported'}</div></div><div><span className="text-zinc-500">Last heartbeat</span><div>{selectedWorker.observedAt || 'Not observed'}</div></div><div><span className="text-zinc-500">Executor readback</span><div>{selectedWorker.executorObserved ? 'Observed by source' : 'Not independently observed'}</div></div><div><span className="text-zinc-500">Execution identity</span><div className="break-all">{selectedWorker.executionIdentity || 'Unreported'}</div></div><div><span className="text-zinc-500">Codex thread / session</span><div className="break-all">{selectedWorker.threadId || '—'} / {selectedWorker.sessionId || '—'}{selectedWorker.resumed ? ' · resumed' : ''}</div></div><div><span className="text-zinc-500">Recovery</span><div>{selectedWorker.resumed ? 'Resumed persisted thread' : 'Initial thread or no recovery observed'}</div></div><div><span className="text-zinc-500">Independent verification</span><div>{selectedWorker.verified ? 'Reported verified — inspect evidence' : 'Unverified'}</div></div><div><span className="text-zinc-500">Next authorized action</span><div>{selectedWorker.nextAction || 'Unreported'}</div></div></div></div>}</> : <><h2 className="text-sm font-black text-zinc-200">{view === 'prime' ? 'Agent Lee PRIME · management evidence' : view === 'collaboration' ? 'Cross-worker collaboration' : 'Creator authority queue'}</h2><p className="mt-2 text-[11px] leading-relaxed text-zinc-500">{view === 'prime' ? 'Only signed or otherwise authenticated management events should populate this view. Generic queue changes are not proof PRIME made a management decision.' : view === 'collaboration' ? 'Help requests and handoffs need actual sender, recipient, work ID, and source/receipt evidence.' : 'Approval requests are read-only here. A request cannot authorize itself or change a job just by appearing on this page.'}</p><div className="mt-4 space-y-2">{viewEvents.length ? viewEvents.slice(0, 50).map((event, index) => <div key={`${eventTitle(event)}-${index}`} className="rounded border border-zinc-800 bg-black/20 p-3 text-[10px]"><div className="font-bold text-cyan-300">{eventTitle(event)}</div><div className="mt-1 text-zinc-400">{eventDescription(event)}</div></div>) : <div className="rounded border border-dashed border-zinc-800 p-4 text-[11px] text-zinc-600">No authenticated {view} events received.</div>}</div></>}</section><aside className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4" aria-label="Runtime evidence feed"><h2 className="text-sm font-black text-zinc-200">Runtime evidence feed</h2><div className="mt-2 rounded border border-cyan-900/60 bg-cyan-950/20 p-3 text-[10px] leading-relaxed text-cyan-100/80">A queue record is not physical execution. A fresh worker heartbeat plus an authenticated executor event is required for <strong>RUNNING</strong>. Veritas and canonical receipt proof are required for <strong>QUALIFIED</strong>.</div><div className="mt-3 space-y-2">{projection.events.length ? projection.events.slice(0, 80).map((event, index) => <div key={`${eventTitle(event)}-${index}`} className="rounded border border-zinc-800 bg-black/20 p-3 text-[10px]"><div className="font-bold text-cyan-300">{eventTitle(event)}</div><div className="mt-1 text-zinc-400">{eventDescription(event)}</div></div>) : <div className="rounded border border-dashed border-zinc-800 p-4 text-[11px] text-zinc-600">No authenticated workforce evidence received.</div>}</div></aside></div>
    <footer className="flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-3 text-[10px] text-zinc-500"><span className="flex items-center gap-1"><Clock3 size={12} /> fetched {projection.fetchedAt}</span><span className="flex items-center gap-1"><CheckCircle2 size={12} /> no local dispatch authority</span><span className="flex items-center gap-1"><XCircle size={12} /> no worker evidence means no animation</span></footer>
  </div></div>;
}

export default AgentVTWorkforceCommandCenter;
