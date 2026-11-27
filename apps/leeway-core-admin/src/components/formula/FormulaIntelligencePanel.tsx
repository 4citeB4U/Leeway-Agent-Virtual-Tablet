/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.FRONTEND.FORMULA_PANEL
TAG: LEEWAY.CORE.FORMULA.INTELLIGENCE.PANEL.V1

5WH:
WHAT = Reusable interactive Formula Intelligence panel embedded across workspaces to inspect domain adapter contracts, baseline vs evaluated comparisons, and receipts.
WHY = Satisfy Section 19 & 20 requirements so every primary domain exposes real Formula execution, provenance, and evidence.
WHO = Creator/Human Authority via Leeway Innovations.
WHERE = src/components/formula/FormulaIntelligencePanel.tsx
WHEN = 2026-11-27
HOW = Displays typed DomainAdapterContract + BarChart baseline vs evaluated metric + live Run Evaluation trigger.

LICENSE = Apache-2.0
*/
import React from 'react';
import { Play, ShieldCheck } from 'lucide-react';
import type { FormulaEvaluationLog, FormulaHealthResponse } from '../../types/leeway';
import { BarChart } from '../charts/VisualCharts';

export function FormulaIntelligencePanel({
  domainId,
  formulaHealth,
  evaluations,
  onRunEvaluation,
  runningDomain,
}: {
  domainId: string;
  formulaHealth: FormulaHealthResponse | null;
  evaluations: FormulaEvaluationLog[];
  onRunEvaluation: (domainId: string) => Promise<void>;
  runningDomain: string | null;
}) {
  const adapter = formulaHealth?.domainAdapters?.find((a) => a.domainId === domainId);
  const domainEvaluations = evaluations.filter((e) => e.domainId === domainId);
  const latest = domainEvaluations[0] || null;
  const isPass = formulaHealth?.status === 'LEEWAY_FORMULA_V1_PASS';

  const chartData = domainEvaluations
    .slice(0, 6)
    .reverse()
    .map((e, idx) => ({
      id: e.id,
      label: `Run ${idx + 1}`,
      value: e.evaluatedMetric,
      secondaryValue: e.baselineMetric,
      color: e.outcomePolarity === 'FAVORABLE' ? '#38BDF8' : '#F59E0B',
    }));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
          <span className="font-semibold text-white">
            {adapter?.domainName || domainId} Adapter
          </span>
          <span className="text-slate-500">·</span>
          <span className="font-mono text-[#38BDF8]">{adapter?.canonicalAdapterId || 'runtime-state-v1'}</span>
        </div>
        <button
          type="button"
          disabled={!isPass || runningDomain === domainId}
          onClick={() => void onRunEvaluation(domainId)}
          className="inline-flex items-center gap-1.5 rounded border border-[#D4AF37]/60 bg-[#D4AF37]/15 px-3 py-1.5 text-xs font-medium text-[#F8E7A1] hover:bg-[#D4AF37]/25 disabled:opacity-40 whitespace-nowrap"
        >
          <Play className="h-3.5 w-3.5" />
          <span>{runningDomain === domainId ? 'Running Exact BigInt Formula…' : 'Run Canonical Formula'}</span>
        </button>
      </div>

      {adapter && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
          <div className="rounded border border-[#252D3D] bg-[#0E131C] p-2.5">
            <div className="text-[11px] font-medium text-slate-400">Input Contract & Provenance</div>
            <div className="mt-1 text-slate-200">{adapter.inputContract}</div>
            <div className="mt-1 font-mono text-[11px] text-slate-400">Source: {adapter.inputProvenance}</div>
          </div>
          <div className="rounded border border-[#252D3D] bg-[#0E131C] p-2.5">
            <div className="text-[11px] font-medium text-slate-400">Authorization & Verification Gate</div>
            <div className="mt-1 text-slate-200">{adapter.authorizationBoundary}</div>
            <div className="mt-1 font-mono text-[11px] text-amber-300">{adapter.verificationRequirements}</div>
          </div>
        </div>
      )}

      {latest ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="rounded border border-[#252D3D] bg-[#0E131C] p-2.5">
              <div className="text-[11px] text-slate-400">Top-6 Decimal Vector</div>
              <div className="mt-0.5 font-mono font-semibold text-white tabular-nums">
                [{latest.decimalState.join(', ')}]
              </div>
            </div>
            <div className="rounded border border-[#252D3D] bg-[#0E131C] p-2.5">
              <div className="text-[11px] text-slate-400">Base64 State</div>
              <div className="mt-0.5 font-mono font-semibold text-[#D4AF37] tabular-nums">
                [{latest.base64State.join(', ')}]
              </div>
            </div>
            <div className="rounded border border-[#252D3D] bg-[#0E131C] p-2.5">
              <div className="text-[11px] text-slate-400">Lifecycle State</div>
              <div className="mt-0.5 font-mono font-semibold text-[#38BDF8]">{latest.lifecycleStage}</div>
            </div>
            <div className="rounded border border-[#252D3D] bg-[#0E131C] p-2.5">
              <div className="text-[11px] text-slate-400">Result SHA-256</div>
              <div className="mt-0.5 font-mono text-slate-200 truncate">{latest.resultHash.slice(0, 16)}…</div>
            </div>
          </div>

          {chartData.length > 0 && (
            <BarChart
              data={chartData}
              height={150}
              primaryLabel="Evaluated Metric"
              secondaryLabel="Baseline Reference"
            />
          )}
          <div className="text-xs text-slate-300">
            <span className="font-mono text-[#F8E7A1]">{latest.outcomePolarity}</span> · {latest.outcomeNote}
          </div>
        </div>
      ) : (
        <div className="rounded border border-dashed border-[#2D3648] bg-[#0E131C] p-4 text-center text-xs text-slate-400">
          No domain evaluation recorded for <span className="text-slate-200">{adapter?.domainName || domainId}</span> yet. Click Run Canonical Formula to execute exact BigInt rational evaluation and generate a SHA-256 receipt.
        </div>
      )}
    </div>
  );
}
