/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT_TABLET.CREATOR_BUSINESS_MONITOR
TAG: LEEWAY.AGENT_TABLET.CREATOR_CUSTOMER_FLEET_PANEL.V1
5WH:
WHAT = Display verified customer contact/account/device registration monitoring inside the original Agent Virtual Tablet CRM/ERP.
WHY = The Creator Chrome extension must open the real Tablet containing the Creator-scoped business network, not a public standalone CRM or secondary console.
WHO = Authenticated Creator via existing Runtime/Zitadel, CRM/ERP and Bridge authorities; outside contributor NOT Agent Lee.
WHERE = apps/agent-tablet/src/components/CreatorCustomerMonitor.tsx.
WHEN = 2026-11-24.
HOW = Same-origin credentialed original Runtime read, strict grants/schema, no localStorage or customer device spying; refresh only when visible.
LICENSE = Existing repository terms; no identity grants or private telemetry invented.
*/
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, RefreshCw, ShieldAlert, Users, Smartphone, Mail } from 'lucide-react';
import {
  parseCreatorBusinessOverview, type CreatorBusinessOverview,
  type CreatorCustomer
} from './creatorBusinessReadModel';

type LoadState = 'CHECKING' | 'VERIFIED' | 'UNAVAILABLE' | 'DENIED';
const LIMIT = 128 * 1024;
const METRICS = [
  ['Invitations issued','invitationsIssued'],
  ['Accepted invitations','invitationsRedeemed'],
  ['Verified accounts','verifiedAccounts'],
  ['Registered contacts','registeredContacts'],
  ['Enrolled devices','enrolledDevices'],
  ['Active accounts','activeAccounts'],
  ['Marketing opt-ins','marketingOptIns']
] as const;

async function fetchBusinessOverview(cursor: string | null, signal: AbortSignal) {
  const api = new URL('/api/creator/business/overview', window.location.origin);
  if (cursor) api.searchParams.set('cursor', cursor);
  const response = await fetch(api.toString(), {
    method:'GET',credentials:'same-origin',cache:'no-store',
    redirect:'error',referrerPolicy:'no-referrer',
    headers:{Accept:'application/json'},signal
  });
  if (response.status === 401 || response.status === 403)
    throw new Error('CREATOR_BUSINESS_GRANT_REQUIRED');
  if (!response.ok || response.redirected ||
      new URL(response.url).origin !== window.location.origin ||
      !response.headers.get('content-type')?.toLowerCase().includes('application/json'))
    throw new Error('CREATOR_BUSINESS_RUNTIME_NOT_BOUND');
  const body = await response.text();
  if (body.length > LIMIT) throw new Error('CREATOR_BUSINESS_RESPONSE_TOO_LARGE');
  return parseCreatorBusinessOverview(JSON.parse(body));
}

export function CreatorCustomerMonitor() {
  const [state, setState] = useState<LoadState>('CHECKING');
  const [overview, setOverview] = useState<CreatorBusinessOverview | null>(null);
  const [rows, setRows] = useState<CreatorCustomer[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingNext, setLoadingNext] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const mounted = useRef(true);
  const current = useRef<AbortController | null>(null);

  const refresh = useCallback(async (cursor: string | null = null) => {
    if (cursor === null) {
      // Never preserve old customer names/emails across an expired session or
      // a changed account. Only the original new signed read may repopulate.
      setOverview(null);setRows([]);setNextCursor(null);
      setState('CHECKING');
    } else setLoadingNext(true);
    current.current?.abort();
    const controller = new AbortController();
    current.current=controller;
    try {
      const next = await fetchBusinessOverview(cursor,controller.signal);
      if (!mounted.current || current.current !== controller) return;
      if (cursor !== null && overview?.businessTenantRef !== next.businessTenantRef)
        throw new Error('CREATOR_TENANT_CHANGED');
      setOverview(next);
      setRows(old => cursor ? [
        ...old.filter(x=>!next.customers.some(y=>y.accountRef===x.accountRef)),
        ...next.customers
      ] : next.customers);
      setNextCursor(next.nextCursor);
      setState('VERIFIED');
    } catch (error) {
      if (!mounted.current || controller.signal.aborted) return;
      // Fail closed on cross-account, revoked grants, non-JSON static page or
      // any unavailable Runtime. Never display a cached customer directory.
      setOverview(null);setRows([]);setNextCursor(null);
      setState(error instanceof Error && error.message==='CREATOR_BUSINESS_GRANT_REQUIRED'
        ? 'DENIED':'UNAVAILABLE');
    } finally {
      if (mounted.current && current.current === controller) setLoadingNext(false);
    }
  }, [overview?.businessTenantRef]);

  useEffect(() => {
    mounted.current=true;
    void refresh();
    // Refresh only when this original Tablet CRM surface is mounted/visible.
    // This is a business record read, not tracking customers' browser activity.
    const id=window.setInterval(()=>{
      if(document.visibilityState==='visible')void refresh();
    },60_000);
    return ()=>{mounted.current=false;current.current?.abort();window.clearInterval(id);};
    // Refresh initial state only on mount, not after every customer page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  return (
    <section className="z-10 shrink-0 border-b border-cyan-900/80 bg-slate-950 text-slate-100"
      aria-label="Creator customer and device registration monitor">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold"><Users size={15} /> Creator business · customers and enrolled devices</h2>
          <p className="text-[11px] text-slate-400">
            Original Runtime + CRM/ERP + Device Bridge · account and enrollment status only
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={()=>setExpanded(s=>!s)}
            className="rounded border border-cyan-800 px-2 py-1 text-xs text-cyan-100">
            {expanded?'Collapse':'Expand'}
          </button>
          <button type="button" onClick={()=>void refresh()} aria-label="Refresh verified Creator business data"
            className="flex items-center gap-1 rounded border border-cyan-800 px-2 py-1 text-xs text-cyan-100">
            <RefreshCw size={12}/> Refresh
          </button>
        </div>
      </div>
      {expanded && (
        <div className="max-h-[330px] overflow-y-auto px-3 py-3">
          {state==='CHECKING' && <p role="status" className="text-sm text-slate-300">
            Checking original Runtime Creator authorization and CRM/ERP readback…
          </p>}
          {state!=='VERIFIED' && state!=='CHECKING' && (
            <div role="status" className="flex items-start gap-2 text-xs text-amber-200">
              <ShieldAlert size={16} />
              <span>{state==='DENIED'?
                'Creator business access is not authorized for this current LeeWay account.' :
                'Original authenticated Creator CRM/ERP endpoint is not available. No customer records or device fleet can be displayed until Runtime and signed Tablet session are connected.'}
              </span>
            </div>
          )}
          {state==='VERIFIED' && overview && (
            <>
              <p role="status" className="mb-2 flex items-center gap-1 text-[11px] text-emerald-200">
                <Activity size={12}/> Original Creator Runtime readback · {overview.observedAt}
              </p>
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
                {METRICS.map(([label,key])=>(
                  <div key={key} className="rounded border border-cyan-800/50 bg-slate-900 p-2">
                    <strong className="block text-lg font-semibold tabular-nums">{overview.counts[key]}</strong>
                    <span className="text-[10px] text-slate-400">{label}</span>
                  </div>
                ))}
              </div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-xs font-bold">Verified customer directory</h3>
                <span className="text-[10px] text-slate-400">{rows.length} loaded · Creator authorized</span>
              </div>
              {rows.length===0 && <p className="text-xs text-slate-300">No verified customer contacts returned.</p>}
              {rows.length>0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left text-xs">
                    <thead><tr className="border-b border-white/20 text-slate-400">
                      <th className="p-2">Customer</th><th className="p-2">Verified email</th>
                      <th className="p-2">Account</th><th className="p-2">Device enrollment</th>
                      <th className="p-2">Browser extensions</th><th className="p-2">Marketing</th>
                    </tr></thead>
                    <tbody>{rows.map(customer=>(
                      <tr key={customer.accountRef} className="border-b border-white/10">
                        <td className="p-2">{customer.displayName}</td>
                        <td className="p-2"><span className="flex items-center gap-1"><Mail size={11}/>{customer.verifiedEmail}</span></td>
                        <td className="p-2">{customer.edition} · {customer.accountStatus}</td>
                        <td className="p-2"><span className="flex items-center gap-1"><Smartphone size={11}/>
                          {customer.enrolledDeviceCount} · {customer.bridgeEnrollment}</span></td>
                        <td className="p-2">{customer.verifiedExtensionCount} · {customer.extensionFleetStatus}</td>
                        <td className="p-2">{customer.marketingAllowed?'Opted in':'Not opted in'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
              {nextCursor && <button disabled={loadingNext} type="button"
                onClick={()=>void refresh(nextCursor)}
                className="mt-2 rounded border border-cyan-700 px-3 py-1 text-xs text-cyan-100 disabled:opacity-50">
                {loadingNext?'Checking page…':'Load additional verified customers'}
              </button>}
              <p className="mt-2 text-[10px] text-slate-400">
                Browser history, customer workspace files, conversations, location history, cameras and remote device commands are not included.
                Messaging requires a separate authorized workflow and applicable consent.
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
