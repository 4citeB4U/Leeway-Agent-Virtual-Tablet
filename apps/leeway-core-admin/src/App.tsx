/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.FRONTEND.APP
TAG: LEEWAY.CORE.MASTER.WORKSPACE.SHELL.V1

5WH:
WHAT = Unified LeeWay Core single-sidebar administrative workspace integrating all 10 operational sections, Formula Effectiveness Monitor, and Creator Authority controls.
WHY = Operate as a cohesive Creator Administrative Control Center inside the Master Agent Tablet without duplicating the Tablet OS header or creating 10 disconnected apps.
WHO = Creator/Human Authority via Leeway Innovations.
WHERE = src/App.tsx
WHEN = 2026-11-27
HOW = React state synchronized with /api/core/state, /api/formula/*, /api/diagnostics/*, and in-memory Bearer token authorization.

LICENSE = Apache-2.0
*/
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Cpu,
  FlaskConical,
  KeyRound,
  LayoutGrid,
  Lock,
  Menu,
  Package,
  Scale,
  Server,
  Target,
  Users,
  X,
} from 'lucide-react';
import { CreatorAuthorityModal } from './components/auth/CreatorAuthorityModal';
import { FormulaMonitor } from './components/formula/FormulaMonitor';
import { KnowledgeBaseModal } from './components/knowledge/KnowledgeBaseModal';
import { BusinessIntelligenceSection } from './components/sections/BusinessIntelligenceSection';
import { CreatorDiagnosticsSection } from './components/sections/CreatorDiagnosticsSection';
import { ExecutiveDecisionsSection } from './components/sections/ExecutiveDecisionsSection';
import { ExecutiveOperationsSection } from './components/sections/ExecutiveOperationsSection';
import { GovernanceAuthoritySection } from './components/sections/GovernanceAuthoritySection';
import { InfrastructureControlSection } from './components/sections/InfrastructureControlSection';
import { MissionCommandSection } from './components/sections/MissionCommandSection';
import { OrganizationWorkforceSection } from './components/sections/OrganizationWorkforceSection';
import {
  ProductUserManagementSection,
  type ProductUserSubTab,
} from './components/sections/ProductUserManagementSection';
import { ResearchDevelopmentSection } from './components/sections/ResearchDevelopmentSection';
import type {
  CoreState,
  DiscoveredRepository,
  EngineeringStage,
  FormulaHealthResponse,
  HostDiagnosticsSnapshot,
  MissionRecord,
  PrimarySectionId,
  WorkforceMember,
  WorkspacePanelConfig,
} from './types/leeway';

const SECTIONS: Array<{
  id: PrimarySectionId;
  num: string;
  label: string;
  icon: typeof LayoutGrid;
}> = [
  { id: 'executive-operations', num: '01', label: 'Executive Operations', icon: LayoutGrid },
  { id: 'organization-workforce', num: '02', label: 'Organization & Workforce', icon: Users },
  { id: 'creator-diagnostics', num: '03', label: 'Creator Diagnostics', icon: Activity },
  { id: 'business-intelligence', num: '04', label: 'Business Intelligence', icon: BarChart3 },
  { id: 'product-user-management', num: '05', label: 'Product & User Mgmt', icon: Package },
  { id: 'infrastructure-control', num: '06', label: 'Infrastructure Control', icon: Server },
  { id: 'mission-command', num: '07', label: 'Mission Command', icon: Target },
  { id: 'governance-authority', num: '08', label: 'Governance & Authority', icon: Scale },
  { id: 'research-development', num: '09', label: 'Research & Development', icon: FlaskConical },
  { id: 'executive-decisions', num: '10', label: 'Executive Decisions', icon: Briefcase },
];

export default function App() {
  const [activeSection, setActiveSection] = useState<PrimarySectionId>('executive-operations');
  const [productSubTab, setProductSubTab] = useState<ProductUserSubTab>('customers');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [state, setState] = useState<CoreState | null>(null);
  const [externalIntegrations, setExternalIntegrations] = useState<Record<string, string>>({});
  const [hostDiag, setHostDiag] = useState<HostDiagnosticsSnapshot | null>(null);
  const [repos, setRepos] = useState<DiscoveredRepository[]>([]);
  const [repoSource, setRepoSource] = useState<string>('LOADING');
  const [formulaHealth, setFormulaHealth] = useState<FormulaHealthResponse | null>(null);
  const [runningDomain, setRunningDomain] = useState<string | null>(null);
  const [kbOpen, setKbOpen] = useState(false);

  // Creator Authority Bearer token held strictly in React memory (never localStorage)
  const [creatorToken, setCreatorToken] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'ENV_PASSCODE' | 'CLAIMED_LOCAL' | 'UNCLAIMED_FIRST_RUN'>(
    'UNCLAIMED_FIRST_RUN'
  );
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{
    tone: 'SUCCESS' | 'ERROR' | 'INFO';
    text: string;
  } | null>(null);

  const mainScrollRef = useRef<HTMLDivElement>(null);

  const loadAll = useCallback(async () => {
    try {
      const [coreRes, authRes, formulaRes, diagRes, repoRes] = await Promise.all([
        fetch('/api/core/state', { cache: 'no-store' }),
        fetch('/api/auth/status', { cache: 'no-store' }),
        fetch('/api/formula/health', { cache: 'no-store' }),
        fetch('/api/diagnostics/snapshot', { cache: 'no-store' }),
        fetch('/api/diagnostics/repositories', { cache: 'no-store' }),
      ]);

      if (coreRes.ok) {
        const d = await coreRes.json();
        setState(d.state);
        setExternalIntegrations(d.externalIntegrations || {});
      }
      if (authRes.ok) {
        const a = await authRes.json();
        setAuthMode(a.mode || 'UNCLAIMED_FIRST_RUN');
      }
      if (formulaRes.ok || formulaRes.status === 503) {
        setFormulaHealth(await formulaRes.json());
      }
      if (diagRes.ok) {
        setHostDiag(await diagRes.json());
      }
      if (repoRes.ok) {
        const r = await repoRes.json();
        setRepos(r.repositories || []);
        setRepoSource(r.source || 'CANONICAL_FALLBACK_INDEX');
      }
    } catch {
      setStatusNotice({
        tone: 'ERROR',
        text: 'Unable to reach LeeWay Core backend service.',
      });
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const navigateTo = (section: PrimarySectionId, subTab?: string) => {
    setActiveSection(section);
    if (section === 'product-user-management' && subTab) {
      setProductSubTab(subTab as ProductUserSubTab);
    }
    mainScrollRef.current?.scrollTo({ top: 0 });
  };

  const authorizedPost = async (url: string, body: unknown) => {
    if (!creatorToken) {
      setAuthModalOpen(true);
      setStatusNotice({
        tone: 'INFO',
        text: 'Creator Authority unlock required before executing administrative changes.',
      });
      return null;
    }
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (resp.status === 401) {
      setCreatorToken(null);
      setAuthModalOpen(true);
      setStatusNotice({ tone: 'ERROR', text: 'Creator session expired. Re-verify authority.' });
      return null;
    }
    if (!resp.ok) {
      setStatusNotice({ tone: 'ERROR', text: data.error || 'Operation rejected by server.' });
      return null;
    }
    await loadAll();
    return data;
  };

  const handleRunFormula = async (domainId: string) => {
    setRunningDomain(domainId);
    try {
      const resp = await fetch('/api/formula/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        setStatusNotice({ tone: 'ERROR', text: data.error || 'Formula evaluation failed.' });
        return;
      }
      setStatusNotice({
        tone: 'SUCCESS',
        text: `Canonical Formula evaluated ${data.evaluation.domainName}: Top6=[${data.evaluation.decimalState.join(
          ','
        )}] (${data.evaluation.resultHash.slice(0, 12)})`,
      });
      await loadAll();
    } finally {
      setRunningDomain(null);
    }
  };

  const handleSaveView = async (
    name: string,
    sectionId: string,
    panels: WorkspacePanelConfig[]
  ) => {
    const resp = await fetch('/api/workspace/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, sectionId, panels }),
    });
    if (resp.ok) {
      setStatusNotice({ tone: 'SUCCESS', text: `Saved workspace view "${name}".` });
      await loadAll();
    }
  };

  const handleRefreshDiagnostics = async () => {
    const [diagRes, repoRes] = await Promise.all([
      fetch('/api/diagnostics/snapshot', { cache: 'no-store' }),
      fetch('/api/diagnostics/repositories?refresh=1', { cache: 'no-store' }),
    ]);
    if (diagRes.ok) setHostDiag(await diagRes.json());
    if (repoRes.ok) {
      const r = await repoRes.json();
      setRepos(r.repositories || []);
      setRepoSource(r.source || 'CANONICAL_FALLBACK_INDEX');
    }
    setStatusNotice({ tone: 'INFO', text: 'Diagnostics host snapshot and repository index refreshed.' });
  };

  const handleRunProbe = async (probeId: string) => {
    const resp = await fetch('/api/diagnostics/probe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ probeId }),
    });
    return (await resp.json()) as { status: string; output: string; executedAt: string };
  };

  const handleProposeReassignment = async (
    member: WorkforceMember,
    targetDepartment: string,
    authorizeNow: boolean
  ) => {
    const data = await authorizedPost('/api/proposals', {
      proposalType: 'WORKFORCE_REASSIGNMENT',
      summary: `Reassign ${member.name} (${member.workerCode}) to ${targetDepartment}`,
      targetId: member.id,
      requestedChange: { department: targetDepartment },
      authorizeNow,
    });
    if (data) {
      setStatusNotice({
        tone: 'SUCCESS',
        text: `${authorizeNow ? 'Authorized reassignment' : 'Logged proposal'} · Receipt ${
          data.receipt.receiptId
        }`,
      });
    }
  };

  const handleWorkforceAction = async (memberId: string, action: string) => {
    const data = await authorizedPost(`/api/workforce/${memberId}/action`, { action });
    if (data) {
      setStatusNotice({
        tone: 'SUCCESS',
        text: `Workforce action ${action} recorded · Receipt ${data.receipt.receiptId}`,
      });
    }
  };

  const handleProposeStageAdvance = async (
    mission: MissionRecord,
    nextStage: EngineeringStage,
    authorizeNow: boolean
  ) => {
    const data = await authorizedPost('/api/proposals', {
      proposalType: 'MISSION_STAGE_ADVANCE',
      summary: `Move mission "${mission.title}" to ${nextStage}`,
      targetId: mission.id,
      requestedChange: { stage: nextStage },
      authorizeNow,
    });
    if (data) {
      setStatusNotice({
        tone: 'SUCCESS',
        text: `${authorizeNow ? 'Mission stage updated' : 'Mission proposal recorded'} · Receipt ${
          data.receipt.receiptId
        }`,
      });
    }
  };

  const handleResolveDecision = async (
    decisionId: string,
    action: 'APPROVE' | 'REJECT' | 'DEFER' | 'REQUEST_CHANGES',
    note?: string
  ) => {
    const data = await authorizedPost(`/api/decisions/${decisionId}/resolve`, { action, note });
    if (data) {
      setStatusNotice({
        tone: 'SUCCESS',
        text: `Decision marked ${data.decision.decisionStatus} (Execution: ${data.decision.executionStatus}) · Receipt ${data.receipt.receiptId}`,
      });
    }
  };

  const handleCustomerAdmin = async (
    customerId: string,
    action: string,
    payload?: Record<string, unknown>
  ) => {
    const data = await authorizedPost(`/api/customers/${customerId}/admin`, {
      action,
      ...payload,
    });
    if (data) {
      setStatusNotice({
        tone: 'SUCCESS',
        text: `Customer updated (${action}) · Receipt ${data.receipt.receiptId}`,
      });
    }
  };

  const handleSupportDispatch = async (
    incidentId: string,
    workerId: string,
    workflowStep: string
  ) => {
    const data = await authorizedPost(`/api/support/${incidentId}/dispatch`, {
      workerId,
      workflowStep,
    });
    if (data) {
      setStatusNotice({
        tone: 'SUCCESS',
        text: `Support worker ${workerId} dispatched (${workflowStep}) · Receipt ${data.receipt.receiptId}`,
      });
    }
  };

  const handleCommercialAction = async (commercialId: string, action: string, note?: string) => {
    const data = await authorizedPost(`/api/commercials/${commercialId}/action`, { action, note });
    if (data) {
      setStatusNotice({
        tone: 'SUCCESS',
        text: `Commercial action ${action} persisted · Receipt ${data.receipt.receiptId}`,
      });
    }
  };

  const activeMeta = SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0B0E14] text-[#E6E9EF]">
      {/* Persistent Internal Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } flex flex-col border-r border-[#D4AF37]/30 bg-[#0F131C] shrink-0`}
      >
        <div className="flex items-center justify-between border-b border-[#252D3D] px-3 py-3">
          {sidebarOpen && (
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/assets/leeway/leeway-true-logo.png"
                alt="LeeWay Official Emblem"
                referrerPolicy="no-referrer"
                className="h-8 w-8 rounded object-contain shrink-0"
              />
              <div className="min-w-0">
                <div className="font-display text-sm font-bold text-[#F8E7A1] truncate">
                  LeeWay Core
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Creator Control Center
                </div>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? 'Collapse navigation sidebar' : 'Expand navigation sidebar'}
            className="rounded p-1.5 text-slate-400 hover:bg-[#171D2A] hover:text-white"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1" aria-label="LeeWay Core Sections">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const active = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => navigateTo(sec.id)}
                title={sec.label}
                className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-xs font-medium ${
                  active
                    ? 'border border-[#D4AF37]/60 bg-[#D4AF37]/15 text-[#F8E7A1]'
                    : 'border border-transparent text-slate-300 hover:bg-[#171D2A] hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#D4AF37]' : 'text-[#38BDF8]'}`} />
                {sidebarOpen && (
                  <span className="truncate whitespace-nowrap">
                    <span className="font-mono text-[10px] text-slate-400 mr-1.5">{sec.num}.</span>
                    {sec.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[#252D3D] p-2.5 space-y-2">
          <button
            type="button"
            onClick={() => setKbOpen(true)}
            className="flex w-full items-center gap-2 rounded border border-[#2D3648] bg-[#141A26] px-2.5 py-2 text-xs text-slate-200 hover:border-[#38BDF8]"
          >
            <BookOpen className="h-4 w-4 text-[#38BDF8] shrink-0" />
            {sidebarOpen && <span className="truncate">Knowledge Base</span>}
          </button>

          {sidebarOpen && (
            <div className="pt-1 text-[10px] leading-snug text-slate-400">
              Powered by Leeway Innovations — A Leeway Industries Product
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Region */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Concise Workspace Control Bar (No Duplicate Tablet Header) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#252D3D] bg-[#10151F] px-5 py-2.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-[#D4AF37]">{activeMeta.num}</span>
            <span className="text-slate-500">/</span>
            <h1 className="font-display text-base font-semibold text-white whitespace-nowrap">
              {activeMeta.label}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            {statusNotice && (
              <div
                role="status"
                className={`max-w-md truncate rounded border px-2.5 py-1 text-xs ${
                  statusNotice.tone === 'SUCCESS'
                    ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
                    : statusNotice.tone === 'ERROR'
                      ? 'border-rose-500/40 bg-rose-950/30 text-rose-200'
                      : 'border-sky-500/40 bg-sky-950/30 text-sky-200'
                }`}
              >
                {statusNotice.text}
              </div>
            )}

            <button
              type="button"
              onClick={() => (creatorToken ? setCreatorToken(null) : setAuthModalOpen(true))}
              className={`inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                creatorToken
                  ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200'
                  : 'border-[#D4AF37]/60 bg-[#D4AF37]/15 text-[#F8E7A1]'
              }`}
            >
              {creatorToken ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Creator Authority Unlocked (Lock)</span>
                </>
              ) : (
                <>
                  {authMode === 'UNCLAIMED_FIRST_RUN' ? (
                    <KeyRound className="h-3.5 w-3.5" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {authMode === 'UNCLAIMED_FIRST_RUN'
                      ? 'Claim Creator Authority'
                      : 'Unlock Creator Authority'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Active Section Viewport */}
        <main ref={mainScrollRef} className="flex-1 overflow-y-auto p-5">
          {!state ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400 font-mono">
              Loading LeeWay Core operational state & verifying Formula v1.0 integrity…
            </div>
          ) : (
            <>
              {activeSection === 'executive-operations' && (
                <ExecutiveOperationsSection
                  state={state}
                  hostDiag={hostDiag}
                  repos={repos}
                  formulaHealth={formulaHealth}
                  onNavigate={navigateTo}
                  onSaveView={handleSaveView}
                  onRunFormula={handleRunFormula}
                  runningDomain={runningDomain}
                />
              )}
              {activeSection === 'organization-workforce' && (
                <OrganizationWorkforceSection
                  state={state}
                  formulaHealth={formulaHealth}
                  onRunFormula={handleRunFormula}
                  runningDomain={runningDomain}
                  onProposeReassignment={handleProposeReassignment}
                  onWorkforceAction={handleWorkforceAction}
                />
              )}
              {activeSection === 'creator-diagnostics' && (
                <CreatorDiagnosticsSection
                  state={state}
                  hostDiag={hostDiag}
                  repos={repos}
                  repoSource={repoSource}
                  formulaHealth={formulaHealth}
                  onRefreshDiagnostics={handleRefreshDiagnostics}
                  onRunProbe={handleRunProbe}
                  onRunFormula={handleRunFormula}
                  runningDomain={runningDomain}
                />
              )}
              {activeSection === 'business-intelligence' && (
                <BusinessIntelligenceSection
                  state={state}
                  formulaHealth={formulaHealth}
                  onNavigate={navigateTo}
                  onRunFormula={handleRunFormula}
                  runningDomain={runningDomain}
                />
              )}
              {activeSection === 'product-user-management' && (
                <ProductUserManagementSection
                  state={state}
                  initialSubTab={productSubTab}
                  formulaHealth={formulaHealth}
                  onRunFormula={handleRunFormula}
                  runningDomain={runningDomain}
                  onCustomerAdmin={handleCustomerAdmin}
                  onSupportDispatch={handleSupportDispatch}
                  onCommercialAction={handleCommercialAction}
                />
              )}
              {activeSection === 'infrastructure-control' && (
                <InfrastructureControlSection
                  state={state}
                  hostDiag={hostDiag}
                  externalIntegrations={externalIntegrations}
                  formulaHealth={formulaHealth}
                  onRunFormula={handleRunFormula}
                  runningDomain={runningDomain}
                />
              )}
              {activeSection === 'mission-command' && (
                <MissionCommandSection
                  state={state}
                  formulaHealth={formulaHealth}
                  onRunFormula={handleRunFormula}
                  runningDomain={runningDomain}
                  onProposeStageAdvance={handleProposeStageAdvance}
                />
              )}
              {activeSection === 'governance-authority' && (
                <GovernanceAuthoritySection
                  state={state}
                  formulaHealth={formulaHealth}
                  externalIntegrations={externalIntegrations}
                />
              )}
              {activeSection === 'research-development' && (
                <ResearchDevelopmentSection
                  state={state}
                  formulaHealth={formulaHealth}
                  onRunFormula={handleRunFormula}
                  runningDomain={runningDomain}
                />
              )}
              {activeSection === 'executive-decisions' && (
                <ExecutiveDecisionsSection
                  state={state}
                  formulaHealth={formulaHealth}
                  onRunFormula={handleRunFormula}
                  runningDomain={runningDomain}
                  onResolveDecision={handleResolveDecision}
                />
              )}
            </>
          )}
        </main>

        {/* Persistent Collapsible Formula Effectiveness Monitor */}
        <FormulaMonitor
          formulaHealth={formulaHealth}
          evaluations={state?.formulaEvaluations || []}
          onRunEvaluation={handleRunFormula}
          runningDomain={runningDomain}
        />
      </div>

      {kbOpen && <KnowledgeBaseModal onClose={() => setKbOpen(false)} />}
      {authModalOpen && (
        <CreatorAuthorityModal
          authMode={authMode}
          onAuthenticated={(token) => {
            setCreatorToken(token);
            setAuthMode((prev) => (prev === 'UNCLAIMED_FIRST_RUN' ? 'CLAIMED_LOCAL' : prev));
            setStatusNotice({ tone: 'SUCCESS', text: 'Creator Authority session active in memory.' });
          }}
          onClose={() => setAuthModalOpen(false)}
        />
      )}
    </div>
  );
}
