/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.SECTION.EXECUTIVE_DECISIONS
TAG: LEEWAY.CORE.EXECUTIVE.DECISIONS.QUEUE.V1

5WH:
WHAT = Section 10 Executive Decisions centralized authorization workspace across all 12 governance categories.
WHY = Satisfy Section 18: expose requesting identity, risks, alternatives, Formula evaluation, Agent Lee recommendation, and separate Approval / Execution / Verification states.
WHO = Creator/Human Authority via Leeway Innovations.
WHERE = src/components/sections/ExecutiveDecisionsSection.tsx
WHEN = 2026-11-27
HOW = Category filter, visual decision summary charts, and functional Approve/Reject/Defer/Request Changes controls persisted with SHA-256 receipts.

LICENSE = Apache-2.0
*/
import React, { useState } from 'react';
import { CheckCircle2, Clock, MessageSquareWarning, XCircle } from 'lucide-react';
import type { CoreState, ExecutiveDecision, FormulaHealthResponse } from '../../types/leeway';
import { BarChart, DonutChart } from '../charts/VisualCharts';
import { FormulaIntelligencePanel } from '../formula/FormulaIntelligencePanel';

const DECISION_CATEGORIES: Array<ExecutiveDecision['category'] | 'ALL'> = [
  'ALL',
  'Customers',
  'Permissions',
  'Digital Employment',
  'Contracts',
  'Commercials',
  'Products',
  'Releases',
  'Infrastructure',
  'Support',
  'Research',
  'Engineering',
  'Financial Commitments',
];

export function ExecutiveDecisionsSection({
  state,
  formulaHealth,
  onRunFormula,
  runningDomain,
  onResolveDecision,
}: {
  state: CoreState;
  formulaHealth: FormulaHealthResponse | null;
  onRunFormula: (domainId: string) => Promise<void>;
  runningDomain: string | null;
  onResolveDecision: (
    decisionId: string,
    action: 'APPROVE' | 'REJECT' | 'DEFER' | 'REQUEST_CHANGES',
    note?: string
  ) => Promise<void>;
}) {
  const [category, setCategory] = useState<ExecutiveDecision['category'] | 'ALL'>('ALL');
  const [noteById, setNoteById] = useState<Record<string, string>>({});

  const filtered = state.decisions.filter((d) => category === 'ALL' || d.category === category);

  const statusCounts = [
    { id: 'PENDING', label: 'Pending Review', value: state.decisions.filter((d) => d.decisionStatus === 'PENDING').length, color: '#F59E0B' },
    { id: 'APPROVED', label: 'Approved', value: state.decisions.filter((d) => d.decisionStatus === 'APPROVED').length, color: '#22C55E' },
    { id: 'DEFERRED', label: 'Deferred / Changes', value: state.decisions.filter((d) => ['DEFERRED', 'CHANGES_REQUESTED'].includes(d.decisionStatus)).length, color: '#38BDF8' },
    { id: 'REJECTED', label: 'Rejected', value: state.decisions.filter((d) => d.decisionStatus === 'REJECTED').length, color: '#EF4444' },
  ];

  const categoryCounts = DECISION_CATEGORIES.filter((c) => c !== 'ALL')
    .map((c) => ({
      id: c,
      label: c,
      value: state.decisions.filter((d) => d.category === c).length,
      color: '#D4AF37',
    }))
    .filter((b) => b.value > 0);

  return (
    <div className="space-y-4">
      {/* Visual Overview of Decision Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-2">
          <h3 className="font-display text-sm font-semibold text-white">
            Authorization Queue Status Breakdown
          </h3>
          <DonutChart
            segments={statusCounts}
            centerValue={state.decisions.length}
            centerLabel="Decisions"
          />
        </section>

        <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-2">
          <h3 className="font-display text-sm font-semibold text-white">
            Active Decisions by Governance Category
          </h3>
          <BarChart data={categoryCounts} height={160} primaryLabel="Items" />
        </section>
      </div>

      {/* Category Filter Bar */}
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-[#252D3D] bg-[#121721] p-2.5">
        {DECISION_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`rounded border px-2.5 py-1 text-xs whitespace-nowrap ${
              category === cat
                ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#F8E7A1]'
                : 'border-[#2D3648] bg-[#171D2A] text-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Decision Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-[#252D3D] bg-[#121721] p-6 text-center text-xs text-slate-400">
          No executive decision items currently queued under category "{category}".
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((dec) => (
            <article
              key={dec.id}
              className="rounded-lg border border-[#D4AF37]/40 bg-[#121721] p-4 space-y-3 text-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#1F2736] pb-3">
                <div>
                  <div className="font-mono text-[11px] text-[#38BDF8]">
                    {dec.id} · {dec.category} · Requested by {dec.requestingIdentity}
                  </div>
                  <h3 className="font-display text-base font-semibold text-white">{dec.title}</h3>
                  <p className="mt-1 text-slate-300">{dec.purpose}</p>
                </div>

                {/* Strict Three-State Truth Separation */}
                <div className="flex flex-col items-end gap-1 font-mono text-[11px]">
                  <span
                    className={
                      dec.decisionStatus === 'APPROVED'
                        ? 'text-emerald-400'
                        : dec.decisionStatus === 'PENDING'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                    }
                  >
                    Decision: {dec.decisionStatus}
                  </span>
                  <span className="text-slate-300">Execution: {dec.executionStatus}</span>
                  <span className="text-slate-400">Veritas: {dec.veritasStatus}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded border border-[#1E2534] bg-[#0E131C] p-3 space-y-1">
                  <div className="font-semibold text-slate-200">Affected Parties & Restrictions</div>
                  <div className="text-slate-400">Parties: {dec.affectedParties.join(', ')}</div>
                  <div className="text-amber-300">Restrictions: {dec.restrictions.join('; ')}</div>
                </div>
                <div className="rounded border border-[#1E2534] bg-[#0E131C] p-3 space-y-1">
                  <div className="font-semibold text-slate-200">Evaluated Alternatives & Risk</div>
                  <ul className="space-y-1 text-slate-300">
                    {dec.alternatives.map((alt) => (
                      <li key={alt.label} className="font-mono text-[11px]">
                        • {alt.label} [{alt.riskLevel} · ${alt.estimatedCostUsd}]
                      </li>
                    ))}
                  </ul>
                  <div className="text-rose-300 pt-1">Risk: {dec.riskSummary}</div>
                </div>
                <div className="rounded border border-[#1E2534] bg-[#0E131C] p-3 space-y-1">
                  <div className="font-semibold text-[#F8E7A1]">Agent Lee & Formula Assessment</div>
                  <p className="text-slate-200">{dec.agentLeeRecommendation}</p>
                  <div className="font-mono text-[11px] text-[#38BDF8]">{dec.formulaSummary}</div>
                  <div className="font-mono text-[10px] text-slate-400">
                    Evidence: {dec.evidenceRefs.join(', ')}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <input
                  type="text"
                  value={noteById[dec.id] || ''}
                  onChange={(e) => setNoteById((prev) => ({ ...prev, [dec.id]: e.target.value }))}
                  placeholder="Optional Creator authorization note or revision instructions..."
                  className="flex-1 min-w-[220px] rounded border border-[#2D3648] bg-[#0B0E14] px-3 py-1.5 text-xs text-white"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void onResolveDecision(dec.id, 'APPROVE', noteById[dec.id])}
                    className="inline-flex items-center gap-1 rounded border border-emerald-500/60 bg-emerald-950/40 px-3 py-1.5 font-medium text-emerald-200 hover:bg-emerald-900/50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void onResolveDecision(dec.id, 'DEFER', noteById[dec.id])}
                    className="inline-flex items-center gap-1 rounded border border-[#38BDF8]/50 bg-[#38BDF8]/10 px-3 py-1.5 font-medium text-[#38BDF8]"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Defer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void onResolveDecision(dec.id, 'REQUEST_CHANGES', noteById[dec.id])}
                    className="inline-flex items-center gap-1 rounded border border-amber-500/50 bg-amber-950/40 px-3 py-1.5 font-medium text-amber-200"
                  >
                    <MessageSquareWarning className="h-3.5 w-3.5" />
                    <span>Request Changes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void onResolveDecision(dec.id, 'REJECT', noteById[dec.id])}
                    className="inline-flex items-center gap-1 rounded border border-rose-500/50 bg-rose-950/40 px-3 py-1.5 font-medium text-rose-200"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4">
        <FormulaIntelligencePanel
          domainId="executive-alternatives"
          formulaHealth={formulaHealth}
          evaluations={state.formulaEvaluations}
          onRunEvaluation={onRunFormula}
          runningDomain={runningDomain}
        />
      </section>
    </div>
  );
}
