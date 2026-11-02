import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, ExternalLink, Layers, RefreshCw, ShieldCheck } from 'lucide-react';

type Props = {
  initialUrl: string;
  onStatusChange: (status: string) => void;
  onUrlChange: (url: string) => void;
};

type ProbeResult = {
  state?: string;
  status?: number;
  error?: string;
};

const isLoopbackHost = (hostname: string) => (
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1'
);

export function WorkboardRuntimePanel({ initialUrl, onStatusChange, onUrlChange }: Props) {
  const [targetUrl, setTargetUrl] = useState(initialUrl);
  const [appliedUrl, setAppliedUrl] = useState(initialUrl);
  const [confirmedUrl, setConfirmedUrl] = useState<string | null>(null);
  const [status, setStatus] = useState('CHECKING');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const refreshInFlight = useRef(false);
  const onStatusChangeRef = useRef(onStatusChange);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  const probe = useCallback(async (url: string) => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    setIsLoading(true);
    setStatus('CHECKING');
    onStatusChangeRef.current('CHECKING');
    setError('');

    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol) || !isLoopbackHost(parsed.hostname)) {
        throw new Error('Workboard must use an HTTP(S) loopback address.');
      }
      if (parsed.port === window.location.port) {
        throw new Error('Workboard must use a separate service port from the Agent Tablet.');
      }

      const response = await fetch(`/api/runtime/probe?url=${encodeURIComponent(parsed.toString())}`, {
        cache: 'no-store',
      });
      const result = await response.json() as ProbeResult;
      if (!response.ok || result.state !== 'UP') {
        throw new Error(result.error || `Workboard endpoint did not respond successfully (HTTP ${result.status ?? response.status}).`);
      }

      const normalizedUrl = parsed.toString().replace(/\/$/, '');
      setConfirmedUrl(normalizedUrl);
      setTargetUrl(normalizedUrl);
      onUrlChange(normalizedUrl);
      setStatus('ENDPOINT REACHABLE · UI UNVERIFIED');
      onStatusChangeRef.current('ENDPOINT REACHABLE · UI UNVERIFIED');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      setConfirmedUrl(null);
      setStatus('UNAVAILABLE');
      setError(message);
      onStatusChangeRef.current('UNAVAILABLE');
    } finally {
      refreshInFlight.current = false;
      setIsLoading(false);
    }
  }, [onUrlChange]);

  useEffect(() => {
    void probe(appliedUrl);
    const intervalId = window.setInterval(() => { void probe(appliedUrl); }, 15_000);
    return () => window.clearInterval(intervalId);
  }, [appliedUrl, probe]);

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[#080b12] text-zinc-200">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-[#0d1522] px-4 py-3">
        <div>
          <div className="flex items-center gap-2 text-cyan-200">
            <Layers size={16} />
            <h1 className="text-xs font-black tracking-[0.18em]">LEEWAY WORKBOARD · SOURCE OF TRUTH</h1>
          </div>
          <p className="mt-1 text-[10px] text-zinc-400">Assignments, handoffs, and team communication belong to the Workboard service—not a local demo.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-zinc-700 bg-black/30 px-2 py-1 text-[9px] font-bold text-cyan-200">{status}</span>
          <button
            type="button"
            onClick={() => void probe(targetUrl)}
            disabled={isLoading}
            className="flex items-center gap-2 rounded border border-cyan-800 bg-cyan-950/40 px-3 py-2 text-[10px] font-bold text-cyan-100 disabled:opacity-50"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => confirmedUrl && window.open(confirmedUrl, '_blank', 'noopener,noreferrer')}
            disabled={!confirmedUrl}
            className="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-[10px] font-bold text-zinc-200 disabled:opacity-40"
          >
            <ExternalLink size={12} />
            Open Workboard
          </button>
        </div>
      </header>

      <form
        className="flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-[#0a101a] px-4 py-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (targetUrl.trim() === appliedUrl.trim()) {
            void probe(targetUrl);
          } else {
            const nextUrl = targetUrl.trim();
            setAppliedUrl(nextUrl);
            onUrlChange(nextUrl);
          }
        }}
      >
        <label htmlFor="workboard-target" className="text-[10px] text-zinc-400">Local service</label>
        <input
          id="workboard-target"
          value={targetUrl}
          onChange={(event) => setTargetUrl(event.target.value)}
          className="min-w-[220px] flex-1 rounded border border-zinc-700 bg-black px-2 py-1.5 font-mono text-[10px] text-cyan-100 outline-none focus:border-cyan-600"
          autoComplete="url"
          spellCheck={false}
        />
        <button type="submit" disabled={isLoading} className="rounded bg-cyan-800 px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-50">
          Connect
        </button>
      </form>

      {error && (
        <div role="alert" className="flex items-start gap-2 border-b border-amber-900/70 bg-amber-950/20 px-4 py-3 text-[10px] text-amber-200">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <div><strong>Workboard not connected.</strong> {error} No assignments or messages were read or sent.</div>
        </div>
      )}

      <div className="flex min-h-[420px] flex-1 flex-col">
        {confirmedUrl ? (
          <>
            <div className="flex items-center gap-2 border-b border-zinc-800 bg-emerald-950/20 px-4 py-2 text-[9px] text-emerald-200">
              <ShieldCheck size={12} />
              Endpoint answered the health probe. Workboard contents are served directly by the selected service and are not independently API-verified by this tablet.
            </div>
            <iframe
              key={confirmedUrl}
              title="LeeWay Workboard service"
              src={confirmedUrl}
              className="min-h-[420px] flex-1 border-0 bg-white"
              sandbox="allow-forms allow-scripts allow-popups allow-downloads"
              referrerPolicy="no-referrer"
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center">
            <div className="max-w-xl">
              <Layers size={32} className="mx-auto text-zinc-600" />
              <h2 className="mt-4 text-lg font-bold text-zinc-200">The Workboard is the one agent blackboard.</h2>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                Start or connect the approved Workboard service to see its real assignments, provider attribution, agent messages, and work evidence here. This tablet will not substitute seeded records or simulated agent activity.
              </p>
              <p className="mt-3 text-[10px] text-zinc-500">Current target: <code className="text-zinc-300">{targetUrl || 'not set'}</code></p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default WorkboardRuntimePanel;
