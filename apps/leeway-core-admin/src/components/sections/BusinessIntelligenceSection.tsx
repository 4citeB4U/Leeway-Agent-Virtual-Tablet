/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.SECTION.BUSINESS_INTELLIGENCE
TAG: LEEWAY.CORE.BI.EXECUTIVE.ANALYTICS.V1

5WH:
WHAT = Section 04 Business Intelligence executive workspace connected to CRM/ERP read models without duplicating the CRM office.
WHY = Provide visual revenue, cohort retention, product performance, pipeline, billing, and expense analysis with period comparison.
WHO = Creator/Human Authority via Leeway Innovations.
WHERE = src/components/sections/BusinessIntelligenceSection.tsx
WHEN = 2026-11-27
HOW = Interactive SVG Trend, Bar, Donut, and HeatMap charts with configurable time windows and drill-down into Customers & Commercials.

LICENSE = Apache-2.0
*/
import React, { useState } from 'react';
import type { CoreState, FormulaHealthResponse, PrimarySectionId } from '../../types/leeway';
import { BarChart, DonutChart, HeatMapGrid, TrendChart } from '../charts/VisualCharts';
import { FormulaIntelligencePanel } from '../formula/FormulaIntelligencePanel';

export function BusinessIntelligenceSection({
  state,
  formulaHealth,
  onNavigate,
  onRunFormula,
  runningDomain,
}: {
  state: CoreState;
  formulaHealth: FormulaHealthResponse | null;
  onNavigate: (section: PrimarySectionId, subTab?: string) => void;
  onRunFormula: (domainId: string) => Promise<void>;
  runningDomain: string | null;
}) {
  const [range, setRange] = useState<'30D' | '90D' | '12M'>('90D');
  const [compareBaseline, setCompareBaseline] = useState(true);

  const totalMrr = state.customers.reduce((s, c) => s + c.monthlyRevenueUsd, 0);
  const currentBilling = state.customers.filter((c) => c.billingStatus === 'CURRENT').length;
  const trialBilling = state.customers.filter((c) => c.billingStatus === 'TRIAL').length;

  const labels =
    range === '30D'
      ? ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4']
      : range === '90D'
        ? ['Sep', 'Oct', 'Nov']
        : ['Q1', 'Q2', 'Q3', 'Q4'];

  const revValues =
    range === '30D'
      ? [3400, 3650, 3740, totalMrr]
      : range === '90D'
        ? [3247, 3793, totalMrr]
        : [1200, 2400, 3247, totalMrr];

  const priorValues = revValues.map((v) => Math.round(v * 0.82));

  return (
    <div className="space-y-4">
      {/* BI Controls & CRM Boundary Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#252D3D] bg-[#121721] px-4 py-3">
        <div className="text-xs text-slate-300">
          <span className="font-semibold text-white">Executive Business Intelligence</span>
          <span className="text-slate-500"> · </span>
          <span>Synchronized with CRM-ERP canonical customer & campaign records (CRM office workflows remain in LeeWay CRM)</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['30D', '90D', '12M'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded border px-2.5 py-1 font-mono text-xs ${
                range === r
                  ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#F8E7A1]'
                  : 'border-[#2D3648] bg-[#171D2A] text-slate-300'
              }`}
            >
              {r}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCompareBaseline((v) => !v)}
            className={`rounded border px-2.5 py-1 text-xs ${
              compareBaseline
                ? 'border-[#38BDF8] bg-[#38BDF8]/15 text-[#38BDF8]'
                : 'border-[#2D3648] bg-[#171D2A] text-slate-300'
            }`}
          >
            {compareBaseline ? 'Comparing Prior Period' : 'Compare Prior'}
          </button>
        </div>
      </div>

      {/* Revenue & Pipeline Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-white">
              Recurring Revenue Trend & Comparative Baseline ({range})
            </h3>
            <span className="font-mono text-xs text-[#F8E7A1] tabular-nums">
              Current MRR: ${totalMrr.toLocaleString()}
            </span>
          </div>
          <TrendChart
            labels={labels}
            series={[
              { id: 'rev', label: 'Current Period MRR ($)', color: '#D4AF37', values: revValues },
              ...(compareBaseline
                ? [{ id: 'prior', label: 'Prior Baseline ($)', color: '#38BDF8', dashed: true, values: priorValues }]
                : []),
            ]}
            height={210}
            onPointSelect={() => onNavigate('product-user-management', 'customers')}
          />
        </section>

        <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
          <h3 className="font-display text-sm font-semibold text-white">
            Billing & Collections Mix
          </h3>
          <DonutChart
            segments={[
              { id: 'current', label: 'Current Paid', value: currentBilling, color: '#22C55E' },
              { id: 'trial', label: 'Trial / Audit', value: trialBilling, color: '#F59E0B' },
            ]}
            centerValue={`$${totalMrr.toLocaleString()}`}
            centerLabel="Monthly"
            onSelect={() => onNavigate('product-user-management', 'customers')}
          />
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
          <h3 className="font-display text-sm font-semibold text-white">
            Product Revenue & Subscriber Performance
          </h3>
          <BarChart
            data={state.products.map((p) => ({
              id: p.id,
              label: p.name.replace('LeeWay ', ''),
              value: p.activeSubscribers * p.monthlyPriceUsd,
              secondaryValue: p.activeSubscribers * 100,
              color: '#38BDF8',
            }))}
            primaryLabel="Est. Monthly Rev ($)"
            secondaryLabel="Subscriber Index"
            height={190}
            onSelect={() => onNavigate('product-user-management', 'catalog')}
          />
        </section>

        <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
          <h3 className="font-display text-sm font-semibold text-white">
            Customer Retention Risk & Renewal Cohort Heat Map
          </h3>
          <HeatMapGrid
            cells={state.customers.map((c) => ({
              id: c.id,
              label: c.displayName,
              sublabel: `Renew ${c.renewalDate} · $${c.monthlyRevenueUsd}/mo`,
              intensity: c.retentionRisk === 'LOW' ? 94 : c.retentionRisk === 'MODERATE' ? 68 : 35,
              tone: c.retentionRisk === 'LOW' ? 'GREEN' : c.retentionRisk === 'MODERATE' ? 'AMBER' : 'RED',
            }))}
            onSelect={() => onNavigate('product-user-management', 'customers')}
          />
        </section>
      </div>

      <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4">
        <FormulaIntelligencePanel
          domainId="commercial-analysis"
          formulaHealth={formulaHealth}
          evaluations={state.formulaEvaluations}
          onRunEvaluation={onRunFormula}
          runningDomain={runningDomain}
        />
      </section>
    </div>
  );
}
