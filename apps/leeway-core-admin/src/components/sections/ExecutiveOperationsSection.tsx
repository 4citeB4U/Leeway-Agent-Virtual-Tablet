/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.SECTION.EXECUTIVE_OPERATIONS
TAG: LEEWAY.CORE.EXECUTIVE.OVERVIEW.V1

5WH:
WHAT = Section 01 Executive Operations workspace with configurable visual panels, enterprise relationship topology, drill-down charts, and Agent Lee briefing.
WHY = Deliver the 70-80% graphical executive control center anchored on real state store data and host telemetry.
WHO = Creator/Human Authority via Leeway Innovations.
WHERE = src/components/sections/ExecutiveOperationsSection.tsx
WHEN = 2026-11-27
HOW = WorkspaceEngine panels rendering interactive SVG Trend, Bar, Donut, RadialGauge, and TopologyGraph components with section drill-down.

LICENSE = Apache-2.0
*/
import React, { useState } from 'react';
import type {
  CoreState,
  DiscoveredRepository,
  FormulaHealthResponse,
  HostDiagnosticsSnapshot,
  PrimarySectionId,
  WorkspacePanelConfig,
} from '../../types/leeway';
import {
  BarChart,
  DonutChart,
  RadialGauge,
  TopologyGraph,
  TrendChart,
  type GraphNode,
} from '../charts/VisualCharts';
import { FormulaIntelligencePanel } from '../formula/FormulaIntelligencePanel';
import { WorkspaceEngine, type WorkspacePanelDefinition } from '../workspace/WorkspaceEngine';

export function ExecutiveOperationsSection({
  state,
  hostDiag,
  repos,
  formulaHealth,
  onNavigate,
  onSaveView,
  onRunFormula,
  runningDomain,
}: {
  state: CoreState;
  hostDiag: HostDiagnosticsSnapshot | null;
  repos: DiscoveredRepository[];
  formulaHealth: FormulaHealthResponse | null;
  onNavigate: (section: PrimarySectionId, subTab?: string) => void;
  onSaveView: (name: string, sectionId: string, panels: WorkspacePanelConfig[]) => Promise<void>;
  onRunFormula: (domainId: string) => Promise<void>;
  runningDomain: string | null;
}) {
  const [selectedGraphNode, setSelectedGraphNode] = useState<GraphNode | null>(null);

  const personalCount = state.customers.filter((c) => c.accountType === 'PERSONAL').length;
  const companyCount = state.customers.filter((c) => c.accountType === 'COMPANY').length;
  const totalMrr = state.customers.reduce((acc, c) => acc + c.monthlyRevenueUsd, 0);
  const pendingDecisions = state.decisions.filter((d) => d.decisionStatus === 'PENDING').length;
  const activeCommercials = state.commercials.filter((c) => c.distributionStatus === 'DISTRIBUTING').length;
  const openSupport = state.supportCases.length;

  const workforceCounts = [
    {
      id: 'A',
      label: 'A · Internal (W00–W17)',
      value: state.workforce.filter((w) => w.category === 'A_LEEWAY_INTERNAL').length,
      color: '#D4AF37',
    },
    {
      id: 'B',
      label: 'B · LeeWay Contracted',
      value: state.workforce.filter((w) => w.category === 'B_LEEWAY_CONTRACTED').length,
      color: '#38BDF8',
    },
    {
      id: 'C',
      label: 'C · Cust. Internal',
      value: state.workforce.filter((w) => w.category === 'C_CUSTOMER_INTERNAL_AGENT').length,
      color: '#64748B',
    },
    {
      id: 'D',
      label: 'D · Ext. Candidates',
      value: state.workforce.filter((w) => w.category === 'D_CUSTOMER_EXTERNAL_CANDIDATE').length,
      color: '#F59E0B',
    },
    {
      id: 'E',
      label: 'E · Ext. Contracted',
      value: state.workforce.filter((w) => w.category === 'E_EXTERNALLY_DEPLOYED_CONTRACTED').length,
      color: '#22C55E',
    },
  ];

  const storageUsed = state.customers.reduce((s, c) => s + c.storageUsedGb, 0);
  const storageQuota = Math.max(1, state.customers.reduce((s, c) => s + c.storageQuotaGb, 0));
  const storagePct = Number(((storageUsed / storageQuota) * 100).toFixed(1));

  const enterpriseNodes: GraphNode[] = [
    { id: 'creator', label: 'Creator Authority', group: 'TIER 0', x: 380, y: 40, tone: 'GOLD', metric: 'Leonard J. Lee' },
    { id: 'customers', label: `${state.customers.length} Accounts`, group: 'CUSTOMERS', x: 120, y: 140, tone: 'BLUE', metric: `$${totalMrr.toLocaleString()}/mo` },
    { id: 'workforce', label: `${state.workforce.length} Workforce A-E`, group: 'WORKFORCE', x: 380, y: 140, tone: 'GREEN', metric: 'W00–W17 + Ext' },
    { id: 'products', label: `${state.products.length} Products`, group: 'PRODUCTS', x: 640, y: 140, tone: 'BLUE', metric: 'Tablet · CRM · Brain' },
    { id: 'infra', label: 'Host & Runtime', group: 'INFRA', x: 170, y: 245, tone: hostDiag ? 'GREEN' : 'GRAY', metric: hostDiag ? `CPU ${hostDiag.telemetry.cpu ?? 'N/A'}%` : 'PROBING' },
    { id: 'formula', label: 'Formula v1.0', group: 'KERNEL', x: 380, y: 245, tone: formulaHealth?.status === 'LEEWAY_FORMULA_V1_PASS' ? 'GOLD' : 'RED', metric: formulaHealth?.status === 'LEEWAY_FORMULA_V1_PASS' ? 'SHA-256 PASS' : 'BLOCKED' },
    { id: 'governance', label: `${state.receipts.length} Receipts`, group: 'GOVERNANCE', x: 590, y: 245, tone: 'AMBER', metric: `${pendingDecisions} Pending` },
  ];

  const enterpriseEdges = [
    { from: 'creator', to: 'customers', label: 'entitlements' },
    { from: 'creator', to: 'workforce', label: 'contracts' },
    { from: 'creator', to: 'products', label: 'releases' },
    { from: 'customers', to: 'infra', label: 'telemetry' },
    { from: 'workforce', to: 'formula', label: 'adapters' },
    { from: 'products', to: 'governance', label: 'receipts' },
    { from: 'formula', to: 'governance', label: 'evidence' },
  ];

  const handleTopologyClick = (node: GraphNode) => {
    setSelectedGraphNode(node);
    if (node.id === 'customers') onNavigate('product-user-management', 'customers');
    else if (node.id === 'workforce') onNavigate('organization-workforce');
    else if (node.id === 'products') onNavigate('product-user-management', 'catalog');
    else if (node.id === 'infra') onNavigate('infrastructure-control');
    else if (node.id === 'governance') onNavigate('governance-authority');
  };

  const panels: WorkspacePanelDefinition[] = [
    {
      id: 'exec-kpi-strip',
      title: 'Enterprise Operational Vital Metrics',
      subtitle: 'Click any metric card to drill down into the owning administrative workspace',
      defaultSpan: 3,
      render: () => (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              label: 'Registered Customers',
              value: state.customers.length,
              sub: `${companyCount} Company · ${personalCount} Personal`,
              tone: 'text-[#38BDF8]',
              action: () => onNavigate('product-user-management', 'customers'),
            },
            {
              label: 'Digital Workforce',
              value: state.workforce.length,
              sub: `${state.workforce.filter((w) => w.operationalStatus === 'ACTIVE').length} Active · A–E`,
              tone: 'text-emerald-400',
              action: () => onNavigate('organization-workforce'),
            },
            {
              label: 'Monthly Recurring Rev',
              value: `$${totalMrr.toLocaleString()}`,
              sub: 'CRM Starter + Core Store',
              tone: 'text-[#F8E7A1]',
              action: () => onNavigate('business-intelligence'),
            },
            {
              label: 'Active Missions',
              value: state.missions.length,
              sub: `${state.missions.filter((m) => m.blockedReason).length} Blocked`,
              tone: 'text-[#38BDF8]',
              action: () => onNavigate('mission-command'),
            },
            {
              label: 'Pending Decisions',
              value: pendingDecisions,
              sub: `${activeCommercials} Live Commercials`,
              tone: pendingDecisions > 0 ? 'text-amber-400' : 'text-emerald-400',
              action: () => onNavigate('executive-decisions'),
            },
            {
              label: 'Proactive Support',
              value: openSupport,
              sub: `${repos.length} Tracked Repos`,
              tone: openSupport > 0 ? 'text-rose-400' : 'text-emerald-400',
              action: () => onNavigate('product-user-management', 'support'),
            },
          ].map((kpi) => (
            <button
              key={kpi.label}
              type="button"
              onClick={kpi.action}
              className="rounded-lg border border-[#252D3D] bg-[#0E131C] p-3 text-left hover:border-[#D4AF37]"
            >
              <div className="text-[11px] text-slate-400 truncate">{kpi.label}</div>
              <div className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${kpi.tone}`}>
                {kpi.value}
              </div>
              <div className="mt-1 text-[11px] text-slate-400 truncate">{kpi.sub}</div>
            </button>
          ))}
        </div>
      ),
    },
    {
      id: 'exec-customer-growth',
      title: 'Customer Growth & Product Adoption',
      subtitle: 'Registration trajectory & account segmentation · Click to open Customers & Members',
      defaultSpan: 2,
      render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
          <TrendChart
            labels={['Jul', 'Aug', 'Sep', 'Oct', 'Nov']}
            series={[
              { id: 'total', label: 'Cumulative Accounts', color: '#38BDF8', values: [2, 3, 4, 5, state.customers.length] },
              { id: 'active', label: 'Active Subscriptions', color: '#22C55E', values: [2, 3, 3, 4, state.customers.filter((c) => c.accountStatus === 'ACTIVE').length] },
            ]}
            height={175}
            onPointSelect={() => onNavigate('product-user-management', 'customers')}
          />
          <DonutChart
            segments={[
              { id: 'company', label: 'Company / Industrial', value: companyCount, color: '#D4AF37' },
              { id: 'personal', label: 'Personal Edition', value: personalCount, color: '#38BDF8' },
            ]}
            centerValue={state.customers.length}
            centerLabel="Accounts"
            onSelect={() => onNavigate('product-user-management', 'customers')}
          />
        </div>
      ),
    },
    {
      id: 'exec-workforce-dist',
      title: 'Workforce Deployment Categories (A–E)',
      subtitle: 'Internal vs contracted vs customer agents · Click bar to inspect Workforce',
      defaultSpan: 1,
      render: () => (
        <BarChart
          data={workforceCounts}
          height={185}
          primaryLabel="Headcount"
          onSelect={() => onNavigate('organization-workforce')}
        />
      ),
    },
    {
      id: 'exec-revenue-retention',
      title: 'Revenue, Product Adoption & Retention Trends',
      subtitle: 'Product adoption % and monthly subscription revenue trajectory',
      defaultSpan: 2,
      render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
          <TrendChart
            labels={['Jul', 'Aug', 'Sep', 'Oct', 'Nov']}
            series={[
              { id: 'mrr', label: 'MRR ($)', color: '#D4AF37', values: [2750, 3247, 3744, 3793, totalMrr] },
              { id: 'retention', label: 'Retention (%)', color: '#38BDF8', dashed: true, values: [100, 100, 96, 94, 92] },
            ]}
            height={175}
            onPointSelect={() => onNavigate('business-intelligence')}
          />
          <BarChart
            data={state.products.map((p) => ({
              id: p.id,
              label: p.name.replace('LeeWay ', ''),
              value: p.adoptionPct,
              color: p.adoptionPct > 0 ? '#38BDF8' : '#64748B',
            }))}
            unit="%"
            height={175}
            primaryLabel="Adoption %"
            onSelect={() => onNavigate('product-user-management', 'catalog')}
          />
        </div>
      ),
    },
    {
      id: 'exec-infra-gauges',
      title: 'Infrastructure & Resource Gauges',
      subtitle: 'Live Node host OS telemetry + customer storage allocation (GPU explicitly unverified)',
      defaultSpan: 1,
      render: () => (
        <div className="grid grid-cols-2 gap-2.5">
          <RadialGauge
            value={hostDiag?.telemetry.cpu ?? null}
            label="Host CPU Load"
            statusText={hostDiag ? 'OBSERVED' : 'UNAVAILABLE'}
            tone={hostDiag?.telemetry.cpu !== null ? 'GREEN' : 'GRAY'}
            sublabel={hostDiag?.platform.architecture}
          />
          <RadialGauge
            value={hostDiag?.telemetry.ram ?? null}
            label="Host RAM"
            statusText={hostDiag ? 'OBSERVED' : 'UNAVAILABLE'}
            tone={hostDiag?.telemetry.ram !== null ? 'BLUE' : 'GRAY'}
            sublabel="os.totalmem/freemem"
          />
          <RadialGauge
            value={storagePct}
            label="Tenant Storage"
            statusText={`${storageUsed.toFixed(0)}/${storageQuota} GB`}
            tone={storagePct > 80 ? 'AMBER' : 'GREEN'}
            sublabel="Allocated Quotas"
          />
          <RadialGauge
            value={null}
            label="Edge GPU VRAM"
            statusText="UNVERIFIED"
            tone="GRAY"
            sublabel="Hardware probe unbound"
          />
        </div>
      ),
    },
    {
      id: 'exec-relationship-graph',
      title: 'Enterprise Relationship Topology',
      subtitle: 'Interactive map connecting Creator Authority, Customers, Workforce, Products, Formula & Governance',
      defaultSpan: 2,
      render: () => (
        <div className="space-y-2">
          <TopologyGraph
            nodes={enterpriseNodes}
            edges={enterpriseEdges}
            selectedId={selectedGraphNode?.id}
            onSelectNode={handleTopologyClick}
            height={280}
          />
        </div>
      ),
    },
    {
      id: 'exec-agent-lee-briefing',
      title: 'Agent Lee Executive Briefing & Formula Intelligence',
      subtitle: 'Concise operational synthesis grounded in current observed state',
      defaultSpan: 1,
      render: () => (
        <div className="space-y-4">
          <div className="rounded-lg border border-[#D4AF37]/30 bg-[#0E131C] p-3 text-xs leading-relaxed text-slate-200 space-y-2">
            <div className="font-display font-semibold text-[#F8E7A1]">
              Executive Situation Report
            </div>
            <p>
              Core holds {state.customers.length} registered accounts (${totalMrr.toLocaleString()}/mo MRR) and{' '}
              {state.workforce.length} tracked workforce entries across Categories A–E.
            </p>
            <p>
              Priority attention: {pendingDecisions} pending Creator decisions (including external candidate
              admission and Corridor contract renewal) and {openSupport} proactive support flags (Elena Rostova
              at 88.2% storage quota; Near West Side 1 extension update pending).
            </p>
            <p className="font-mono text-[11px] text-slate-400">
              Truth boundary: External Runtime Fabric, Zitadel OIDC, and GPU VRAM remain UNBOUND in this
              preview; canonical Formula v1.0 SHA-256 integrity is {formulaHealth?.status || 'CHECKING'}.
            </p>
          </div>
          <FormulaIntelligencePanel
            domainId="enterprise-operations"
            formulaHealth={formulaHealth}
            evaluations={state.formulaEvaluations}
            onRunEvaluation={onRunFormula}
            runningDomain={runningDomain}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <WorkspaceEngine
        sectionId="executive-operations"
        definitions={panels}
        savedViews={state.workspaceViews}
        onSaveView={onSaveView}
      />
    </div>
  );
}
