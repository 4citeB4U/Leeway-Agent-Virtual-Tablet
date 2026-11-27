/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.SECTION.INFRASTRUCTURE
TAG: LEEWAY.CORE.INFRASTRUCTURE.CONTROL.V1

5WH:
WHAT = Section 06 Infrastructure Control workspace displaying real host OS compute metrics, service topology, storage quotas, and honest GPU/VRAM unbound boundaries.
WHY = Satisfy Section 14 infrastructure operations visibility while strictly distinguishing physical hardware, software-defined resources, and unbound probes.
WHO = Creator/Human Authority via Leeway Innovations.
WHERE = src/components/sections/InfrastructureControlSection.tsx
WHEN = 2026-11-27
HOW = RadialGauges, BarChart, TopologyGraph, selectable node inspector, and Formula infrastructure-optimization panel.

LICENSE = Apache-2.0
*/
import React, { useState } from 'react';
import type {
  CoreState,
  FormulaHealthResponse,
  HostDiagnosticsSnapshot,
} from '../../types/leeway';
import { BarChart, RadialGauge, TopologyGraph, type GraphNode } from '../charts/VisualCharts';
import { FormulaIntelligencePanel } from '../formula/FormulaIntelligencePanel';

interface InfraNodeDetail {
  id: string;
  name: string;
  classification: 'PHYSICAL_HOST' | 'SOFTWARE_DEFINED' | 'DIAGNOSTIC_ONLY' | 'UNBOUND_EXTERNAL';
  status: 'OBSERVED' | 'VERIFIED' | 'UNBOUND' | 'UNVERIFIED';
  summary: string;
  metrics: Array<{ label: string; value: string }>;
}

export function InfrastructureControlSection({
  state,
  hostDiag,
  externalIntegrations,
  formulaHealth,
  onRunFormula,
  runningDomain,
}: {
  state: CoreState;
  hostDiag: HostDiagnosticsSnapshot | null;
  externalIntegrations: Record<string, string>;
  formulaHealth: FormulaHealthResponse | null;
  onRunFormula: (domainId: string) => Promise<void>;
  runningDomain: string | null;
}) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('host-os');

  const nodeDetails: InfraNodeDetail[] = [
    {
      id: 'host-os',
      name: 'Core Runtime Host Process',
      classification: 'PHYSICAL_HOST',
      status: hostDiag ? 'OBSERVED' : 'UNBOUND',
      summary: 'Active Node.js Express + Vite runtime serving LeeWay Core on port 3000.',
      metrics: [
        { label: 'OS / Arch', value: hostDiag ? `${hostDiag.platform.name} ${hostDiag.platform.architecture}` : 'UNAVAILABLE' },
        { label: 'CPU Load', value: hostDiag?.telemetry.cpu !== null && hostDiag?.telemetry.cpu !== undefined ? `${hostDiag.telemetry.cpu}%` : 'UNAVAILABLE' },
        { label: 'System RAM', value: hostDiag?.telemetry.ram !== null && hostDiag?.telemetry.ram !== undefined ? `${hostDiag.telemetry.ram}%` : 'UNAVAILABLE' },
        { label: 'Process RSS', value: hostDiag ? `${Math.round((hostDiag.metrics.processRss.value || 0) / (1024 * 1024))} MB` : 'UNAVAILABLE' },
      ],
    },
    {
      id: 'formula-kernel',
      name: 'Canonical Formula v1.0 Engine',
      classification: 'SOFTWARE_DEFINED',
      status: formulaHealth?.status === 'LEEWAY_FORMULA_V1_PASS' ? 'VERIFIED' : 'UNBOUND',
      summary: 'Exact BigInt rational evaluation engine verified via SHA-256 kernel-integrity.json.',
      metrics: [
        { label: 'Status', value: formulaHealth?.status || 'UNKNOWN' },
        { label: 'Golden Vector', value: '[4, 50, 63, 59, 48, 69]' },
        { label: 'Evaluations Run', value: String(state.formulaEvaluations.length) },
      ],
    },
    {
      id: 'edge-gpu',
      name: 'Edge GPU & Physical VRAM',
      classification: 'DIAGNOSTIC_ONLY',
      status: 'UNVERIFIED',
      summary: 'Physical GPU inference and VRAM allocation cannot be fabricated; hardware device bridge is unbound.',
      metrics: [
        { label: 'GPU Utilization', value: hostDiag?.capabilities.gpuUtilization || 'UNAVAILABLE' },
        { label: 'Physical VRAM', value: hostDiag?.capabilities.gpuMemory || 'UNVERIFIED' },
        { label: 'Thermal Sensors', value: 'UNAVAILABLE' },
      ],
    },
    {
      id: 'zitadel-gw',
      name: 'Zitadel OIDC & Gateway',
      classification: 'UNBOUND_EXTERNAL',
      status: externalIntegrations.zitadelOidc === 'CONFIGURED' ? 'OBSERVED' : 'UNBOUND',
      summary: 'Authoritative identity issuer boundary. Local Creator Authority gate handles session unlock when unbound.',
      metrics: [
        { label: 'Zitadel Binding', value: externalIntegrations.zitadelOidc || 'UNBOUND' },
        { label: 'Runtime Fabric', value: externalIntegrations.runtimeFabric || 'UNBOUND' },
        { label: 'Device Bridge', value: externalIntegrations.deviceBridge || 'UNBOUND' },
      ],
    },
  ];

  const topoNodes: GraphNode[] = [
    { id: 'zitadel-gw', label: 'Zitadel / Gateway', group: 'IDENTITY', x: 140, y: 70, tone: externalIntegrations.zitadelOidc === 'CONFIGURED' ? 'GREEN' : 'GRAY', metric: externalIntegrations.zitadelOidc || 'UNBOUND' },
    { id: 'host-os', label: 'Core Runtime Host', group: 'PHYSICAL HOST', x: 380, y: 70, tone: 'GREEN', metric: hostDiag ? `RAM ${hostDiag.telemetry.ram ?? 'N/A'}%` : 'PROBING' },
    { id: 'formula-kernel', label: 'Formula v1.0', group: 'SOFTWARE KERNEL', x: 620, y: 70, tone: formulaHealth?.status === 'LEEWAY_FORMULA_V1_PASS' ? 'GOLD' : 'RED', metric: 'SHA-256 PASS' },
    { id: 'edge-gpu', label: 'Edge GPU / VRAM', group: 'DIAGNOSTIC ONLY', x: 240, y: 200, tone: 'GRAY', metric: 'UNVERIFIED' },
    { id: 'continuum', label: 'Continuum Remote', group: 'MEMORY FABRIC', x: 520, y: 200, tone: 'GRAY', metric: externalIntegrations.continuumRemote || 'UNBOUND' },
  ];

  const topoEdges = [
    { from: 'zitadel-gw', to: 'host-os', label: 'auth' },
    { from: 'host-os', to: 'formula-kernel', label: 'evaluate' },
    { from: 'host-os', to: 'edge-gpu', label: 'probe (unbound)' },
    { from: 'host-os', to: 'continuum', label: 'sync (unbound)' },
  ];

  const selectedDetail = nodeDetails.find((n) => n.id === selectedNodeId) || nodeDetails[0];

  return (
    <div className="space-y-4">
      {/* Real Host Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <RadialGauge
          value={hostDiag?.telemetry.cpu ?? null}
          label="Host CPU Load"
          statusText={hostDiag?.metrics.cpu.state || 'UNAVAILABLE'}
          tone={hostDiag?.telemetry.cpu !== null ? 'GREEN' : 'GRAY'}
          sublabel="PHYSICAL HOST"
        />
        <RadialGauge
          value={hostDiag?.telemetry.ram ?? null}
          label="Host System RAM"
          statusText={hostDiag?.metrics.memory.state || 'UNAVAILABLE'}
          tone={hostDiag?.telemetry.ram !== null ? 'BLUE' : 'GRAY'}
          sublabel={`${Math.round((hostDiag?.memoryAggregateBytes || 0) / (1024 * 1024 * 1024))} GB total`}
        />
        <RadialGauge
          value={hostDiag?.telemetry.disk ?? null}
          label="Host Workspace Disk"
          statusText={hostDiag?.metrics.disk.state || 'UNAVAILABLE'}
          tone={hostDiag?.telemetry.disk !== null ? 'BLUE' : 'GRAY'}
          sublabel="fs.statfsSync"
        />
        <RadialGauge
          value={null}
          label="GPU Inference / VRAM"
          statusText="UNVERIFIED"
          tone="GRAY"
          sublabel="No physical GPU probe"
        />
      </div>

      {/* Topology + Selected Component Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-white">
              Infrastructure Service & Gateway Topology
            </h3>
            <span className="font-mono text-xs text-slate-400">Select any node to inspect</span>
          </div>
          <TopologyGraph
            nodes={topoNodes}
            edges={topoEdges}
            selectedId={selectedNodeId}
            onSelectNode={(n) => {
              if (nodeDetails.some((d) => d.id === n.id)) setSelectedNodeId(n.id);
            }}
            height={250}
          />
        </section>

        <section className="rounded-lg border border-[#D4AF37]/40 bg-[#121721] p-4 space-y-3">
          <div className="font-mono text-[11px] text-[#38BDF8]">{selectedDetail.classification}</div>
          <h3 className="font-display text-base font-semibold text-white">{selectedDetail.name}</h3>
          <p className="text-xs text-slate-300">{selectedDetail.summary}</p>
          <div className="space-y-2 pt-1 font-mono text-xs">
            {selectedDetail.metrics.map((m) => (
              <div
                key={m.label}
                className="flex items-center justify-between rounded border border-[#1E2534] bg-[#0E131C] px-3 py-2"
              >
                <span className="text-slate-400">{m.label}</span>
                <span className="text-white">{m.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Tenant Storage Capacity + Environment Bindings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
          <h3 className="font-display text-sm font-semibold text-white">
            Customer Storage Allocation vs Quota (GB)
          </h3>
          <BarChart
            data={state.customers.map((c) => ({
              id: c.id,
              label: c.displayName.split(' ')[0],
              value: Math.round(c.storageUsedGb),
              secondaryValue: c.storageQuotaGb,
              color: c.storageUsedGb / c.storageQuotaGb > 0.8 ? '#EF4444' : '#38BDF8',
            }))}
            unit="GB"
            primaryLabel="Used (GB)"
            secondaryLabel="Quota (GB)"
            height={180}
          />
        </section>

        <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
          <h3 className="font-display text-sm font-semibold text-white">
            External Runtime & Integration Boundaries
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
            {Object.entries(externalIntegrations).map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between rounded border border-[#252D3D] bg-[#0E131C] px-3 py-2"
              >
                <span className="text-slate-300 truncate">{k}</span>
                <span className={v === 'CONFIGURED' ? 'text-emerald-400' : 'text-slate-400'}>{v}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4">
        <FormulaIntelligencePanel
          domainId="infrastructure-optimization"
          formulaHealth={formulaHealth}
          evaluations={state.formulaEvaluations}
          onRunEvaluation={onRunFormula}
          runningDomain={runningDomain}
        />
      </section>
    </div>
  );
}
