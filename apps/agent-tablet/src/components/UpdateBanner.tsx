/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.UPDATE_WARNING
TAG: LEEWAY.TABLET.GITHUB_UPDATE_BANNER.V1
WHAT: Always-visible warning when GitHub main is ahead of the installed tablet or a published app.
WHY: An update on GitHub must tell the operator without requiring them to hunt for Update Center.
WHO: LeeWay Industries / creator-authorized outside contributor (LW-OPENCODE).
WHERE: apps/agent-tablet/src/components/UpdateBanner.tsx
WHEN: 2026-11-27
HOW: Public GitHub commit reads through the shared appUpdates check; no new authority or deployment plane.
AUTHORITY: LOCAL_OPERATIONS_ONLY. No production deployment, Veritas or receipt claim.
LICENSE: Existing repository terms.
*/
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { checkGithubUpdates } from '../appUpdates';

const RECHECK_MS = 10 * 60 * 1000;

export function UpdateBanner({ onOpenUpdateCenter }: { onOpenUpdateCenter: () => void }) {
  const [available, setAvailable] = useState<string[]>([]);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const rows = await checkGithubUpdates();
      // A failed check keeps the last known state; it never invents an update.
      if (rows.some(row => row.state !== 'ERROR')) {
        setAvailable(rows.filter(row => row.state === 'UPDATE_AVAILABLE').map(row => row.label));
      }
    } catch {
      /* network failure: retain last observed state */
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void check();
    const timer = window.setInterval(() => { void check(); }, RECHECK_MS);
    return () => window.clearInterval(timer);
  }, [check]);

  const signature = useMemo(() => available.slice().sort().join('|'), [available]);
  if (available.length === 0 || dismissedFor === signature) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-leeway-update-warning="true"
      className="flex shrink-0 items-center gap-2 border-b border-amber-300/40 bg-amber-950/80 px-3 py-1.5 text-[10px] font-black tracking-[0.06em] text-amber-100"
    >
      <AlertTriangle size={14} className="shrink-0 text-amber-300" />
      <span className="min-w-0 flex-1 truncate">
        UPDATE AVAILABLE · GitHub main is ahead of {available.length} surface{available.length > 1 ? 's' : ''}: {available.join(', ')}
      </span>
      <button
        type="button"
        onClick={onOpenUpdateCenter}
        className="flex shrink-0 items-center gap-1 rounded border border-amber-200/50 bg-amber-800/60 px-2 py-0.5 hover:bg-amber-700"
      >
        <RefreshCw size={11} /> OPEN UPDATE CENTER
      </button>
      <button
        type="button"
        aria-label="Dismiss update warning for this version"
        title="Dismiss until the available version changes"
        onClick={() => setDismissedFor(signature)}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-amber-200/40 hover:bg-amber-800/60"
      >
        <X size={12} />
      </button>
      {checking ? <span className="sr-only">Rechecking GitHub versions</span> : null}
    </div>
  );
}
