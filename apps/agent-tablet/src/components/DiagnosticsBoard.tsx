/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT.TABLET.DIAGNOSTICS
TAG: LEEWAY.TABLET.HARDWARE.HIERARCHY.V1
5WH:
WHAT = Present host diagnostics and an interactive schematic hierarchy in the existing Tablet surface.
WHY = Keep component inspection useful without inventing physical geometry or device authority.
WHO = LeeWay Tablet maintainers under Creator authorization.
WHERE = apps/agent-tablet/src/components/DiagnosticsBoard.tsx.
WHEN = 2026-11-26.
HOW = Bind the view to the existing normalized host snapshot and synchronize component selection with inspection.
LICENSE: Repository terms; no new license asserted.
*/

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Battery,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Eye,
  FileText,
  HardDrive,
  Layers,
  Network,
  RefreshCw,
  Search,
  Shield,
  Terminal,
  Thermometer,
  Usb,
  Zap
} from 'lucide-react';
import {
  isDiagnosticsSnapshot,
  type DiagnosticsCategory,
  type DiagnosticsComponent,
  type DiagnosticsMetric,
  type DiagnosticsSensor,
  type DiagnosticsSnapshot
} from '../diagnostics/contract';

type DiagnosticsSection = 'BOARD' | 'AGENTS' | 'BUS' | 'VERITAS' | 'PROBES' | 'SHELL' | 'SETUP';
type CollectionState = 'LOADING' | 'OBSERVED' | 'PARTIAL' | 'UNAVAILABLE' | 'BLOCKED';
type Sample = { observedAt: string; cpu: number | null; memory: number | null; disk: number | null };

const SECTIONS: Array<{ id: DiagnosticsSection; label: string; icon: typeof Activity }> = [
  { id: 'BOARD', label: 'BOARD', icon: Cpu },
  { id: 'AGENTS', label: 'AGENTS', icon: Zap },
  { id: 'BUS', label: 'BUS', icon: Network },
  { id: 'VERITAS', label: 'VERITAS', icon: Shield },
  { id: 'PROBES', label: 'PROBES', icon: Search },
  { id: 'SHELL', label: 'SHELL', icon: Terminal },
  { id: 'SETUP', label: 'SETUP', icon: Layers }
];

const CATEGORY_META: Record<DiagnosticsCategory, { label: string; icon: typeof Cpu }> = {
  processor: { label: 'PROCESSOR', icon: Cpu },
  memory: { label: 'MEMORY', icon: Database },
  graphics: { label: 'GRAPHICS', icon: Eye },
  storage: { label: 'STORAGE', icon: HardDrive },
  motherboard: { label: 'MOTHERBOARD', icon: Layers },
  firmware: { label: 'FIRMWARE', icon: FileText },
  battery: { label: 'BATTERY', icon: Battery },
  network: { label: 'NETWORK', icon: Network },
  usb: { label: 'USB CONTROLLER', icon: Usb },
  audio: { label: 'AUDIO', icon: Activity }
};

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let amount = value;
  let unitIndex = -1;
  do {
    amount /= 1024;
    unitIndex += 1;
  } while (amount >= 1024 && unitIndex < units.length - 1);
  return `${amount.toFixed(amount < 10 ? 2 : 1)} ${units[unitIndex]}`;
}

function formatMetric(metric: DiagnosticsMetric): string {
  if (metric.value === null) return 'UNAVAILABLE';
  if (metric.unit === 'bytes') return formatBytes(metric.value);
  if (metric.unit === 'seconds') {
    const hours = Math.floor(metric.value / 3600);
    const minutes = Math.floor((metric.value % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
  if (metric.unit === '°C') return `${metric.value.toFixed(1)} °C`;
  return `${metric.value.toFixed(1)}%`;
}

function formatTime(value: string | null | undefined): string {
  if (!value) return 'NOT OBSERVED';
  const time = new Date(value);
  return Number.isNaN(time.getTime()) ? 'TIME UNAVAILABLE' : time.toLocaleTimeString();
}

function statusColor(state: CollectionState | DiagnosticsSnapshot['state']): string {
  if (state === 'OBSERVED') return 'border-emerald-500/50 bg-emerald-950/50 text-emerald-200';
  if (state === 'PARTIAL') return 'border-amber-500/50 bg-amber-950/50 text-amber-200';
  if (state === 'BLOCKED') return 'border-rose-500/50 bg-rose-950/50 text-rose-200';
  return 'border-zinc-600 bg-zinc-900 text-zinc-300';
}

function MetricCard({
  label,
  metric,
  note,
  icon: Icon
}: {
  label: string;
  metric: DiagnosticsMetric;
  note?: string;
  icon: typeof Activity;
}) {
  const fill = metric.value === null ? 0 : Math.max(0, Math.min(100, metric.value));
  return (
    <article className="min-w-0 rounded-xl border border-cyan-950 bg-[#09121e] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-zinc-300">
          <Icon size={14} className="text-cyan-300" />
          {label}
        </div>
        <span className={`rounded border px-1.5 py-0.5 text-[8px] font-black ${metric.state === 'OBSERVED' ? statusColor('OBSERVED') : statusColor('UNAVAILABLE')}`}>
          {metric.state}
        </span>
      </div>
      <div className="mt-2 text-xl font-black text-white">{formatMetric(metric)}</div>
      <div className="mt-2 h-1.5 overflow-hidden rounded bg-zinc-800">
        {metric.value !== null && metric.unit === '%' && (
          <div className="h-full rounded bg-cyan-400 transition-[width]" style={{ width: `${fill}%` }} />
        )}
      </div>
      <p className="mt-2 text-[10px] leading-4 text-zinc-500">
        {note || metric.reason || `Source: ${metric.source}`}
      </p>
    </article>
  );
}

function EmptyAuthority({
  title,
  detail,
  state = 'UNBOUND'
}: {
  title: string;
  detail: string;
  state?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-800/60 bg-amber-950/15 p-4">
      <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-300" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-amber-100">{title}</h3>
          <span className="rounded border border-amber-800 px-1.5 py-0.5 text-[9px] font-black text-amber-300">{state}</span>
        </div>
        <p className="mt-1 text-xs leading-5 text-zinc-300">{detail}</p>
      </div>
    </div>
  );
}

function ComponentCard({
  item,
  selected,
  onSelect
}: {
  item: DiagnosticsComponent;
  selected: boolean;
  onSelect: () => void;
}) {
  const meta = CATEGORY_META[item.category];
  const Icon = meta.icon;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`min-w-0 rounded-xl border p-3 text-left transition-colors ${
        selected ? 'border-cyan-300 bg-cyan-950/40' : 'border-zinc-800 bg-black/25 hover:border-cyan-800'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[9px] font-black tracking-wider text-cyan-200">
          <Icon size={14} />
          {meta.label}
        </span>
        <span className="text-[8px] font-bold text-emerald-300">OBSERVED</span>
      </div>
      <div className="mt-2 truncate text-xs font-bold text-white" title={item.name}>{item.name}</div>
      <div className="mt-1 truncate text-[10px] text-zinc-400">
        {item.manufacturer || item.model || 'Manufacturer/model not reported'}
      </div>
    </button>
  );
}

function ComponentDetails({ item }: { item: DiagnosticsComponent | null }) {
  if (!item) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-black/20 p-5 text-center">
        <Search size={20} className="text-zinc-500" />
        <p className="mt-2 text-xs font-bold text-zinc-300">No component selected</p>
        <p className="mt-1 max-w-xs text-[10px] leading-4 text-zinc-500">
          The host adapter has not returned a component identity to inspect.
        </p>
      </div>
    );
  }
  return (
    <section className="rounded-xl border border-cyan-900/70 bg-[#09121e] p-4" aria-label="Selected component details">
      <div className="text-[9px] font-black tracking-[0.18em] text-cyan-300">{CATEGORY_META[item.category].label} INSPECTOR</div>
      <h3 className="mt-2 break-words text-base font-bold text-white">{item.name}</h3>
      <dl className="mt-4 space-y-2 text-xs">
        <div className="flex justify-between gap-3 border-b border-zinc-800 pb-2">
          <dt className="text-zinc-500">Reported manufacturer</dt>
          <dd className="max-w-[65%] break-words text-right text-zinc-200">{item.manufacturer || 'NOT REPORTED'}</dd>
        </div>
        <div className="flex justify-between gap-3 border-b border-zinc-800 pb-2">
          <dt className="text-zinc-500">Reported model</dt>
          <dd className="max-w-[65%] break-words text-right text-zinc-200">{item.model || 'NOT REPORTED'}</dd>
        </div>
        {item.details.map(detail => (
          <div key={detail.label} className="flex justify-between gap-3 border-b border-zinc-800 pb-2">
            <dt className="text-zinc-500">{detail.label}</dt>
            <dd className="max-w-[65%] break-words text-right text-zinc-200">
              {detail.label.toLowerCase().includes('bytes') ? formatBytes(Number(detail.value)) : detail.value}
            </dd>
          </div>
        ))}
        <div className="flex justify-between gap-3">
          <dt className="text-zinc-500">Observation source</dt>
          <dd className="text-right text-zinc-300">{item.source}</dd>
        </div>
      </dl>
      <div className="mt-4 rounded-lg border border-amber-900/70 bg-amber-950/20 p-2 text-[10px] leading-4 text-amber-100">
        Physical position, board coordinates, component connections, and manufacturer documentation are not verified by this host observation.
      </div>
      {item.category === 'graphics' && (
        <div className="mt-2 rounded-lg border border-zinc-800 bg-black/20 p-2 text-[10px] leading-4 text-zinc-400">
          Windows reports adapter memory through a legacy OS field; this value is not verified physical VRAM or current GPU memory usage.
        </div>
      )}
    </section>
  );
}

function samplePath(samples: Sample[], key: 'cpu' | 'memory' | 'disk'): string {
  const values = samples.map(sample => sample[key]).filter((value): value is number => value !== null);
  if (values.length < 2) return '';
  const min = Math.min(0, ...values);
  const max = Math.max(100, ...values);
  const range = Math.max(1, max - min);
  return values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * 600;
    const y = 110 - ((value - min) / range) * 100;
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

function SampleHistory({ samples }: { samples: Sample[] }) {
  if (samples.length < 2) {
    return (
      <div className="flex min-h-44 items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-black/20 px-4 text-center text-xs text-zinc-400">
        Collecting actual host samples. Trend lines appear after at least two observations.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#08111c] p-3">
      <div className="mb-2 flex flex-wrap gap-4 text-[10px] font-bold">
        <span className="text-cyan-300">CPU</span>
        <span className="text-emerald-300">MEMORY</span>
        <span className="text-amber-300">DISK</span>
        <span className="ml-auto text-zinc-500">SESSION-LOCAL · VOLATILE · {samples.length} SAMPLES</span>
      </div>
      <svg viewBox="0 0 600 120" className="h-40 w-full" role="img" aria-label="Session-local history of observed host metrics">
        {[25, 50, 75, 100].map(value => (
          <line key={value} x1="0" x2="600" y1={110 - value} y2={110 - value} stroke="#253244" strokeDasharray="3 5" />
        ))}
        <path d={samplePath(samples, 'cpu')} fill="none" stroke="#22d3ee" strokeWidth="2.5" />
        <path d={samplePath(samples, 'memory')} fill="none" stroke="#34d399" strokeWidth="2.5" />
        <path d={samplePath(samples, 'disk')} fill="none" stroke="#fbbf24" strokeWidth="2.5" />
      </svg>
      <p className="text-[10px] text-zinc-500">
        Samples exist only in this page session; no Continuum persistence or historical record is asserted.
      </p>
    </div>
  );
}

function SensorList({ sensors }: { sensors: DiagnosticsSensor[] }) {
  if (sensors.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-black/20 p-3 text-xs text-zinc-400">
        No supported hardware temperature sensor was returned. This is not a measured zero and is not a CPU/GPU temperature.
      </div>
    );
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {sensors.map(sensor => (
        <article key={sensor.id} className="rounded-lg border border-cyan-950 bg-black/25 p-3">
          <div className="flex items-center gap-2 text-[10px] text-zinc-400"><Thermometer size={14} />{sensor.label}</div>
          <div className="mt-2 text-lg font-black text-cyan-200">{sensor.value.toFixed(1)} °C</div>
          <div className="mt-1 text-[9px] text-zinc-500">{sensor.source} · {formatTime(sensor.observedAt)}</div>
        </article>
      ))}
    </div>
  );
}

type DiagnosticsHierarchyLevel = 'EXTERIOR' | 'ASSEMBLY' | 'MOTHERBOARD' | 'COMPONENT' | 'MANUFACTURER';

const HIERARCHY_LEVELS: Array<{ id: DiagnosticsHierarchyLevel; label: string }> = [
  { id: 'EXTERIOR', label: 'DEVICE EXTERIOR' },
  { id: 'ASSEMBLY', label: 'INTERNAL ASSEMBLY' },
  { id: 'MOTHERBOARD', label: 'MOTHERBOARD' },
  { id: 'COMPONENT', label: 'COMPONENT' },
  { id: 'MANUFACTURER', label: 'MANUFACTURER INTELLIGENCE' }
];

function HardwareHierarchy({
  snapshot,
  components,
  selectionId,
  selectedComponent,
  onSelectComponent
}: {
  snapshot: DiagnosticsSnapshot | null;
  components: DiagnosticsComponent[];
  selectionId: string | null;
  selectedComponent: DiagnosticsComponent | null;
  onSelectComponent: (component: DiagnosticsComponent) => void;
}) {
  const [activeLevel, setActiveLevel] = useState<DiagnosticsHierarchyLevel>('EXTERIOR');
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [exploded, setExploded] = useState(false);
  const motherboard = components.find(component => component.category === 'motherboard') || null;

  useEffect(() => {
    if (selectionId) setActiveLevel('COMPONENT');
  }, [selectionId]);

  const levels = [
    {
      id: 'EXTERIOR' as const,
      title: 'DEVICE EXTERIOR',
      value: snapshot?.device.model || 'HOST DEVICE',
      status: 'HOST MODEL REPORTED',
      note: 'Tablet host process observation; not a registered Device Bridge identity.'
    },
    {
      id: 'ASSEMBLY' as const,
      title: 'INTERNAL ASSEMBLY',
      value: `${components.length} HOST-REPORTED COMPONENT IDENTITIES`,
      status: 'SCHEMATIC ONLY',
      note: 'Schematic grouping only. Physical assembly and component positions are unknown.'
    },
    {
      id: 'MOTHERBOARD' as const,
      title: 'MOTHERBOARD',
      value: motherboard?.name || 'NOT REPORTED',
      status: 'GEOMETRY UNKNOWN',
      note: motherboard
        ? 'Identity reported by the host adapter; board geometry and component coordinates are unverified.'
        : 'No motherboard identity was returned by this host adapter.'
    },
    {
      id: 'COMPONENT' as const,
      title: 'COMPONENT',
      value: selectedComponent?.name || 'SELECT AN OBSERVED COMPONENT',
      status: 'POSITION UNKNOWN',
      note: selectedComponent
        ? `${CATEGORY_META[selectedComponent.category].label} · ${selectedComponent.source}`
        : 'No component identity is available to inspect.'
    },
    {
      id: 'MANUFACTURER' as const,
      title: 'MANUFACTURER INTELLIGENCE',
      value: selectedComponent?.manufacturer || 'NOT REPORTED',
      status: 'HOST-REPORTED',
      note: 'Host-reported identity only; no authenticated manufacturer knowledge source or documentation is connected.'
    }
  ];

  const rotate = (amount: number) => setRotation(current => (current + amount + 360) % 360);

  return (
    <section className="rounded-xl border border-cyan-950 bg-[#07101b] p-3" aria-label="Interactive hardware hierarchy schematic">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[9px] font-black tracking-[0.16em] text-cyan-200">SCHEMATIC VIEW · NO PHYSICAL PLACEMENT</div>
          <p className="mt-1 text-[9px] leading-4 text-zinc-500">
            Hierarchy follows observed identities only; cards and relationships are illustrative, not device geometry or wiring.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <button type="button" aria-label="Rotate schematic left" onClick={() => rotate(-15)} className="rounded border border-zinc-700 px-2 py-1 text-[9px] text-zinc-200 hover:border-cyan-700">
            ROTATE -15°
          </button>
          <button type="button" aria-label="Rotate schematic right" onClick={() => rotate(15)} className="rounded border border-zinc-700 px-2 py-1 text-[9px] text-zinc-200 hover:border-cyan-700">
            ROTATE +15°
          </button>
          <button type="button" aria-label="Zoom schematic out" onClick={() => setZoom(current => Math.max(0.8, Number((current - 0.1).toFixed(1))))} disabled={zoom <= 0.8} className="rounded border border-zinc-700 px-2 py-1 text-[9px] text-zinc-200 hover:border-cyan-700 disabled:opacity-40">
            ZOOM -
          </button>
          <button type="button" aria-label="Zoom schematic in" onClick={() => setZoom(current => Math.min(1.2, Number((current + 0.1).toFixed(1))))} disabled={zoom >= 1.2} className="rounded border border-zinc-700 px-2 py-1 text-[9px] text-zinc-200 hover:border-cyan-700 disabled:opacity-40">
            ZOOM +
          </button>
          <button type="button" aria-pressed={exploded} onClick={() => setExploded(value => !value)} className={`rounded border px-2 py-1 text-[9px] font-bold ${exploded ? 'border-cyan-500 bg-cyan-950/60 text-cyan-100' : 'border-zinc-700 text-zinc-200 hover:border-cyan-700'}`}>
            {exploded ? 'COLLAPSE' : 'EXPLODE SCHEMATIC'}
          </button>
          <span className="px-1 text-[8px] text-zinc-500">{rotation}° · {Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <nav className="mt-3 flex gap-1 overflow-x-auto pb-1" aria-label="Hardware hierarchy levels">
        {HIERARCHY_LEVELS.map(level => (
          <button
            type="button"
            key={level.id}
            aria-pressed={activeLevel === level.id}
            onClick={() => setActiveLevel(level.id)}
            className={`shrink-0 rounded border px-2 py-1.5 text-[8px] font-black tracking-wide ${
              activeLevel === level.id ? 'border-cyan-500 bg-cyan-950/60 text-cyan-100' : 'border-zinc-800 text-zinc-500 hover:border-cyan-900 hover:text-zinc-200'
            }`}
          >
            {level.label}
          </button>
        ))}
      </nav>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(210px,.7fr)]">
        <div className="overflow-hidden rounded-lg border border-cyan-950 bg-[radial-gradient(ellipse_at_center,_rgba(8,145,178,.12),_rgba(2,6,23,.95)_72%)] p-3" style={{ perspective: '900px' }}>
          <div
            className="mx-auto flex max-w-2xl flex-col transition-transform duration-300"
            style={{
              transform: `rotateX(5deg) rotateY(${rotation}deg) scale(${zoom})`,
              transformStyle: 'preserve-3d'
            }}
          >
            {levels.map((level, index) => (
              <div
                key={level.id}
                className={`transition-all duration-300 ${exploded ? 'mb-3' : 'mb-1'}`}
                style={{ transform: exploded ? `translateZ(${index * 14}px) translateY(${index * 2}px)` : 'translateZ(0px)' }}
              >
                <button
                  type="button"
                  aria-pressed={activeLevel === level.id}
                  onClick={() => setActiveLevel(level.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                    activeLevel === level.id ? 'border-cyan-500 bg-cyan-950/60 shadow-[0_0_18px_rgba(34,211,238,.1)]' : 'border-cyan-950 bg-[#09121e]/95 hover:border-cyan-800'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[8px] font-black tracking-[0.12em] text-cyan-200">{level.title}</span>
                    <span className="text-[8px] font-bold text-amber-300">{level.status}</span>
                  </div>
                  <div className="mt-1 break-words text-[10px] font-bold text-white">{level.value}</div>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 rounded-lg border border-zinc-800 bg-black/20 p-3" aria-live="polite">
          <div className="text-[8px] font-black tracking-[0.15em] text-cyan-200">HIERARCHY INSPECTOR · {activeLevel}</div>
          <div className="mt-2 break-words text-xs font-bold text-white">{levels.find(level => level.id === activeLevel)?.value}</div>
          <p className="mt-1 text-[9px] leading-4 text-zinc-400">{levels.find(level => level.id === activeLevel)?.note}</p>

          {activeLevel === 'COMPONENT' && (
            <div className="mt-3 max-h-40 space-y-1 overflow-y-auto" aria-label="Observed components in schematic">
              {components.length ? components.map(component => (
                <button
                  type="button"
                  key={component.id}
                  aria-label={`Select ${component.name} in schematic`}
                  aria-pressed={selectedComponent?.id === component.id}
                  onClick={() => onSelectComponent(component)}
                  className={`w-full rounded border px-2 py-1.5 text-left text-[9px] ${
                    selectedComponent?.id === component.id ? 'border-cyan-500 bg-cyan-950/60 text-white' : 'border-zinc-800 text-zinc-300 hover:border-cyan-900'
                  }`}
                >
                  <span className="font-bold">{component.name}</span>
                  <span className="ml-2 text-[8px] text-zinc-500">{CATEGORY_META[component.category].label} · position unknown</span>
                </button>
              )) : (
                <p className="rounded border border-dashed border-zinc-800 p-2 text-[9px] text-zinc-500">
                  No component identities were observed; this does not mean the host contains no hardware.
                </p>
              )}
            </div>
          )}

          {activeLevel === 'MANUFACTURER' && (
            <div className="mt-3 space-y-1 rounded border border-zinc-800 bg-[#09121e] p-2 text-[9px]">
              <div className="flex justify-between gap-2"><span className="text-zinc-500">Reported manufacturer</span><span className="text-right text-zinc-200">{selectedComponent?.manufacturer || 'NOT REPORTED'}</span></div>
              <div className="flex justify-between gap-2"><span className="text-zinc-500">Reported model</span><span className="text-right text-zinc-200">{selectedComponent?.model || 'NOT REPORTED'}</span></div>
              <div className="flex justify-between gap-2"><span className="text-zinc-500">Documentation</span><span className="text-right text-amber-300">NOT CONNECTED</span></div>
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 text-[8px] leading-4 text-zinc-500">
        Rotation, zoom, and exploded view change only this schematic display. They do not inspect or control device hardware.
      </p>
    </section>
  );
}

export function DiagnosticsBoard() {
  const [snapshot, setSnapshot] = useState<DiagnosticsSnapshot | null>(null);
  const [collectionState, setCollectionState] = useState<CollectionState>('LOADING');
  const [failureCode, setFailureCode] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<DiagnosticsSection>('BOARD');
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const requestInFlight = useRef(false);

  const refreshSnapshot = useCallback(async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setRefreshing(true);
    try {
      const response = await fetch('/api/diagnostics/snapshot', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        credentials: 'same-origin'
      });
      if (!response.ok) {
        let errorCode = `HTTP_${response.status}`;
        try {
          const errorBody: unknown = await response.json();
          if (errorBody && typeof errorBody === 'object' && 'error' in errorBody && typeof errorBody.error === 'string') {
            errorCode = errorBody.error;
          }
        } catch {
          errorCode = `HTTP_${response.status}`;
        }
        throw new Error(errorCode);
      }
      const payload: unknown = await response.json();
      if (!isDiagnosticsSnapshot(payload)) throw new Error('INVALID_DIAGNOSTICS_RESPONSE');
      setSnapshot(payload);
      setCollectionState(payload.state);
      setFailureCode(payload.errors[0] || null);
      setSamples(previous => {
        if (previous.at(-1)?.observedAt === payload.observedAt) return previous;
        return [...previous, {
          observedAt: payload.observedAt,
          cpu: payload.telemetry.cpu,
          memory: payload.telemetry.ram,
          disk: payload.telemetry.disk
        }].slice(-60);
      });
    } catch (error) {
      const code = error instanceof Error ? error.message : 'DIAGNOSTICS_REQUEST_FAILED';
      setFailureCode(code);
      setCollectionState(code === 'LOCAL_HOST_DIAGNOSTICS_ONLY' ? 'BLOCKED' : 'UNAVAILABLE');
    } finally {
      requestInFlight.current = false;
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refreshSnapshot();
    const intervalId = window.setInterval(() => {
      if (!document.hidden) void refreshSnapshot();
    }, 5000);
    const onFocus = () => void refreshSnapshot();
    const onVisibilityChange = () => {
      if (!document.hidden) void refreshSnapshot();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [refreshSnapshot]);

  const selectedComponent =
    snapshot?.components.find(component => component.id === selectedComponentId)
    || snapshot?.components[0]
    || null;
  const allComponents = snapshot?.components || [];
  const busComponents = allComponents.filter(component =>
    ['network', 'usb', 'audio', 'storage', 'graphics'].includes(component.category)
  );
  const currentState = collectionState;
  const snapshotUnavailable = !snapshot || snapshot.state === 'UNAVAILABLE';
  const latestReadbackFailed = collectionState === 'BLOCKED'
    || (collectionState === 'UNAVAILABLE' && !snapshotUnavailable);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#050a12] text-zinc-100" aria-label="LeeWay Diagnostics">
      <header className="shrink-0 border-b border-cyan-950 bg-[#0b1421]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-lg border border-cyan-800 bg-cyan-950/50 p-2 text-cyan-200"><Activity size={19} /></div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-black tracking-[0.14em] text-white sm:text-base">LEEWAY DIAGNOSTICS MATRIX</h1>
              <p className="mt-1 text-[10px] text-zinc-400">Host observation · hardware inventory · evidence boundaries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded border px-2 py-1 text-[9px] font-black tracking-wider ${statusColor(currentState)}`} role="status">
              {currentState}
            </span>
            <button
              type="button"
              onClick={() => void refreshSnapshot()}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-800 bg-cyan-950/40 px-2.5 py-1.5 text-[10px] font-bold text-cyan-100 hover:bg-cyan-900/60 disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              REFRESH
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Diagnostics sections">
          {SECTIONS.map(section => {
            const Icon = section.icon;
            const selected = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                aria-current={selected ? 'page' : undefined}
                onClick={() => setActiveSection(section.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[9px] font-black tracking-wider ${
                  selected ? 'border-cyan-500 bg-cyan-950/60 text-cyan-100' : 'border-transparent text-zinc-500 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <Icon size={12} />{section.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
        {(snapshotUnavailable || latestReadbackFailed) && (
          <div className="mb-3 rounded-lg border border-amber-800/60 bg-amber-950/20 p-3 text-xs text-amber-100" role="alert">
            {latestReadbackFailed
              ? `The latest readback failed${failureCode ? `: ${failureCode}` : ''}. Values below, if present, are from the last successful observation at ${formatTime(snapshot?.observedAt)}.`
              : failureCode
                ? `No usable host observations were returned: ${failureCode}.`
                : 'Host observations are not available; waiting for the local diagnostics adapter.'}
          </div>
        )}
        {snapshot?.errors.length ? (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-800/60 bg-amber-950/20 p-3 text-xs text-amber-100" role="status">
            <AlertTriangle size={14} /> Partial adapter coverage: {snapshot.errors.join(', ')}
          </div>
        ) : null}

        {activeSection === 'BOARD' && (
          <div className="flex flex-col gap-4">
            <section className="order-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Live host measurements">
              <MetricCard
                label={snapshot?.telemetry.cpuMeaning === 'NORMALIZED_LOAD' ? 'CPU LOAD' : 'CPU UTILIZATION'}
                metric={snapshot?.metrics.cpu || unavailableMetric('%', 'Waiting for host observation.')}
                note={snapshot?.telemetry.cpuMeaning === 'NORMALIZED_LOAD' ? 'Normalized one-minute OS load per logical CPU; not instantaneous utilization.' : undefined}
                icon={Cpu}
              />
              <MetricCard label="SYSTEM MEMORY" metric={snapshot?.metrics.memory || unavailableMetric('%', 'Waiting for host observation.')} icon={Database} />
              <MetricCard label="STORAGE USED" metric={snapshot?.metrics.disk || unavailableMetric('%', 'Storage usage is not reported by this adapter.')} icon={HardDrive} />
              <MetricCard label="PACKAGE TEMPERATURE" metric={snapshot?.metrics.temperature || unavailableMetric('°C', 'No package-level sensor is bound.')} icon={Thermometer} />
            </section>

            <section className="order-1 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.8fr)]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-cyan-950 bg-[#08111c] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xs font-black tracking-[0.12em] text-white">HARDWARE HIERARCHY · DEVICE SCHEMATIC</h2>
                      <p className="mt-1 text-[10px] text-zinc-500">
                        Host-reported identities · schematic only · original physical geometry is not available
                      </p>
                    </div>
                    <span className="rounded border border-amber-800 bg-amber-950/30 px-2 py-1 text-[8px] font-black text-amber-200">
                      PHYSICAL MODEL UNAVAILABLE
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(250px,.8fr)]">
                    <HardwareHierarchy
                      snapshot={snapshot}
                      components={allComponents}
                      selectionId={selectedComponentId}
                      selectedComponent={selectedComponent}
                      onSelectComponent={component => setSelectedComponentId(component.id)}
                    />

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
                          <div className="text-[9px] font-bold text-zinc-500">SYSTEM MANUFACTURER</div>
                          <div className="mt-2 break-words text-xs font-bold text-white">{snapshot?.device.manufacturer || 'NOT REPORTED'}</div>
                        </div>
                        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
                          <div className="text-[9px] font-bold text-zinc-500">SYSTEM MODEL</div>
                          <div className="mt-2 break-words text-xs font-bold text-white">{snapshot?.device.model || 'NOT REPORTED'}</div>
                        </div>
                        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
                          <div className="text-[9px] font-bold text-zinc-500">OPERATING SYSTEM</div>
                          <div className="mt-2 break-words text-xs font-bold text-white">{snapshot?.platform.name || 'NOT OBSERVED'}</div>
                          <div className="mt-1 text-[9px] text-zinc-500">{snapshot?.platform.release} · {snapshot?.platform.architecture}</div>
                        </div>
                        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
                          <div className="text-[9px] font-bold text-zinc-500">DEVICE ENROLLMENT</div>
                          <div className="mt-2 text-xs font-black text-amber-300">{snapshot?.device.enrollment || 'UNVERIFIED'}</div>
                          <div className="mt-1 text-[9px] text-zinc-500">Host process is not Device Bridge identity.</div>
                        </div>
                      </div>
                      <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-bold tracking-wider text-zinc-400">OBSERVATION SOURCE</span>
                          <span className="text-[9px] font-black text-cyan-200">{snapshot?.source || 'UNBOUND'}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-500">
                          <Clock size={12} /> Collected {formatTime(snapshot?.observedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <section className="rounded-2xl border border-zinc-800 bg-[#08111c] p-4" aria-label="Observed hardware components">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-xs font-black tracking-wider text-white">COMPONENT INVENTORY</h2>
                      <p className="mt-1 text-[10px] text-zinc-500">Reported identities only · select a component for available details</p>
                    </div>
                    <span className="text-[9px] font-bold text-zinc-500">{allComponents.length} OBSERVED</span>
                  </div>
                  {allComponents.length ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {allComponents.map(component => (
                        <React.Fragment key={component.id}>
                          <ComponentCard
                            item={component}
                            selected={selectedComponent?.id === component.id}
                            onSelect={() => setSelectedComponentId(component.id)}
                          />
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-lg border border-dashed border-zinc-700 p-4 text-xs text-zinc-400">
                      No component identities were returned. This does not mean the device contains no hardware.
                    </div>
                  )}
                </section>
              </div>
              <ComponentDetails item={selectedComponent} />
            </section>

            <section className="order-3 rounded-2xl border border-zinc-800 bg-[#08111c] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Thermometer size={15} className="text-rose-300" />
                <h2 className="text-xs font-black tracking-wider text-white">THERMAL OBSERVATIONS</h2>
              </div>
              <SensorList sensors={snapshot?.sensors || []} />
              <p className="mt-2 text-[9px] text-zinc-500">ACPI zone values are not relabeled as CPU/GPU package temperatures.</p>
            </section>
          </div>
        )}

        {activeSection === 'AGENTS' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-cyan-950 bg-[#08111c] p-4">
              <h2 className="text-sm font-black text-white">AGENT LEE · HARDWARE AWARENESS</h2>
              <p className="mt-2 max-w-3xl text-xs leading-5 text-zinc-400">
                This Tablet can present the host observations returned below. It does not claim that a Runtime worker, model, GPU inference provider, or Agent Lee hardware-awareness session is connected.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard label="TABLET PROCESS MEMORY" metric={snapshot?.metrics.processRss || unavailableMetric('bytes', 'Waiting for process observation.')} icon={Database} />
              <MetricCard label="TABLET PROCESS HEAP" metric={snapshot?.metrics.processHeap || unavailableMetric('bytes', 'Waiting for process observation.')} icon={Activity} />
              <MetricCard label="TABLET PROCESS UPTIME" metric={snapshot?.metrics.uptime || unavailableMetric('seconds', 'Waiting for process observation.')} icon={Clock} />
              <div className="rounded-xl border border-zinc-800 bg-[#09121e] p-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-300"><Zap size={14} className="text-amber-300" /> MODEL / ACCELERATOR</div>
                <p className="mt-3 text-xs font-black text-amber-200">RUNTIME EVIDENCE NOT BOUND</p>
                <p className="mt-2 text-[10px] leading-4 text-zinc-500">GPU presence alone does not establish active model identity, inference, memory use, or acceleration.</p>
              </div>
            </div>
            <EmptyAuthority
              title="Runtime agent state is not connected"
              state={snapshot?.capabilities.runtimeAgentEvidence || 'UNBOUND'}
              detail="No authenticated Runtime assignment, agent execution event, Model Hub inference record, or skill invocation evidence is present in the host diagnostics response."
            />
          </div>
        )}

        {activeSection === 'BUS' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-cyan-950 bg-[#08111c] p-4">
              <h2 className="text-sm font-black text-white">BUS CONDUIT · REPORTED INTERFACES</h2>
              <p className="mt-1 text-xs text-zinc-500">Adapter inventory is not proof of a physical connection path or live bus traffic.</p>
            </div>
            <EmptyAuthority
              title="Communication topology is unavailable"
              state={snapshot?.capabilities.busTopology || 'UNAVAILABLE'}
              detail="The current OS observer can list selected device classes, but no authorized bus-topology provider supplies verified PCIe lanes, USB port paths, link state, or traffic measurements."
            />
            {busComponents.length ? (
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {busComponents.map(component => (
                  <React.Fragment key={component.id}>
                    <ComponentCard item={component} selected={selectedComponent?.id === component.id} onSelect={() => setSelectedComponentId(component.id)} />
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-700 p-4 text-xs text-zinc-400">
                No network, USB, audio, graphics, or storage identities were reported by this adapter.
              </div>
            )}
          </div>
        )}

        {activeSection === 'VERITAS' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-cyan-950 bg-[#08111c] p-4">
              <h2 className="text-sm font-black text-white">VERITAS · EVIDENCE REVIEW</h2>
              <p className="mt-1 text-xs text-zinc-500">Source collection and independent evaluation remain separate authorities.</p>
            </div>
            <EmptyAuthority
              title="Independent Veritas decision not provided"
              state={snapshot?.capabilities.independentVeritas || 'NOT_PROVIDED'}
              detail="The host snapshot contains measurements only. No independent verifier result, decision owner, signed review, or evidence receipt is represented as PASS."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 bg-[#09121e] p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-200"><CheckCircle size={15} className="text-cyan-300" /> SOURCE OBSERVATION</div>
                <p className="mt-2 text-[10px] leading-4 text-zinc-500">{snapshot?.source || 'No source observation returned.'} · {formatTime(snapshot?.observedAt)}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-[#09121e] p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-200"><FileText size={15} className="text-amber-300" /> RECEIPT CUSTODY</div>
                <p className="mt-2 text-[10px] leading-4 text-zinc-500">{snapshot?.capabilities.receiptAuthority || 'NOT_PROVIDED'} · No receipt was created or asserted by this page.</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'PROBES' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cyan-950 bg-[#08111c] p-4">
              <div>
                <h2 className="text-sm font-black text-white">READ-ONLY HOST PROBES</h2>
                <p className="mt-1 text-xs text-zinc-500">Refresh collects adapter-supported observations; no stress test or corrective operation is run.</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-400"><Clock size={12} /> Last sample {formatTime(snapshot?.observedAt)}</div>
            </div>
            <SampleHistory samples={samples} />
            <div className="grid gap-3 xl:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 bg-[#09121e] p-4">
                <h3 className="mb-3 text-xs font-black tracking-wider text-white">SUPPORTED SENSOR READBACK</h3>
                <SensorList sensors={snapshot?.sensors || []} />
              </div>
              <EmptyAuthority
                title="Active stress / repair probes are not enabled"
                state="OWNER-AUTHORIZED OPERATION REQUIRED"
                detail="Temperature stress, benchmarks, hardware writes, driver changes, shell commands, and repairs are not initiated by this diagnostics view. Use their existing authorized Runtime and Device Bridge flows."
              />
            </div>
          </div>
        )}

        {activeSection === 'SHELL' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-cyan-950 bg-[#08111c] p-4">
              <h2 className="text-sm font-black text-white">SHELL · CONTROL BOUNDARY</h2>
              <p className="mt-1 text-xs text-zinc-500">Diagnostics is an observation surface, not a local command executor.</p>
            </div>
            <EmptyAuthority
              title="No shell command is executed here"
              state="RUNTIME / DEVICE BRIDGE AUTHORITY REQUIRED"
              detail="Opening Diagnostics never launches a process or changes device state. Shell, driver, stress-test, and repair requests must use their existing owner-authorized Runtime and Device Bridge operations with fresh scope and readback."
            />
          </div>
        )}

        {activeSection === 'SETUP' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-cyan-950 bg-[#08111c] p-4">
              <h2 className="text-sm font-black text-white">DEVICE SETUP · ADAPTER STATUS</h2>
              <p className="mt-1 text-xs text-zinc-500">The host process can observe its operating system; registered device identity requires the existing enrollment authority.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 bg-[#09121e] p-4">
                <h3 className="text-xs font-black text-zinc-200">HOST ADAPTER</h3>
                <p className="mt-2 text-xs text-cyan-200">{snapshot?.source || 'NOT CONNECTED'}</p>
                <p className="mt-2 text-[10px] text-zinc-500">{snapshot?.platform.name || 'Operating system not observed'} · {snapshot?.platform.architecture || 'architecture unavailable'}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-[#09121e] p-4">
                <h3 className="text-xs font-black text-zinc-200">DEVICE BRIDGE ENROLLMENT</h3>
                <p className="mt-2 text-xs font-black text-amber-200">{snapshot?.device.enrollment || 'UNVERIFIED'}</p>
                <p className="mt-2 text-[10px] leading-4 text-zinc-500">No local URL, browser cookie, or host model is used as proof of enrollment.</p>
              </div>
            </div>
            <EmptyAuthority
              title="Device registration and cross-platform qualification are not verified"
              state={snapshot?.capabilities.deviceBridgeEnrollment || 'UNVERIFIED'}
              detail="Windows observations are collected through the host OS adapter. Linux and macOS have a limited Node OS adapter. Android/iOS device sensors and registration require their native, permissioned Device Bridge adapters; those platforms are not claimed as qualified."
            />
          </div>
        )}

        <footer className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 pt-3 text-[9px] text-zinc-500">
          <span>READ-ONLY HOST OBSERVATIONS · {snapshot?.source || 'SOURCE UNAVAILABLE'}</span>
          <span>LAST READBACK: {formatTime(snapshot?.observedAt)}</span>
        </footer>
      </main>
    </div>
  );
}

function unavailableMetric(unit: DiagnosticsMetric['unit'], reason: string): DiagnosticsMetric {
  return { value: null, unit, state: 'UNAVAILABLE', source: 'NOT_OBSERVED', reason };
}
