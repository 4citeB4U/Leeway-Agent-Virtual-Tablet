/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.FRONTEND.FORMULA_MONITOR
TAG: LEEWAY.CORE.FORMULA.EFFECTIVENESS.MONITOR.V1

5WH:
WHAT = Persistent collapsible Formula Effectiveness Monitor displaying SHA-256 kernel integrity, 9-stage lifecycle, and domain receipts.
WHY = Satisfy Section 20 requirement to track REGISTERED -> RETAINED states and show both favorable and unfavorable outcomes honestly.
WHO = Creator/Human Authority via Leeway Innovations.
WHERE = src/components/formula/FormulaMonitor.tsx
WHEN = 2026-11-27
HOW = Collapsible bottom bar synced to /api/formula/health and CoreState.formulaEvaluations.

LICENSE = Apache-2.0
*/
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, Play, ShieldCheck, ShieldAlert } from 'lucide-react';
import {
  FORMULA_LIFECYCLE_STAGES,
  type FormulaEvaluationLog,
  type FormulaHealthResponse,
} from '../../types/leeway';

export function FormulaMonitor({
  formulaHealth,
  evaluations,
  onRunEvaluation,
  runningDomain,
}: {
  formulaHealth: FormulaHealthResponse | null;
  evaluations: FormulaEvaluationLog[];
  onRunEvaluation: (domainId: string) => Promise<void>;
  runningDomain: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState('enterprise-operations');

  const isPass = formulaHealth?.status === 'LEEWAY_FORMULA_V1_PASS';
  const latest = evaluations[0] || null;
  const favorableCount = evaluations.filter((e) => e.outcomePolarity === 'FAVORABLE').length;
  const unfavorableCount = evaluations.filter((e) => e.outcomePolarity === 'UNFAVORABLE').length;

  return (
    <aside
      aria-label="Formula Effectiveness Monitor"
      className="border-t border-[#D4AF37]/35 bg-[#0D1119] text-slate-200"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 text-left text-xs font-medium hover:text-[#F8E7A1]"
        >
          {isPass ? (
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span className="font-display font-semibold text-white">
            Formula Effectiveness Monitor
          </span>
          <span className="text-slate-500">·</span>
          <span className={`font-mono ${isPass ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formulaHealth?.status || 'PROBING'}
          </span>
          <span className="text-slate-500 hidden sm:inline">·</span>
          <span className="font-mono text-slate-400 hidden sm:inline tabular-nums">
            Evaluations: {evaluations.length} (Favorable {favorableCount} / Unfavorable {unfavorableCount})
          </span>
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <select
            aria-label="Select Formula domain adapter"
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="rounded border border-[#2D3648] bg-[#121721] px-2 py-1 text-xs text-slate-200"
          >
            {(formulaHealth?.domainAdapters || []).map((a) => (
              <option key={a.domainId} value={a.domainId}>
                {a.domainName}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={runningDomain !== null || !isPass}
            onClick={() => void onRunEvaluation(selectedDomain)}
            className="inline-flex items-center gap-1.5 rounded border border-[#D4AF37]/60 bg-[#D4AF37]/15 px-2.5 py-1 text-xs font-medium text-[#F8E7A1] hover:bg-[#D4AF37]/25 disabled:opacity-40 whitespace-nowrap"
          >
            <Play className="h-3 w-3" />
            <span>{runningDomain ? 'Evaluating…' : 'Evaluate Domain'}</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[#1F2736] px-4 py-4 space-y-4 max-h-80 overflow-y-auto">
          {/* 9-Stage Formula Lifecycle Distinction */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-400">
              <span>Canonical Formula Operational Progression (Evaluation ≠ Execution ≠ Verification)</span>
              <span className="font-mono text-[#38BDF8]">
                Golden Vector: [{formulaHealth?.expectedDecimal?.join(', ') || '4, 50, 63, 59, 48, 69'}] ↔ [
                {formulaHealth?.expectedBase64?.join(', ') || 'E, y, /, 7, w, BF'}]
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
              {FORMULA_LIFECYCLE_STAGES.map((stage, i) => {
                const currentIdx = latest
                  ? FORMULA_LIFECYCLE_STAGES.indexOf(latest.lifecycleStage)
                  : isPass
                    ? 1
                    : 0;
                const active = i <= currentIdx;
                return (
                  <div
                    key={stage}
                    className={`rounded border px-2 py-1.5 text-center font-mono text-[10px] ${
                      active
                        ? 'border-[#38BDF8]/50 bg-[#38BDF8]/10 text-[#38BDF8]'
                        : 'border-[#252D3D] bg-[#121721] text-slate-500'
                    }`}
                  >
                    {stage}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Kernel Integrity */}
            <div className="rounded border border-[#252D3D] bg-[#121721] p-3">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-white">
                <span className="inline-flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-[#D4AF37]" />
                  <span>Kernel SHA-256 Integrity ({formulaHealth?.integrity?.filesChecked.length || 0} files)</span>
                </span>
                <span className="font-mono text-[11px] text-emerald-400">
                  {formulaHealth?.integrity?.verified ? 'VERIFIED' : 'BLOCKED'}
                </span>
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1 font-mono text-[11px]">
                {(formulaHealth?.integrity?.filesChecked || []).map((f) => (
                  <div key={f.file} className="flex items-center justify-between gap-2 text-slate-300">
                    <span className="truncate">{f.file}</span>
                    <span className={f.match ? 'text-emerald-400 shrink-0' : 'text-rose-400 shrink-0'}>
                      {f.actualHash.slice(0, 12)}… ({f.match ? 'PASS' : 'FAIL'})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Evaluations */}
            <div className="rounded border border-[#252D3D] bg-[#121721] p-3">
              <div className="mb-2 text-xs font-semibold text-white">
                Recent Domain Evaluations & Measured Polarity
              </div>
              {evaluations.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No domain evaluations executed in this session yet. Select a domain adapter and click Evaluate Domain.
                </p>
              ) : (
                <div className="max-h-28 overflow-y-auto space-y-1.5 text-xs">
                  {evaluations.slice(0, 6).map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between gap-2 border-b border-[#1E2534] pb-1"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-200">{ev.domainName}</div>
                        <div className="truncate font-mono text-[10px] text-slate-400">
                          Top6=[{ev.decimalState.join(',')}] · B64=[{ev.base64State.join(',')}] · {ev.resultHash.slice(0, 10)}
                        </div>
                      </div>
                      <span
                        className={`font-mono text-[10px] shrink-0 ${
                          ev.outcomePolarity === 'FAVORABLE'
                            ? 'text-emerald-400'
                            : ev.outcomePolarity === 'UNFAVORABLE'
                              ? 'text-amber-400'
                              : 'text-slate-400'
                        }`}
                      >
                        {ev.outcomePolarity} ({ev.evaluatedMetric} vs {ev.baselineMetric})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
