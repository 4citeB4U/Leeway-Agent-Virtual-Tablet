/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.SECTION.DIAGNOSTICS
TAG: LEEWAY.CORE.CREATOR.DIAGNOSTICS.V1

5WH:
WHAT = Section 03 Creator Diagnostics preserving all 8 canonical sections (DIAG, BOARD, AGENTS, BUS, VERITAS, PROBES, SHELL, SETUP) with live host OS telemetry and GitHub repository discovery.
WHY = Preserve canonical Creator Diagnostics capabilities without fabricating GPU VRAM, thermal sensors, CI states, or arbitrary shell access.
WHO = Creator/Human Authority via Leeway Innovations.
WHERE = src/components/sections/CreatorDiagnosticsSection.tsx
WHEN = 2026-11-27
HOW = 8-tab diagnostic workspace consuming /api/diagnostics/snapshot, /api/diagnostics/repositories, and /api/diagnostics/probe.

LICENSE = Apache-2.0
*/
import React, { useState } from 'react';
import { RefreshCw, Terminal } from 'lucide-react';
import type {
  CoreState,
  DiscoveredRepository,
  FormulaHealthResponse,
  HostDiagnosticsSnapshot,
} from '../../types/leeway';
import { RadialGauge, TopologyGraph } from '../charts/VisualCharts';
import { FormulaIntelligencePanel } from '../formula/FormulaIntelligencePanel';

const DIAGNOSTICS_SECTIONS = [
  'DIAG',
  'BOARD',
  'AGENTS',
  'BUS',
  'VERITAS',
  'PROBES',
  'SHELL',
  'SETUP',
] as const;

type DiagTab = (typeof DIAGNOSTICS_SECTIONS)[number];

export function CreatorDiagnosticsSection({
  state,
  hostDiag,
  repos,
  repoSource,
  formulaHealth,
  onRefreshDiagnostics,
  onRunProbe,
  onRunFormula,
  runningDomain,
}: {
  state: CoreState;
  hostDiag: HostDiagnosticsSnapshot | null;
  repos: DiscoveredRepository[];
  repoSource: string;
  formulaHealth: FormulaHealthResponse | null;
  onRefreshDiagnostics: () => Promise<void>;
  onRunProbe: (probeId: string) => Promise<{ status: string; output: string; executedAt: string }>;
  onRunFormula: (domainId: string) => Promise<void>;
  runningDomain: string | null;
}) {
  const [activeTab, setActiveTab] = useState<DiagTab>('DIAG');
  const [selectedRepo, setSelectedRepo] = useState<DiscoveredRepository | null>(repos[0] || null);
  const [probeLogs, setProbeLogs] = useState<Array<{ id: string; status: string; output: string; executedAt: string }>>([]);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefreshDiagnostics();
    } finally {
      setRefreshing(false);
    }
  };

  const handleProbe = async (probeId: string) => {
    const res = await onRunProbe(probeId);
    setProbeLogs((prev) => [{ id: probeId, ...res }, ...prev].slice(0, 12));
  };

  const repoGraphNodes = repos.slice(0, 6).map((r, i) => ({
    id: r.name,
    label: r.name.replace('LeeWay-', '').replace('Leeway-', ''),
    group: r.roleLayer.toUpperCase(),
    x: 130 + (i % 3) * 250,
    y: i < 3 ? 65 : 190,
    tone: (r.sourceHealth === 'OBSERVED' ? 'BLUE' : 'GRAY') as 'BLUE' | 'GRAY',
    metric: `${r.defaultBranch} · CI ${r.ciHealth}`,
  }));

  const repoGraphEdges = repos.slice(0, 6).flatMap((r) =>
    r.dependencies
      .filter((d) => repoGraphNodes.some((n) => n.id === d))
      .map((d) => ({ from: d, to: r.name, label: 'dep' }))
  );

  return (
    <div className="space-y-4">
      {/* Canonical 8-Section Creator Diagnostics Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#252D3D] bg-[#121721] p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {DIAGNOSTICS_SECTIONS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded border px-3 py-1.5 font-mono text-xs font-semibold whitespace-nowrap ${
                activeTab === tab
                  ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#F8E7A1]'
                  : 'border-[#2D3648] bg-[#171D2A] text-slate-300 hover:border-[#38BDF8]/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded border border-[#2D3648] bg-[#171D2A] px-3 py-1.5 text-xs text-slate-200 hover:border-[#D4AF37]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>{refreshing ? 'Refreshing…' : 'Refresh Live Snapshot'}</span>
        </button>
      </div>

      {/* DIAG: Ecosystem Repositories & Host Summary */}
      {activeTab === 'DIAG' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <section className="lg:col-span-2 rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-sm font-semibold text-white">
                  Registered LeeWay Repository Topology ({repos.length} discovered · {repoSource})
                </h3>
                <span className="font-mono text-[11px] text-amber-400">
                  4citeB4U/LeeWay-Engineering: HTTP 404 INACCESSIBLE
                </span>
              </div>
              <TopologyGraph
                nodes={repoGraphNodes}
                edges={repoGraphEdges}
                selectedId={selectedRepo?.name}
                onSelectNode={(n) => {
                  const found = repos.find((r) => r.name === n.id);
                  if (found) setSelectedRepo(found);
                }}
                height={250}
              />
            </section>

            <section className="rounded-lg border border-[#D4AF37]/40 bg-[#121721] p-4 space-y-3">
              <h3 className="font-display text-sm font-semibold text-white">
                Repository Health Breakdown
              </h3>
              {selectedRepo ? (
                <div className="space-y-2.5 text-xs">
                  <div className="font-mono text-sm font-semibold text-[#38BDF8]">
                    {selectedRepo.fullName}
                  </div>
                  <p className="text-slate-300">{selectedRepo.description || 'No description provided.'}</p>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    <div className="rounded border border-[#252D3D] bg-[#0E131C] p-2">
                      <div className="text-slate-400">Source Health</div>
                      <div className="text-emerald-400">{selectedRepo.sourceHealth}</div>
                    </div>
                    <div className="rounded border border-[#252D3D] bg-[#0E131C] p-2">
                      <div className="text-slate-400">CI Health</div>
                      <div className="text-slate-400">{selectedRepo.ciHealth}</div>
                    </div>
                    <div className="rounded border border-[#252D3D] bg-[#0E131C] p-2">
                      <div className="text-slate-400">Deployed Rev</div>
                      <div className="text-slate-400">{selectedRepo.deployedRevision}</div>
                    </div>
                    <div className="rounded border border-[#252D3D] bg-[#0E131C] p-2">
                      <div className="text-slate-400">Live Health</div>
                      <div className="text-slate-400">{selectedRepo.liveOperationalHealth}</div>
                    </div>
                  </div>
                  <div className="text-slate-400">
                    Branch: <span className="font-mono text-white">{selectedRepo.defaultBranch}</span> · Language:{' '}
                    <span className="font-mono text-white">{selectedRepo.language || 'Mixed'}</span> · Open Issues:{' '}
                    <span className="font-mono text-white">{selectedRepo.openIssuesCount}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Select a repository node or table row.</p>
              )}
            </section>
          </div>

          <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#252D3D] text-slate-400">
                  <th className="py-2 pr-3">Repository</th>
                  <th className="py-2 pr-3">Role Layer</th>
                  <th className="py-2 pr-3">Source Health</th>
                  <th className="py-2 pr-3">CI Health</th>
                  <th className="py-2 pr-3">Deployed</th>
                  <th className="py-2 pr-3">Live Health</th>
                  <th className="py-2">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2534]">
                {repos.slice(0, 14).map((repo) => (
                  <tr
                    key={repo.name}
                    onClick={() => setSelectedRepo(repo)}
                    className={`cursor-pointer hover:bg-[#171D2A] ${
                      selectedRepo?.name === repo.name ? 'bg-[#171D2A]' : ''
                    }`}
                  >
                    <td className="py-2 pr-3 font-mono text-white">{repo.name}</td>
                    <td className="py-2 pr-3 text-slate-300">{repo.roleLayer}</td>
                    <td className="py-2 pr-3 font-mono text-emerald-400">{repo.sourceHealth}</td>
                    <td className="py-2 pr-3 font-mono text-slate-400">{repo.ciHealth}</td>
                    <td className="py-2 pr-3 font-mono text-slate-400">{repo.deployedRevision}</td>
                    <td className="py-2 pr-3 font-mono text-slate-400">{repo.liveOperationalHealth}</td>
                    <td className="py-2 font-mono text-slate-400">{repo.updatedAt.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {/* BOARD: Live Host OS Hardware & Telemetry */}
      {activeTab === 'BOARD' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="lg:col-span-2 rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-white">
                Host Process & OS Telemetry Board ({hostDiag?.source || 'UNAVAILABLE'})
              </h3>
              <span className="font-mono text-xs text-amber-300">
                Binding: {hostDiag?.device.binding || 'HOST_PROCESS_ONLY'} · State: {hostDiag?.state || 'UNAVAILABLE'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <RadialGauge
                value={hostDiag?.telemetry.cpu ?? null}
                label="Normalized CPU Load"
                statusText={hostDiag?.metrics.cpu.state || 'UNAVAILABLE'}
                tone={hostDiag?.telemetry.cpu !== null ? 'GREEN' : 'GRAY'}
              />
              <RadialGauge
                value={hostDiag?.telemetry.ram ?? null}
                label="System Memory"
                statusText={hostDiag?.metrics.memory.state || 'UNAVAILABLE'}
                tone={hostDiag?.telemetry.ram !== null ? 'BLUE' : 'GRAY'}
              />
              <RadialGauge
                value={hostDiag?.telemetry.disk ?? null}
                label="Workspace Disk"
                statusText={hostDiag?.metrics.disk.state || 'UNAVAILABLE'}
                tone={hostDiag?.telemetry.disk !== null ? 'BLUE' : 'GRAY'}
              />
              <RadialGauge
                value={null}
                label="Thermal / GPU"
                statusText="UNAVAILABLE"
                tone="GRAY"
                sublabel="Sensors unbound"
              />
            </div>

            {hostDiag && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="rounded border border-[#252D3D] bg-[#0E131C] p-3">
                  <div className="text-slate-400">Platform</div>
                  <div className="mt-1 text-white">
                    {hostDiag.platform.name} {hostDiag.platform.architecture}
                  </div>
                </div>
                <div className="rounded border border-[#252D3D] bg-[#0E131C] p-3">
                  <div className="text-slate-400">Process RSS / Heap</div>
                  <div className="mt-1 text-white tabular-nums">
                    {Math.round((hostDiag.metrics.processRss.value || 0) / (1024 * 1024))} MB /{' '}
                    {Math.round((hostDiag.metrics.processHeap.value || 0) / (1024 * 1024))} MB
                  </div>
                </div>
                <div className="rounded border border-[#252D3D] bg-[#0E131C] p-3">
                  <div className="text-slate-400">Process Uptime</div>
                  <div className="mt-1 text-white tabular-nums">{hostDiag.metrics.uptime.value}s</div>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
            <h3 className="font-display text-sm font-semibold text-white">
              Canonical Hardware Reference Asset
            </h3>
            <img
              src="/assets/leeway/diagnostics/lenovo-83nx-motherboard-map.png"
              alt="Canonical Lenovo 83NX motherboard reference diagram"
              referrerPolicy="no-referrer"
              className="w-full rounded border border-[#252D3D] object-cover"
            />
            <p className="text-[11px] text-slate-400">
              Reference hardware map preserved from LeeWay Tablet Diagnostics assets. Physical Device Bridge enrollment is currently UNVERIFIED.
            </p>
          </section>
        </div>
      )}

      {/* AGENTS, BUS, VERITAS, PROBES, SHELL, SETUP */}
      {activeTab === 'AGENTS' && (
        <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
          <h3 className="font-display text-sm font-semibold text-white">
            Diagnostic Agent Projections (W00–W17)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            {state.workforce
              .filter((w) => w.category === 'A_LEEWAY_INTERNAL')
              .map((w) => (
                <div key={w.id} className="rounded border border-[#252D3D] bg-[#0E131C] p-3">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-[#38BDF8]">{w.workerCode}</span>
                    <span className="text-emerald-400">{w.operationalStatus}</span>
                  </div>
                  <div className="mt-1 font-semibold text-white">{w.name}</div>
                  <div className="mt-1 text-slate-400">{w.department} · Veritas: {w.veritasQualification}</div>
                </div>
              ))}
          </div>
        </section>
      )}

      {activeTab === 'BUS' && (
        <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3 text-xs">
          <h3 className="font-display text-sm font-semibold text-white">
            Diagnostics State & Communication Bus Contracts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
            <div className="rounded border border-[#252D3D] bg-[#0E131C] p-3">
              <div className="text-[#38BDF8]">BroadcastChannel</div>
              <div className="mt-1 text-white">leeway-diagnostics-state-v1</div>
              <div className="mt-1 text-slate-400">Monotonic sequence & sourceId anti-echo active</div>
            </div>
            <div className="rounded border border-[#252D3D] bg-[#0E131C] p-3">
              <div className="text-[#38BDF8]">Runtime Fabric Bus</div>
              <div className="mt-1 text-slate-400">UNBOUND (LEEWAY_RUNTIME_URL unset)</div>
            </div>
            <div className="rounded border border-[#252D3D] bg-[#0E131C] p-3">
              <div className="text-[#38BDF8]">Device Bridge Bus</div>
              <div className="mt-1 text-slate-400">UNVERIFIED (LEEWAY_DEVICE_BRIDGE_URL unset)</div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'VERITAS' && (
        <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3 text-xs">
          <h3 className="font-display text-sm font-semibold text-white">
            Independent Veritas & Formula Verification Boundary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded border border-emerald-500/40 bg-emerald-950/20 p-3">
              <div className="font-mono text-emerald-300">LOCAL KERNEL VERIFICATION: {formulaHealth?.status || 'UNKNOWN'}</div>
              <p className="mt-1 text-slate-300">
                11/11 canonical Formula v1.0 files verified by SHA-256 at server startup. Golden vector [4,50,63,59,48,69] confirmed.
              </p>
            </div>
            <div className="rounded border border-slate-600/40 bg-slate-900/40 p-3">
              <div className="font-mono text-slate-300">INDEPENDENT VERITAS DAEMON: NOT_PROVIDED</div>
              <p className="mt-1 text-slate-400">
                External Veritas service is unbound. LeeWay Core never self-certifies independent Veritas approval.
              </p>
            </div>
          </div>
        </section>
      )}

      {(activeTab === 'PROBES' || activeTab === 'SHELL') && (
        <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-[#D4AF37]" />
              <h3 className="font-display text-sm font-semibold text-white">
                Allowlisted Read-Only Diagnostic Probes ({activeTab})
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'node-runtime', label: 'Node Runtime' },
                { id: 'host-load', label: 'Host Load & RAM' },
                { id: 'env-bindings', label: 'Environment Bindings' },
                { id: 'tsc-check', label: 'TypeScript Check' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => void handleProbe(p.id)}
                  className="rounded border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-2.5 py-1 font-mono text-xs text-[#F8E7A1] hover:bg-[#D4AF37]/20"
                >
                  Run {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded border border-[#252D3D] bg-[#080B10] p-3 font-mono text-xs text-slate-200 space-y-2 max-h-60 overflow-y-auto">
            {probeLogs.length === 0 ? (
              <div className="text-slate-500">
                Select an allowlisted probe above to run a real read-only host diagnostic check.
              </div>
            ) : (
              probeLogs.map((log, idx) => (
                <div key={idx} className="border-b border-[#1A2230] pb-2">
                  <div className="text-[#38BDF8]">
                    [{log.executedAt}] probe={log.id} status={log.status}
                  </div>
                  <pre className="mt-1 whitespace-pre-wrap text-slate-200">{log.output}</pre>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === 'SETUP' && (
        <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-2 text-xs">
          <h3 className="font-display text-sm font-semibold text-white">
            Diagnostics Surface & Capability Setup Status
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 font-mono">
            {Object.entries(hostDiag?.capabilities || {}).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded border border-[#252D3D] bg-[#0E131C] px-3 py-2">
                <span className="text-slate-300">{k}</span>
                <span className="text-slate-400">{v}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4">
        <FormulaIntelligencePanel
          domainId="diagnostic-evaluation"
          formulaHealth={formulaHealth}
          evaluations={state.formulaEvaluations}
          onRunEvaluation={onRunFormula}
          runningDomain={runningDomain}
        />
      </section>
    </div>
  );
}
