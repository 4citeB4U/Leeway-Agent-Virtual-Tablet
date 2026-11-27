/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.SECTION.WORKFORCE
TAG: LEEWAY.CORE.ORGANIZATION.WORKFORCE.V1

5WH:
WHAT = Section 02 Organization & Workforce control environment covering Categories A-E, W00-W17, org charts, heatmaps, Employee 360, and governed reassignment.
WHY = Satisfy Section 08 workforce visibility, external employment contract governance, and private internal agent boundary enforcement.
WHO = Creator/Human Authority via Leeway Innovations.
WHERE = src/components/sections/OrganizationWorkforceSection.tsx
WHEN = 2026-11-27
HOW = Interactive charts, drag/button governed reassignment proposals, Employee 360 side drawer, and /api/workforce/:id/action controls.

LICENSE = Apache-2.0
*/
import React, { useState } from 'react';
import { ArrowRightLeft, ShieldAlert, ShieldCheck, UserCheck, X } from 'lucide-react';
import type {
  CoreState,
  FormulaHealthResponse,
  WorkforceCategory,
  WorkforceMember,
} from '../../types/leeway';
import { BarChart, HeatMapGrid, RadialGauge, TopologyGraph } from '../charts/VisualCharts';
import { FormulaIntelligencePanel } from '../formula/FormulaIntelligencePanel';

const CATEGORY_LABELS: Record<WorkforceCategory, string> = {
  A_LEEWAY_INTERNAL: 'A · LeeWay Internal Workforce',
  B_LEEWAY_CONTRACTED: 'B · LeeWay Contracted Workforce',
  C_CUSTOMER_INTERNAL_AGENT: 'C · Customer Internal Agents (Private)',
  D_CUSTOMER_EXTERNAL_CANDIDATE: 'D · Customer External Employment Candidates',
  E_EXTERNALLY_DEPLOYED_CONTRACTED: 'E · Externally Deployed Contracted',
};

export function OrganizationWorkforceSection({
  state,
  formulaHealth,
  onRunFormula,
  runningDomain,
  onProposeReassignment,
  onWorkforceAction,
}: {
  state: CoreState;
  formulaHealth: FormulaHealthResponse | null;
  onRunFormula: (domainId: string) => Promise<void>;
  runningDomain: string | null;
  onProposeReassignment: (member: WorkforceMember, targetDepartment: string, authorizeNow: boolean) => Promise<void>;
  onWorkforceAction: (memberId: string, action: string) => Promise<void>;
}) {
  const [selectedCategory, setSelectedCategory] = useState<WorkforceCategory | 'ALL'>('ALL');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(state.workforce[0]?.id || null);
  const [draggedMemberId, setDraggedMemberId] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<{ member: WorkforceMember; targetDept: string } | null>(null);

  const filtered = state.workforce.filter(
    (w) => selectedCategory === 'ALL' || w.category === selectedCategory
  );
  const selectedMember = state.workforce.find((w) => w.id === selectedMemberId) || null;

  const departments = Array.from(new Set(state.workforce.map((w) => w.department)));
  const deptBars = departments.map((dept) => ({
    id: dept,
    label: dept,
    value: state.workforce.filter((w) => w.department === dept).length,
    color: '#38BDF8',
  }));

  const orgNodes = [
    { id: 'creator', label: 'Leonard J. Lee', group: 'CREATOR AUTHORITY', x: 380, y: 36, tone: 'GOLD' as const, metric: 'Tier 0' },
    { id: 'w00', label: 'W00 Command Ops', group: 'CATEGORY A', x: 160, y: 125, tone: 'BLUE' as const, metric: '18 Internal' },
    { id: 'ctr', label: 'LW-CTR-01 Field', group: 'CATEGORY B', x: 380, y: 125, tone: 'GREEN' as const, metric: 'Contracted' },
    { id: 'ext', label: 'EXT-DEP-01 Corridor', group: 'CATEGORY E', x: 600, y: 125, tone: 'GREEN' as const, metric: 'External Active' },
    { id: 'cand', label: 'CAND-EXT-01 Queue', group: 'CATEGORY D', x: 250, y: 225, tone: 'AMBER' as const, metric: 'Pending Review' },
    { id: 'priv', label: 'CUST-INT-01 Private', group: 'CATEGORY C', x: 510, y: 225, tone: 'GRAY' as const, metric: 'Metadata Only' },
  ];

  const orgEdges = [
    { from: 'creator', to: 'w00', label: 'direct' },
    { from: 'creator', to: 'ctr', label: 'contract' },
    { from: 'creator', to: 'ext', label: 'authorized' },
    { from: 'ctr', to: 'cand', label: 'gate' },
    { from: 'ext', to: 'priv', label: 'isolated' },
  ];

  const activePct = Math.round(
    (state.workforce.filter((w) => w.operationalStatus === 'ACTIVE').length /
      Math.max(1, state.workforce.length)) *
      100
  );

  return (
    <div className="space-y-4">
      {/* Category Filter Strip */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#252D3D] bg-[#121721] p-3">
        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          className={`rounded border px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
            selectedCategory === 'ALL'
              ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#F8E7A1]'
              : 'border-[#2D3648] bg-[#171D2A] text-slate-300'
          }`}
        >
          All Workforce ({state.workforce.length})
        </button>
        {(Object.keys(CATEGORY_LABELS) as WorkforceCategory[]).map((cat) => {
          const count = state.workforce.filter((w) => w.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded border px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                selectedCategory === cat
                  ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#F8E7A1]'
                  : 'border-[#2D3648] bg-[#171D2A] text-slate-300'
              }`}
            >
              {CATEGORY_LABELS[cat]} ({count})
            </button>
          );
        })}
      </div>

      {/* Top Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-white">
              Ecosystem Workforce & Contract Relationship Topology
            </h3>
            <span className="font-mono text-xs text-slate-400">Click node to inspect category</span>
          </div>
          <TopologyGraph
            nodes={orgNodes}
            edges={orgEdges}
            onSelectNode={(node) => {
              if (node.id === 'w00') setSelectedCategory('A_LEEWAY_INTERNAL');
              else if (node.id === 'ctr') setSelectedCategory('B_LEEWAY_CONTRACTED');
              else if (node.id === 'priv') setSelectedCategory('C_CUSTOMER_INTERNAL_AGENT');
              else if (node.id === 'cand') setSelectedCategory('D_CUSTOMER_EXTERNAL_CANDIDATE');
              else if (node.id === 'ext') setSelectedCategory('E_EXTERNALLY_DEPLOYED_CONTRACTED');
            }}
            height={260}
          />
        </section>

        <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
          <h3 className="font-display text-sm font-semibold text-white">
            Workforce Availability & Department Distribution
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <RadialGauge
              value={activePct}
              label="Active Readiness"
              statusText={`${state.workforce.filter((w) => w.operationalStatus === 'ACTIVE').length}/${state.workforce.length} Active`}
              tone="GREEN"
            />
            <RadialGauge
              value={Math.round(
                state.workforce.reduce((s, w) => s + w.workloadPct, 0) /
                  Math.max(1, state.workforce.length)
              )}
              label="Mean Workload"
              statusText="OBSERVED"
              tone="BLUE"
            />
          </div>
          <BarChart data={deptBars.slice(0, 6)} height={125} primaryLabel="Workers" />
        </section>
      </div>

      {/* Workload Heat Map & Governed Department Drag Target */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-sm font-semibold text-white">
                Digital Workforce Workload & Qualification Heat Map
              </h3>
              <p className="text-xs text-slate-400">
                Select any worker to open their Employee 360 profile, or drag a worker card onto a department lane below to propose a governed reassignment.
              </p>
            </div>
          </div>

          <HeatMapGrid
            cells={filtered.map((w) => ({
              id: w.id,
              label: `${w.workerCode} · ${w.name}`,
              sublabel: `${w.department} · ${w.operationalStatus}`,
              intensity: w.workloadPct,
              tone:
                w.operationalStatus === 'REVOKED' || w.operationalStatus === 'SUSPENDED'
                  ? 'RED'
                  : w.operationalStatus === 'PENDING_APPROVAL'
                    ? 'AMBER'
                    : w.category === 'C_CUSTOMER_INTERNAL_AGENT'
                      ? 'GRAY'
                      : w.workloadPct > 75
                        ? 'AMBER'
                        : 'GREEN',
            }))}
            onSelect={(cell) => setSelectedMemberId(cell.id)}
          />

          {/* Governed Drag/Reassign Department Lanes */}
          <div className="pt-2">
            <div className="mb-2 text-xs font-medium text-slate-300">
              Department Lanes (Drag a worker chip or use Reassign in Employee 360 to create a governed proposal)
            </div>
            <div className="flex flex-wrap gap-2 pb-2">
              {filtered.slice(0, 8).map((w) => (
                <div
                  key={w.id}
                  draggable
                  onDragStart={() => setDraggedMemberId(w.id)}
                  onClick={() => setSelectedMemberId(w.id)}
                  className="cursor-grab rounded border border-[#2D3648] bg-[#0E131C] px-2.5 py-1.5 text-xs text-slate-200 hover:border-[#D4AF37]"
                >
                  <span className="font-mono text-[#D4AF37]">{w.workerCode}</span> · {w.name}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['Executive Operations', 'Mathematics & Runtime', 'Customer & Field Ops', 'Verification Authority'].map(
                (dept) => (
                  <div
                    key={dept}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      const member = state.workforce.find((w) => w.id === draggedMemberId);
                      if (member && member.department !== dept) {
                        setPendingMove({ member, targetDept: dept });
                      }
                      setDraggedMemberId(null);
                    }}
                    className="rounded border border-dashed border-[#334155] bg-[#0B0E14] p-2.5 text-xs text-slate-300"
                  >
                    <div className="font-medium text-white truncate">{dept}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-400">
                      {state.workforce.filter((w) => w.department === dept).length} assigned
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* Employee 360 Inspection Panel */}
        <section className="rounded-lg border border-[#D4AF37]/40 bg-[#121721] p-4 space-y-3">
          {selectedMember ? (
            <>
              <div className="flex items-start justify-between gap-2 border-b border-[#1F2736] pb-3">
                <div>
                  <div className="font-mono text-[11px] text-[#38BDF8]">
                    {selectedMember.workerCode} · {selectedMember.citizenId}
                  </div>
                  <h3 className="font-display text-base font-semibold text-white">
                    {selectedMember.name}
                  </h3>
                  <div className="text-xs text-slate-400">
                    {selectedMember.position} · {selectedMember.department}
                  </div>
                </div>
                <span
                  className={`font-mono text-[11px] font-semibold ${
                    selectedMember.operationalStatus === 'ACTIVE'
                      ? 'text-emerald-400'
                      : selectedMember.operationalStatus === 'PENDING_APPROVAL'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                  }`}
                >
                  {selectedMember.operationalStatus}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-slate-400">Category</dt>
                  <dd className="text-slate-200 font-medium truncate">
                    {CATEGORY_LABELS[selectedMember.category]}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Contract ID</dt>
                  <dd className="font-mono text-slate-200">{selectedMember.contractId || 'UNCONTRACTED'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Originating Org</dt>
                  <dd className="text-slate-200 truncate">{selectedMember.originatingOrg}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Employing Org</dt>
                  <dd className="text-slate-200 truncate">{selectedMember.employingOrg}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Contracting Authority</dt>
                  <dd className="text-slate-200 truncate">{selectedMember.contractingAuthority}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Contract Window</dt>
                  <dd className="font-mono text-slate-200">
                    {selectedMember.contractStart || '—'} → {selectedMember.contractExpiry || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Tablet / Home Node</dt>
                  <dd className="font-mono text-slate-200 truncate">
                    {selectedMember.tabletId} · {selectedMember.homeNodeId}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Veritas Qualification</dt>
                  <dd className="font-mono text-[#F8E7A1]">{selectedMember.veritasQualification}</dd>
                </div>
              </dl>

              <div className="rounded border border-[#252D3D] bg-[#0E131C] p-2.5 text-xs space-y-1">
                <div className="font-medium text-slate-300">Skills, Models & Restrictions</div>
                <div className="text-slate-400">
                  Skills: <span className="text-slate-200">{selectedMember.authorizedSkills.join(', ')}</span>
                </div>
                <div className="text-slate-400">
                  Models: <span className="font-mono text-[#38BDF8]">{selectedMember.assignedModels.join(', ')}</span>
                </div>
                <div className="text-amber-300">
                  Restrictions: {selectedMember.restrictions.join('; ')}
                </div>
              </div>

              {/* Administrative Controls */}
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedMember.category === 'D_CUSTOMER_EXTERNAL_CANDIDATE' && (
                  <button
                    type="button"
                    onClick={() => void onWorkforceAction(selectedMember.id, 'APPROVE_EXTERNAL')}
                    className="inline-flex items-center gap-1 rounded border border-emerald-500/60 bg-emerald-950/50 px-2.5 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-900/60"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Approve External Employment</span>
                  </button>
                )}
                {selectedMember.operationalStatus === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => void onWorkforceAction(selectedMember.id, 'SUSPEND')}
                    className="inline-flex items-center gap-1 rounded border border-amber-500/60 bg-amber-950/40 px-2.5 py-1.5 text-xs font-medium text-amber-200"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Suspend</span>
                  </button>
                )}
                {selectedMember.operationalStatus === 'SUSPENDED' && (
                  <button
                    type="button"
                    onClick={() => void onWorkforceAction(selectedMember.id, 'RESUME')}
                    className="inline-flex items-center gap-1 rounded border border-emerald-500/60 bg-emerald-950/40 px-2.5 py-1.5 text-xs font-medium text-emerald-200"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Resume</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setPendingMove({
                      member: selectedMember,
                      targetDept:
                        selectedMember.department === 'Executive Operations'
                          ? 'Customer & Field Ops'
                          : 'Executive Operations',
                    })
                  }
                  className="inline-flex items-center gap-1 rounded border border-[#38BDF8]/50 bg-[#38BDF8]/10 px-2.5 py-1.5 text-xs font-medium text-[#38BDF8]"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  <span>Propose Reassignment</span>
                </button>
                {selectedMember.operationalStatus !== 'REVOKED' && (
                  <button
                    type="button"
                    onClick={() => void onWorkforceAction(selectedMember.id, 'REVOKE')}
                    className="rounded border border-rose-500/60 bg-rose-950/40 px-2.5 py-1.5 text-xs font-medium text-rose-200"
                  >
                    Revoke Deployment
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400">Select any workforce card to inspect Employee 360.</p>
          )}
        </section>
      </div>

      {/* Formula Workforce Intelligence */}
      <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4">
        <FormulaIntelligencePanel
          domainId="workforce-evaluation"
          formulaHealth={formulaHealth}
          evaluations={state.formulaEvaluations}
          onRunEvaluation={onRunFormula}
          runningDomain={runningDomain}
        />
      </section>

      {/* Governed Reassignment Proposal Modal */}
      {pendingMove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-[#D4AF37]/60 bg-[#121721] p-5 space-y-4">
            <header className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-white">
                Governed Workforce Reassignment Proposal
              </h3>
              <button
                type="button"
                onClick={() => setPendingMove(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <p className="text-xs text-slate-300 leading-relaxed">
              Moving <span className="font-semibold text-white">{pendingMove.member.name}</span> from{' '}
              <span className="font-mono text-slate-200">{pendingMove.member.department}</span> to{' '}
              <span className="font-mono text-[#F8E7A1]">{pendingMove.targetDept}</span> requires a governed
              proposal and receipt rather than silently altering authoritative records.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingMove(null)}
                className="rounded border border-[#2D3648] bg-[#171D2A] px-3 py-1.5 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onProposeReassignment(pendingMove.member, pendingMove.targetDept, false);
                  setPendingMove(null);
                }}
                className="rounded border border-[#38BDF8]/60 bg-[#38BDF8]/15 px-3 py-1.5 text-xs font-medium text-[#38BDF8]"
              >
                Save as Proposed
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onProposeReassignment(pendingMove.member, pendingMove.targetDept, true);
                  setPendingMove(null);
                }}
                className="rounded border border-[#D4AF37] bg-[#D4AF37]/20 px-3 py-1.5 text-xs font-semibold text-[#F8E7A1]"
              >
                Authorize & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
