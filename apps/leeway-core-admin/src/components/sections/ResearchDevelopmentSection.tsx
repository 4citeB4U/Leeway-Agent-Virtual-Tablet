/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.SECTION.RESEARCH_DEV
TAG: LEEWAY.CORE.RESEARCH.DEVELOPMENT.V1

5WH:
WHAT = Section 09 Research & Development workspace comparing frozen Golden LEEWAY-FORMULA-v1.0 against experimental-v2 projects.
WHY = Satisfy Section 17 by keeping experimental mathematics strictly isolated from canonical Golden mathematics and reporting unfavorable regressions honestly.
WHO = Creator/Human Authority via Leeway Innovations.
WHERE = src/components/sections/ResearchDevelopmentSection.tsx
WHEN = 2026-11-27
HOW = Comparative BarChart, isolated R&D project cards, and Formula research-evaluation adapter panel.

LICENSE = Apache-2.0
*/
import React from 'react';
import type { CoreState, FormulaHealthResponse } from '../../types/leeway';
import { BarChart } from '../charts/VisualCharts';
import { FormulaIntelligencePanel } from '../formula/FormulaIntelligencePanel';

export function ResearchDevelopmentSection({
  state,
  formulaHealth,
  onRunFormula,
  runningDomain,
}: {
  state: CoreState;
  formulaHealth: FormulaHealthResponse | null;
  onRunFormula: (domainId: string) => Promise<void>;
  runningDomain: string | null;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#D4AF37]/40 bg-[#121721] px-4 py-3 text-xs text-slate-200 flex flex-wrap items-center justify-between gap-2">
        <span>
          <strong className="text-[#F8E7A1]">Canonical Isolation Law:</strong> Experimental v2 research tracks
          (<span className="font-mono">G41–G44</span>) never overwrite the frozen Golden{' '}
          <span className="font-mono">LEEWAY-FORMULA-v1.0</span> kernel.
        </span>
        <span className="font-mono text-emerald-400">
          Golden Baseline Status: {formulaHealth?.status || 'VERIFYING'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
          <h3 className="font-display text-sm font-semibold text-white">
            Baseline vs Experimental Benchmark Index (100 = Canonical Baseline)
          </h3>
          <BarChart
            data={state.rdProjects.map((p) => ({
              id: p.id,
              label: p.title.split(' ')[0],
              value: p.experimentalValue,
              secondaryValue: p.baselineValue,
              color:
                p.status === 'FROZEN_VERIFIED'
                  ? '#22C55E'
                  : p.status === 'REGRESSION_OBSERVED'
                    ? '#EF4444'
                    : '#38BDF8',
            }))}
            primaryLabel="Experimental / Observed"
            secondaryLabel="Canonical Baseline"
            height={210}
          />
        </section>

        <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
          <h3 className="font-display text-sm font-semibold text-white">
            Research Tracks & Qualification Evidence
          </h3>
          <div className="space-y-2.5">
            {state.rdProjects.map((proj) => (
              <article
                key={proj.id}
                className="rounded border border-[#1E2534] bg-[#0E131C] p-3 text-xs space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-semibold text-white">{proj.title}</span>
                  <span
                    className={`font-mono text-[11px] shrink-0 ${
                      proj.status === 'FROZEN_VERIFIED'
                        ? 'text-emerald-400'
                        : proj.status === 'REGRESSION_OBSERVED'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                    }`}
                  >
                    {proj.status}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-[#38BDF8]">{proj.deltaLabel}</div>
                <p className="text-slate-300">{proj.notes}</p>
                <div className="font-mono text-[10px] text-slate-500 truncate">
                  Source: {proj.sourcePath}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4">
        <FormulaIntelligencePanel
          domainId="research-evaluation"
          formulaHealth={formulaHealth}
          evaluations={state.formulaEvaluations}
          onRunEvaluation={onRunFormula}
          runningDomain={runningDomain}
        />
      </section>
    </div>
  );
}
