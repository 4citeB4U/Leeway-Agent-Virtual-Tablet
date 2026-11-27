/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.SECTION.GOVERNANCE
TAG: LEEWAY.CORE.GOVERNANCE.AUTHORITY.V1

5WH:
WHAT = Section 08 Governance & Authority workspace visualizing the 12-tier Root of Trust, Zitadel boundary, Formula integrity, Receipt provenance, and revocations.
WHY = Satisfy Section 16 governance requirements without establishing competing identity providers or self-certifying Veritas.
WHO = Creator/Human Authority via Leeway Innovations.
WHERE = src/components/sections/GovernanceAuthoritySection.tsx
WHEN = 2026-11-27
HOW = TopologyGraph authority chain, Zitadel OIDC status, permission matrix, and SHA-256 Receipt Authority ledger.

LICENSE = Apache-2.0
*/
import React from 'react';
import type { CoreState, FormulaHealthResponse } from '../../types/leeway';
import { TopologyGraph } from '../charts/VisualCharts';

export function GovernanceAuthoritySection({
  state,
  formulaHealth,
  externalIntegrations,
}: {
  state: CoreState;
  formulaHealth: FormulaHealthResponse | null;
  externalIntegrations: Record<string, string>;
}) {
  const authorityNodes = [
    { id: 'creator', label: 'Creator Authority', group: 'TIER 1', x: 120, y: 55, tone: 'GOLD' as const, metric: 'Leonard J. Lee' },
    { id: 'standards', label: 'LeeWay Standards', group: 'TIER 2', x: 380, y: 55, tone: 'GOLD' as const, metric: 'Laws & R01–R25' },
    { id: 'root', label: 'Root of Trust / Zitadel', group: 'TIER 3', x: 640, y: 55, tone: externalIntegrations.zitadelOidc === 'CONFIGURED' ? 'GREEN' as const : 'GRAY' as const, metric: externalIntegrations.zitadelOidc || 'UNBOUND' },
    { id: 'runtime', label: 'Runtime & Agent Lee', group: 'TIER 4–5', x: 180, y: 165, tone: 'BLUE' as const, metric: externalIntegrations.runtimeFabric || 'UNBOUND' },
    { id: 'formula', label: 'Golden Formula v1.0', group: 'TIER 7', x: 380, y: 165, tone: formulaHealth?.status === 'LEEWAY_FORMULA_V1_PASS' ? 'GREEN' as const : 'RED' as const, metric: formulaHealth?.status === 'LEEWAY_FORMULA_V1_PASS' ? 'SHA-256 PASS' : 'BLOCKED' },
    { id: 'veritas', label: 'Veritas & Receipts', group: 'TIER 10–11', x: 580, y: 165, tone: 'AMBER' as const, metric: `${state.receipts.length} Local Receipts` },
  ];

  const authorityEdges = [
    { from: 'creator', to: 'standards', label: 'governs' },
    { from: 'standards', to: 'root', label: 'binds' },
    { from: 'root', to: 'runtime', label: 'authorizes' },
    { from: 'runtime', to: 'formula', label: 'evaluates' },
    { from: 'formula', to: 'veritas', label: 'evidences' },
  ];

  const revokedWorkforce = state.workforce.filter(
    (w) => w.operationalStatus === 'REVOKED' || w.operationalStatus === 'SUSPENDED'
  );

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-sm font-semibold text-white">
            LeeWay 12-Tier Root of Trust & Identity Authority Chain
          </h3>
          <span className="font-mono text-xs text-slate-400">
            Zitadel OIDC: {externalIntegrations.zitadelOidc || 'UNBOUND'} · Creator ≠ Private Customer Content
          </span>
        </div>
        <TopologyGraph nodes={authorityNodes} edges={authorityEdges} height={225} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Permission & Contract Matrix */}
        <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
          <h3 className="font-display text-sm font-semibold text-white">
            Role & Authority Separation Matrix
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#252D3D] text-slate-400">
                  <th className="py-2 pr-3">Actor / Boundary</th>
                  <th className="py-2 pr-3">Contract Authority</th>
                  <th className="py-2 pr-3">Private Files</th>
                  <th className="py-2">Execution Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2534]">
                <tr>
                  <td className="py-2 pr-3 text-[#F8E7A1] font-medium">Creator Sovereign</td>
                  <td className="py-2 pr-3 font-mono text-emerald-400">FULL ADMIN</td>
                  <td className="py-2 pr-3 font-mono text-rose-400">DENIED</td>
                  <td className="py-2 font-mono text-slate-300">Requires Runtime</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 text-white">External Contributor</td>
                  <td className="py-2 pr-3 font-mono text-amber-400">BOUNDED BUILD</td>
                  <td className="py-2 pr-3 font-mono text-rose-400">DENIED</td>
                  <td className="py-2 font-mono text-slate-300">Non-Authoritative</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 text-white">Personal / Company Customer</td>
                  <td className="py-2 pr-3 font-mono text-[#38BDF8]">TENANT SCOPED</td>
                  <td className="py-2 pr-3 font-mono text-emerald-400">DEVICE SOVEREIGN</td>
                  <td className="py-2 font-mono text-slate-300">No External Deploy</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Governed Proposals & Revocations */}
        <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
          <h3 className="font-display text-sm font-semibold text-white">
            Governed Action Proposals ({state.proposals.length}) & Revocations ({revokedWorkforce.length})
          </h3>
          {state.proposals.length === 0 && revokedWorkforce.length === 0 ? (
            <p className="text-xs text-slate-400">
              No workforce revocations or pending governed proposals recorded yet. Dragging a worker or advancing a mission creates an inspectable proposal here.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
              {state.proposals.map((p) => (
                <div key={p.id} className="rounded border border-[#1E2534] bg-[#0E131C] p-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium text-white">{p.summary}</div>
                    <div className="font-mono text-[10px] text-slate-400">
                      {p.id} · Receipt {p.receiptId}
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-[#38BDF8]">{p.status}</span>
                </div>
              ))}
              {revokedWorkforce.map((w) => (
                <div key={w.id} className="rounded border border-rose-500/40 bg-rose-950/20 p-2.5 flex items-center justify-between">
                  <span className="text-rose-200">{w.workerCode} · {w.name}</span>
                  <span className="font-mono text-rose-400">{w.operationalStatus}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Receipt Authority Provenance Ledger */}
      <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-white">
            Immutable Local Receipt Custody Ledger ({state.receipts.length})
          </h3>
          <span className="font-mono text-xs text-amber-300">
            External Veritas: NOT_VERIFIED_EXTERNALLY
          </span>
        </div>
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#252D3D] text-slate-400">
                <th className="py-2 pr-3">Receipt ID</th>
                <th className="py-2 pr-3">Action</th>
                <th className="py-2 pr-3">Target</th>
                <th className="py-2 pr-3">Summary</th>
                <th className="py-2">SHA-256</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2534]">
              {state.receipts.slice(0, 20).map((r) => (
                <tr key={r.receiptId}>
                  <td className="py-2 pr-3 font-mono text-[#F8E7A1] whitespace-nowrap">{r.receiptId}</td>
                  <td className="py-2 pr-3 font-mono text-[#38BDF8] whitespace-nowrap">{r.actionType}</td>
                  <td className="py-2 pr-3 font-mono text-slate-300">{r.targetId}</td>
                  <td className="py-2 pr-3 text-slate-200">{r.summary}</td>
                  <td className="py-2 font-mono text-slate-400">{r.sha256.slice(0, 14)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
