/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.UI.GOVERNANCE
TAG: LEEWAY.UI.COMPLIANCE.LEDGER

5WH:
WHAT = Governance and architecture verification workspace reporting real LeeWay contract bindings, Formula Fabric authority state, and SHA-256 execution receipts.
WHY = Maintain strict transparency across Memory Authority, Formula Fabric fail-closed checks, and executed action receipts without fabricated status claims.
WHO = Leeway Innovations — LeeWay Governance UI
WHERE = src/components/GovernanceView.tsx
WHEN = 2026-11-27
HOW = Displays live FormulaBridgeStatus, canonical MEMORY.md hash, repository inspection state, and downloadable ExecutionReceipt[] records.

LICENSE = Apache-2.0
*/

import React from 'react';
import { RefreshCw, Download } from 'lucide-react';
import { ExecutionReceipt, FormulaBridgeStatus } from '../types/studio';

interface GovernanceViewProps {
  formulaStatus: FormulaBridgeStatus;
  receipts: ExecutionReceipt[];
  isCheckingFormula: boolean;
  onRefreshFormula: () => void;
}

const MEMORY_CONTRACT_SHA256 =
  '7840caafc60ce6185a241b56d48d800efdf02dc33126826c6746dd0d3a3c6f11';

export const GovernanceView: React.FC<GovernanceViewProps> = ({
  formulaStatus,
  receipts,
  isCheckingFormula,
  onRefreshFormula,
}) => {
  const handleDownloadReceipts = () => {
    const blob = new Blob([JSON.stringify(receipts, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kineticglyph-execution-receipts.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B0F17] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <img
              src="/leeway-standards-logo.png"
              alt="LeeWay Standards Official Mark"
              className="w-10 h-10 object-contain rounded"
            />
            <div>
              <h1 className="font-display text-xl font-semibold text-slate-100">
                LeeWay Standards & Execution Evidence
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Powered by Leeway Innovations — A Leeway Industries Product
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRefreshFormula}
            disabled={isCheckingFormula}
            className="px-3.5 py-2 rounded-lg border border-slate-700 bg-[#151C28] hover:border-slate-500 text-xs font-medium text-slate-100 flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingFormula ? 'animate-spin' : ''}`} />
            Verify Formula Fabric
          </button>
        </div>

        {/* Authority & Integration Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-slate-800 rounded-xl bg-[#0F1520] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-200">
                Formula Fabric Client Adapter
              </h2>
              <span
                className={`text-[11px] font-mono ${
                  formulaStatus.authorityState === 'VERIFIED'
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {formulaStatus.authorityState}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {formulaStatus.message}
            </p>
            <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
              <div>Contract: {formulaStatus.contractId} v{formulaStatus.schemaVersion}</div>
              <div>Endpoint: {formulaStatus.endpointUrl ?? 'Not configured (fail-closed)'}</div>
            </div>
          </div>

          <div className="border border-slate-800 rounded-xl bg-[#0F1520] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-200">
                Memory Authority & Repository Provenance
              </h2>
              <span className="text-[11px] font-mono text-sky-400">
                LOCAL_BOUND
              </span>
            </div>
            <div className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
              <div>
                <span className="text-slate-300 font-medium">MEMORY.md:</span>{' '}
                <span className="font-mono text-[11px]">
                  sha256:{MEMORY_CONTRACT_SHA256.slice(0, 16)}…
                </span>
              </div>
              <div>
                <span className="text-slate-300 font-medium">LeeWay-Standards &amp; LeeWay-Agent-Skills:</span>{' '}
                Reviewed from canonical GitHub repositories.
              </div>
              <div>
                <span className="text-slate-300 font-medium">LeeWay-Engineering:</span>{' '}
                Inaccessible during environment inspection (private/unauthenticated GitHub failure).
              </div>
            </div>
          </div>
        </div>

        {/* Execution Receipt Ledger */}
        <div className="border border-slate-800 rounded-xl bg-[#0F1520] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-slate-200">
                Session Execution Receipts (R18)
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                SHA-256 digests computed via Web Crypto API exclusively for executed actions in this session.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadReceipts}
              disabled={receipts.length === 0}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-[#151C28] hover:border-slate-500 text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400 bg-[#151C28]">
                  <th className="py-2 px-4">Receipt ID</th>
                  <th className="py-2 px-4">Action</th>
                  <th className="py-2 px-4">Summary</th>
                  <th className="py-2 px-4">SHA-256 Digest</th>
                  <th className="py-2 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="py-2 px-4 font-mono text-slate-300 tabular-nums">
                      {r.id}
                    </td>
                    <td className="py-2 px-4 font-mono text-sky-300">
                      {r.action}
                    </td>
                    <td className="py-2 px-4 text-slate-200">{r.summary}</td>
                    <td className="py-2 px-4 font-mono text-slate-400 tabular-nums">
                      {r.sha256.slice(0, 18)}…
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-slate-400 tabular-nums">
                      {new Date(r.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
