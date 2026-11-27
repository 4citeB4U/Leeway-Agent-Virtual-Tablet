/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.SECTION.PRODUCT_USER_MGMT
TAG: LEEWAY.CORE.CUSTOMERS.PRODUCTS.SUPPORT.COMMERCIALS.V1

5WH:
WHAT = Section 05 Product & User Management workspace with all 9 internal sub-workspaces (Customers & Members, Customer 360, Permissions, Employment, Service Usage, Proactive Support, Product Catalog, Commercials, Updates).
WHY = Provide complete Creator administrative authority over customers, entitlements, proactive 10-step support, and commercial approvals while preserving privateContentAccess=false.
WHO = Creator/Human Authority via Leeway Innovations.
WHERE = src/components/sections/ProductUserManagementSection.tsx
WHEN = 2026-11-27
HOW = Multi-view customer register, Customer 360 inspector, interactive support heatmap, commercial media preview/approval controls, and Formula integration.

LICENSE = Apache-2.0
*/
import React, { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  CheckCircle2,
  PauseCircle,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import type {
  CoreState,
  CustomerRecord,
  FormulaHealthResponse,
} from '../../types/leeway';
import { BarChart, HeatMapGrid, RadialGauge } from '../charts/VisualCharts';
import { FormulaIntelligencePanel } from '../formula/FormulaIntelligencePanel';

export type ProductUserSubTab =
  | 'customers'
  | 'profiles'
  | 'permissions'
  | 'employment'
  | 'usage'
  | 'support'
  | 'catalog'
  | 'commercials'
  | 'updates';

const SUB_TABS: Array<{ id: ProductUserSubTab; label: string }> = [
  { id: 'customers', label: 'Customers & Members' },
  { id: 'profiles', label: 'Customer 360 Profile' },
  { id: 'permissions', label: 'Permissions & Entitlements' },
  { id: 'employment', label: 'Digital Employment' },
  { id: 'usage', label: 'Service Usage' },
  { id: 'support', label: 'Proactive Support' },
  { id: 'catalog', label: 'Product Catalog' },
  { id: 'commercials', label: 'Commercials' },
  { id: 'updates', label: 'Updates & Distribution' },
];

export function ProductUserManagementSection({
  state,
  initialSubTab,
  formulaHealth,
  onRunFormula,
  runningDomain,
  onCustomerAdmin,
  onSupportDispatch,
  onCommercialAction,
}: {
  state: CoreState;
  initialSubTab?: ProductUserSubTab;
  formulaHealth: FormulaHealthResponse | null;
  onRunFormula: (domainId: string) => Promise<void>;
  runningDomain: string | null;
  onCustomerAdmin: (customerId: string, action: string, payload?: Record<string, unknown>) => Promise<void>;
  onSupportDispatch: (incidentId: string, workerId: string, workflowStep: string) => Promise<void>;
  onCommercialAction: (commercialId: string, action: string, note?: string) => Promise<void>;
}) {
  const [subTab, setSubTab] = useState<ProductUserSubTab>(initialSubTab || 'customers');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE' | 'GROUPED'>('CARDS');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PERSONAL' | 'COMPANY'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'storage' | 'registeredAt'>('revenue');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(state.customers[0]?.id || '');
  const [columns, setColumns] = useState<string[]>([
    'displayName',
    'accountType',
    'accountStatus',
    'monthlyRevenueUsd',
    'storageUsedGb',
    'bridgeEnrollment',
    'retentionRisk',
  ]);
  const [revisionText, setRevisionText] = useState('');

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.customers
      .filter((c) => (typeFilter === 'ALL' ? true : c.accountType === typeFilter))
      .filter(
        (c) =>
          !q ||
          c.displayName.toLowerCase().includes(q) ||
          c.accountRef.toLowerCase().includes(q) ||
          c.crmSegment.toLowerCase().includes(q) ||
          c.productsPurchased.some((p) => p.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        if (sortBy === 'name') return a.displayName.localeCompare(b.displayName);
        if (sortBy === 'revenue') return b.monthlyRevenueUsd - a.monthlyRevenueUsd;
        if (sortBy === 'storage') return b.storageUsedGb - a.storageUsedGb;
        return b.registeredAt.localeCompare(a.registeredAt);
      });
  }, [state.customers, search, typeFilter, sortBy]);

  const activeCustomer: CustomerRecord | undefined =
    state.customers.find((c) => c.id === selectedCustomerId) || state.customers[0];

  const swapColumn = (idx: number) => {
    if (idx >= columns.length - 1) return;
    const next = [...columns];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setColumns(next);
  };

  return (
    <div className="space-y-4">
      {/* 9-Workspace Internal Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[#252D3D] bg-[#121721] p-2.5">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={`rounded border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap ${
              subTab === t.id
                ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#F8E7A1]'
                : 'border-[#2D3648] bg-[#171D2A] text-slate-300 hover:border-[#38BDF8]/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. CUSTOMERS & MEMBERS REGISTER */}
      {subTab === 'customers' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#252D3D] bg-[#121721] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customers, IDs, segments..."
                  className="w-56 rounded border border-[#2D3648] bg-[#0B0E14] py-1.5 pl-8 pr-2.5 text-xs text-white"
                />
              </div>
              {(['ALL', 'COMPANY', 'PERSONAL'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`rounded border px-2.5 py-1.5 text-xs ${
                    typeFilter === t
                      ? 'border-[#38BDF8] bg-[#38BDF8]/15 text-[#38BDF8]'
                      : 'border-[#2D3648] bg-[#171D2A] text-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Sort customers"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded border border-[#2D3648] bg-[#0B0E14] px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="revenue">Sort: Revenue</option>
                <option value="name">Sort: Name</option>
                <option value="storage">Sort: Storage Usage</option>
                <option value="registeredAt">Sort: Start Date</option>
              </select>

              {(['CARDS', 'TABLE', 'GROUPED'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setViewMode(m)}
                  className={`rounded border px-2.5 py-1.5 font-mono text-xs ${
                    viewMode === m
                      ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#F8E7A1]'
                      : 'border-[#2D3648] bg-[#171D2A] text-slate-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between rounded border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2 text-xs text-[#F8E7A1]">
              <span>{selectedIds.length} customer records selected</span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="underline hover:text-white"
              >
                Clear Selection
              </button>
            </div>
          )}

          {viewMode === 'CARDS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((c) => {
                const storagePct = Math.round((c.storageUsedGb / Math.max(1, c.storageQuotaGb)) * 100);
                return (
                  <article
                    key={c.id}
                    className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3 hover:border-[#D4AF37]/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono text-[11px] text-[#38BDF8]">
                          {c.accountType} · {c.accountRef}
                        </div>
                        <h3 className="font-display text-sm font-semibold text-white">{c.displayName}</h3>
                        <div className="text-[11px] text-slate-400">{c.crmSegment}</div>
                      </div>
                      <input
                        type="checkbox"
                        aria-label={`Select ${c.displayName}`}
                        checked={selectedIds.includes(c.id)}
                        onChange={() =>
                          setSelectedIds((prev) =>
                            prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                          )
                        }
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                      <div className="rounded border border-[#1E2534] bg-[#0E131C] p-2">
                        <div className="text-[10px] text-slate-400">MRR</div>
                        <div className="text-[#F8E7A1] tabular-nums">${c.monthlyRevenueUsd}</div>
                      </div>
                      <div className="rounded border border-[#1E2534] bg-[#0E131C] p-2">
                        <div className="text-[10px] text-slate-400">Storage</div>
                        <div className={storagePct > 80 ? 'text-rose-400' : 'text-emerald-400'}>
                          {storagePct}%
                        </div>
                      </div>
                      <div className="rounded border border-[#1E2534] bg-[#0E131C] p-2">
                        <div className="text-[10px] text-slate-400">Bridge</div>
                        <div className="text-slate-200 truncate">{c.bridgeEnrollment}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="font-mono text-slate-400">{c.accountStatus}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomerId(c.id);
                          setSubTab('profiles');
                        }}
                        className="rounded border border-[#38BDF8]/50 bg-[#38BDF8]/10 px-2.5 py-1 font-medium text-[#38BDF8] hover:bg-[#38BDF8]/20"
                      >
                        Open Customer 360
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {viewMode === 'TABLE' && (
            <div className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 overflow-x-auto space-y-2">
              <div className="text-[11px] text-slate-400">
                Click column swap icon (<ArrowLeftRight className="inline h-3 w-3" />) to reorder table columns.
              </div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#252D3D] text-slate-400">
                    {columns.map((col, idx) => (
                      <th key={col} className="py-2 pr-3 font-mono whitespace-nowrap">
                        <span>{col}</span>
                        {idx < columns.length - 1 && (
                          <button
                            type="button"
                            onClick={() => swapColumn(idx)}
                            title="Swap column right"
                            className="ml-1.5 text-slate-500 hover:text-[#D4AF37]"
                          >
                            <ArrowLeftRight className="inline h-3 w-3" />
                          </button>
                        )}
                      </th>
                    ))}
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2534]">
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-[#171D2A]">
                      {columns.map((col) => (
                        <td key={col} className="py-2 pr-3 font-mono text-slate-200 tabular-nums">
                          {String(c[col as keyof CustomerRecord] ?? '')}
                        </td>
                      ))}
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomerId(c.id);
                            setSubTab('profiles');
                          }}
                          className="text-[#38BDF8] hover:underline"
                        >
                          360 Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === 'GROUPED' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['COMPANY', 'PERSONAL'] as const).map((grp) => (
                <div key={grp} className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-2">
                  <h3 className="font-display text-sm font-semibold text-white">
                    {grp} Accounts ({filteredCustomers.filter((c) => c.accountType === grp).length})
                  </h3>
                  {filteredCustomers
                    .filter((c) => c.accountType === grp)
                    .map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomerId(c.id);
                          setSubTab('profiles');
                        }}
                        className="flex w-full items-center justify-between rounded border border-[#1E2534] bg-[#0E131C] px-3 py-2 text-left text-xs hover:border-[#D4AF37]"
                      >
                        <span className="text-white font-medium">{c.displayName}</span>
                        <span className="font-mono text-[#F8E7A1] tabular-nums">${c.monthlyRevenueUsd}/mo</span>
                      </button>
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. CUSTOMER 360 PROFILE */}
      {subTab === 'profiles' && activeCustomer && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#D4AF37]/40 bg-[#121721] p-4">
            <div>
              <div className="font-mono text-xs text-[#38BDF8]">
                {activeCustomer.accountType} · {activeCustomer.accountRef} · {activeCustomer.provenance}
              </div>
              <h2 className="font-display text-xl font-semibold text-white">{activeCustomer.displayName}</h2>
              <div className="text-xs text-slate-400">
                Legal: {activeCustomer.legalName} · Contact: {activeCustomer.verifiedEmail} · Joined{' '}
                {activeCustomer.registeredAt.slice(0, 10)}
              </div>
            </div>
            <select
              aria-label="Switch active customer profile"
              value={activeCustomer.id}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="rounded border border-[#2D3648] bg-[#0B0E14] px-3 py-1.5 text-xs text-white"
            >
              {state.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
              <h3 className="font-display text-sm font-semibold text-white">
                Resource & Extension Health
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <RadialGauge
                  value={Math.round((activeCustomer.storageUsedGb / Math.max(1, activeCustomer.storageQuotaGb)) * 100)}
                  label="Storage Quota"
                  statusText={`${activeCustomer.storageUsedGb}/${activeCustomer.storageQuotaGb} GB`}
                  tone={activeCustomer.storageUsedGb / activeCustomer.storageQuotaGb > 0.8 ? 'RED' : 'GREEN'}
                />
                <RadialGauge
                  value={Math.round((activeCustomer.computeHoursUsed / Math.max(1, activeCustomer.computeQuotaHours)) * 100)}
                  label="Compute Quota"
                  statusText={`${activeCustomer.computeHoursUsed}/${activeCustomer.computeQuotaHours} hrs`}
                  tone="BLUE"
                />
              </div>
              <div className="rounded border border-emerald-500/30 bg-emerald-950/20 p-2.5 font-mono text-[11px] text-emerald-200">
                Privacy Boundary Enforced: privateContentAccess=false · extensionDeviceCommands=false
              </div>
            </section>

            <section className="lg:col-span-2 rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
              <h3 className="font-display text-sm font-semibold text-white">
                Customer Intelligence & Administrative Controls
              </h3>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <dt className="text-slate-400">Account Status</dt>
                  <dd className="font-mono text-[#F8E7A1]">{activeCustomer.accountStatus}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Subscription Tier</dt>
                  <dd className="text-white">{activeCustomer.subscriptionTier}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Billing / Renewal</dt>
                  <dd className="font-mono text-white">
                    {activeCustomer.billingStatus} · {activeCustomer.renewalDate}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Device Bridge</dt>
                  <dd className="font-mono text-[#38BDF8]">
                    {activeCustomer.bridgeEnrollment} ({activeCustomer.authorizedDeviceCount} dev)
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Extension Fleet</dt>
                  <dd className="font-mono text-slate-200">
                    {activeCustomer.extensionFleetStatus} ({activeCustomer.verifiedExtensionCount})
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Permitted Headcount</dt>
                  <dd className="font-mono text-white tabular-nums">
                    {activeCustomer.contractedEmployeeIds.length} / {activeCustomer.permittedEmployeeHeadcount} cap
                  </dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-2 pt-2">
                {activeCustomer.accountStatus === 'PENDING_ADMISSION' && (
                  <button
                    type="button"
                    onClick={() => void onCustomerAdmin(activeCustomer.id, 'ADMIT')}
                    className="rounded border border-emerald-500/60 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-200"
                  >
                    Approve Account Admission
                  </button>
                )}
                {activeCustomer.accountStatus === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => void onCustomerAdmin(activeCustomer.id, 'SUSPEND')}
                    className="rounded border border-amber-500/60 bg-amber-950/40 px-3 py-1.5 text-xs font-medium text-amber-200"
                  >
                    Suspend Access
                  </button>
                )}
                {activeCustomer.accountStatus === 'SUSPENDED' && (
                  <button
                    type="button"
                    onClick={() => void onCustomerAdmin(activeCustomer.id, 'ACTIVATE')}
                    className="rounded border border-emerald-500/60 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-200"
                  >
                    Reactivate Account
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    void onCustomerAdmin(activeCustomer.id, 'SET_HEADCOUNT', {
                      headcount: activeCustomer.permittedEmployeeHeadcount + 1,
                    })
                  }
                  className="rounded border border-[#38BDF8]/50 bg-[#38BDF8]/10 px-3 py-1.5 text-xs font-medium text-[#38BDF8]"
                >
                  Increase Permitted Headcount (+1)
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* 3. PERMISSIONS & ENTITLEMENTS */}
      {subTab === 'permissions' && (
        <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3 overflow-x-auto">
          <h3 className="font-display text-sm font-semibold text-white">
            Customer Product Entitlements & Permission Matrix
          </h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#252D3D] text-slate-400">
                <th className="py-2 pr-3">Customer</th>
                <th className="py-2 pr-3">Digital Employment</th>
                <th className="py-2 pr-3">Continuum Sync</th>
                <th className="py-2 pr-3">Commercial Updates</th>
                <th className="py-2">Restrictions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2534]">
              {state.customers.map((c) => (
                <tr key={c.id}>
                  <td className="py-2.5 pr-3 font-medium text-white">{c.displayName}</td>
                  {(['digitalEmployment', 'continuumSync', 'commercialUpdates'] as const).map((perm) => (
                    <td key={perm} className="py-2.5 pr-3">
                      <button
                        type="button"
                        onClick={() =>
                          void onCustomerAdmin(c.id, 'TOGGLE_PERMISSION', { permissionKey: perm })
                        }
                        className={`rounded border px-2 py-1 font-mono text-[11px] ${
                          c.permissions[perm]
                            ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300'
                            : 'border-slate-600/50 bg-slate-900 text-slate-400'
                        }`}
                      >
                        {c.permissions[perm] ? 'GRANTED' : 'REVOKED'}
                      </button>
                    </td>
                  ))}
                  <td className="py-2.5 text-slate-400">{c.restrictions[0] || 'Standard'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* 4. DIGITAL EMPLOYMENT */}
      {subTab === 'employment' && (
        <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
          <h3 className="font-display text-sm font-semibold text-white">
            Customer Digital Employment Headcount & Contracted Allocation
          </h3>
          <BarChart
            data={state.customers.map((c) => ({
              id: c.id,
              label: c.displayName.split(' ')[0],
              value: c.contractedEmployeeIds.length,
              secondaryValue: c.permittedEmployeeHeadcount,
              color: '#38BDF8',
            }))}
            primaryLabel="Active Contracted"
            secondaryLabel="Permitted Cap"
            height={190}
          />
        </section>
      )}

      {/* 5. SERVICE USAGE */}
      {subTab === 'usage' && (
        <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-4">
          <h3 className="font-display text-sm font-semibold text-white">
            Customer Service Usage & Quota Saturation
          </h3>
          <BarChart
            data={state.customers.map((c) => ({
              id: c.id,
              label: c.displayName.split(' ')[0],
              value: Math.round((c.storageUsedGb / Math.max(1, c.storageQuotaGb)) * 100),
              secondaryValue: Math.round((c.computeHoursUsed / Math.max(1, c.computeQuotaHours)) * 100),
              color: '#38BDF8',
            }))}
            unit="%"
            primaryLabel="Storage Used %"
            secondaryLabel="Compute Used %"
            height={190}
          />
          <FormulaIntelligencePanel
            domainId="service-usage"
            formulaHealth={formulaHealth}
            evaluations={state.formulaEvaluations}
            onRunEvaluation={onRunFormula}
            runningDomain={runningDomain}
          />
        </section>
      )}

      {/* 6. PROACTIVE CUSTOMER SUPPORT */}
      {subTab === 'support' && (
        <div className="space-y-4">
          <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-sm font-semibold text-white">
                Proactive Customer Support Risk Heat Map (Observe → Retain Evidence)
              </h3>
              <span className="font-mono text-xs text-emerald-400">
                Policy: Non-Destructive Repairs Preserve Customer Data
              </span>
            </div>
            <HeatMapGrid
              cells={state.customers.map((c) => {
                const inc = state.supportCases.find((s) => s.customerId === c.id);
                return {
                  id: c.id,
                  label: c.displayName,
                  sublabel: inc ? inc.issueCategory : 'Healthy · No Open Risk',
                  intensity: inc ? (inc.severity === 'CRITICAL' ? 92 : 64) : 18,
                  tone: inc ? (inc.severity === 'CRITICAL' ? 'RED' : 'AMBER') : 'GREEN',
                };
              })}
            />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {state.supportCases.map((inc) => (
              <article
                key={inc.id}
                className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[#38BDF8]">
                    {inc.id} · Step: {inc.workflowStep}
                  </span>
                  <span
                    className={`font-mono font-semibold ${
                      inc.severity === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  >
                    {inc.severity} · {inc.issueCategory}
                  </span>
                </div>
                <h4 className="font-display text-sm font-semibold text-white">{inc.customerName}</h4>
                <p className="text-slate-200">{inc.summary}</p>
                <div className="rounded border border-[#1E2534] bg-[#0E131C] p-2.5 space-y-1 text-slate-300">
                  <div>Observed: {inc.observedSignal}</div>
                  <div className="text-amber-300">Predicted Risk: {inc.predictedRisk}</div>
                  <div className="text-emerald-300">Recommended: {inc.recommendedAction}</div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="font-mono text-slate-400">
                    Assigned: {inc.assignedSupportWorkerId || 'UNASSIGNED'}
                  </span>
                  <button
                    type="button"
                    onClick={() => void onSupportDispatch(inc.id, 'emp-w14-field', 'DISPATCH')}
                    className="inline-flex items-center gap-1 rounded border border-[#D4AF37]/60 bg-[#D4AF37]/15 px-3 py-1.5 font-medium text-[#F8E7A1] hover:bg-[#D4AF37]/25"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Dispatch Support Worker</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* 7. PRODUCT CATALOG */}
      {subTab === 'catalog' && (
        <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-4">
          <h3 className="font-display text-sm font-semibold text-white">
            LeeWay Product Catalog & Adoption Distribution
          </h3>
          <BarChart
            data={state.products.map((p) => ({
              id: p.id,
              label: p.name.replace('LeeWay ', ''),
              value: p.adoptionPct,
              color: p.adoptionPct > 0 ? '#D4AF37' : '#64748B',
            }))}
            unit="%"
            height={180}
            primaryLabel="Adoption %"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {state.products.map((p) => (
              <div key={p.id} className="rounded border border-[#252D3D] bg-[#0E131C] p-3 space-y-1">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-[#38BDF8]">{p.latestVersion}</span>
                  <span className="text-slate-400">{p.updateChannel}</span>
                </div>
                <div className="font-display text-sm font-semibold text-white">{p.name}</div>
                <div className="text-slate-400">
                  {p.tier} · {p.activeSubscribers} subscribers · ${p.monthlyPriceUsd}/mo
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. COMMERCIALS & CAMPAIGNS */}
      {subTab === 'commercials' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {state.commercials.map((cmp) => (
            <article
              key={cmp.id}
              className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-[11px] text-[#38BDF8]">
                    {cmp.provenance} · {cmp.mediaPreviewType}
                  </div>
                  <h3 className="font-display text-base font-semibold text-white">{cmp.title}</h3>
                  <div className="text-slate-400">Target: {cmp.targetSegment}</div>
                </div>
                <span
                  className={`font-mono text-[11px] font-semibold ${
                    cmp.approvalStatus === 'APPROVED'
                      ? 'text-emerald-400'
                      : cmp.approvalStatus === 'PENDING_REVIEW'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                  }`}
                >
                  {cmp.approvalStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center rounded border border-[#1E2534] bg-[#0E131C] p-3">
                <img
                  src={cmp.mediaAssetPath}
                  alt={cmp.title}
                  referrerPolicy="no-referrer"
                  className="h-24 w-full rounded object-contain bg-[#0B0E14] p-1"
                />
                <div className="sm:col-span-2 space-y-1.5">
                  <p className="text-slate-200">{cmp.offerText}</p>
                  <div className="font-mono text-[11px] text-slate-400">
                    Distribution: <span className="text-white">{cmp.distributionStatus}</span> · Eligible:{' '}
                    {cmp.eligibleCustomerCount}
                  </div>
                  <div className="font-mono text-[11px]">
                    Claim Guard:{' '}
                    <span
                      className={
                        cmp.claimVerificationStatus === 'VERIFIED_CAPABILITY'
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }
                    >
                      {cmp.claimVerificationStatus}
                    </span>
                  </div>
                  {cmp.revisionNote && (
                    <div className="text-amber-300">Note: {cmp.revisionNote}</div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void onCommercialAction(cmp.id, 'APPROVE_IMMEDIATE')}
                  className="inline-flex items-center gap-1 rounded border border-emerald-500/60 bg-emerald-950/40 px-2.5 py-1.5 font-medium text-emerald-200"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Authorize Immediate</span>
                </button>
                <button
                  type="button"
                  onClick={() => void onCommercialAction(cmp.id, 'SCHEDULE')}
                  className="rounded border border-[#38BDF8]/50 bg-[#38BDF8]/10 px-2.5 py-1.5 font-medium text-[#38BDF8]"
                >
                  Schedule
                </button>
                <button
                  type="button"
                  onClick={() => void onCommercialAction(cmp.id, 'PAUSE')}
                  className="inline-flex items-center gap-1 rounded border border-amber-500/50 bg-amber-950/30 px-2.5 py-1.5 text-amber-200"
                >
                  <PauseCircle className="h-3.5 w-3.5" />
                  <span>Pause</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void onCommercialAction(
                      cmp.id,
                      'REQUEST_REVISIONS',
                      revisionText || 'Provide supporting evidence before publication.'
                    )
                  }
                  className="rounded border border-[#2D3648] bg-[#171D2A] px-2.5 py-1.5 text-slate-200"
                >
                  Request Revisions
                </button>
                <button
                  type="button"
                  onClick={() => void onCommercialAction(cmp.id, 'WITHDRAW')}
                  className="inline-flex items-center gap-1 rounded border border-rose-500/50 bg-rose-950/30 px-2.5 py-1.5 text-rose-200"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Withdraw</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 9. UPDATES & DISTRIBUTION */}
      {subTab === 'updates' && (
        <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-white">
              Extension & Product Release Distribution Fleet
            </h3>
            <span className="font-mono text-slate-400">Device-Sovereign Non-Destructive Rollout</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {state.customers.map((c) => (
              <div key={c.id} className="rounded border border-[#252D3D] bg-[#0E131C] p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{c.displayName}</span>
                  {c.extensionFleetStatus === 'CURRENT' ? (
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-amber-400" />
                  )}
                </div>
                <div className="font-mono text-slate-300">Fleet: {c.extensionFleetStatus}</div>
                <div className="text-slate-400">
                  Verified Extensions: {c.verifiedExtensionCount} · Bridge: {c.bridgeEnrollment}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
