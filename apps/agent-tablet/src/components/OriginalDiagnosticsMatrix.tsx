/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT.TABLET.DIAGNOSTICS
TAG: LEEWAY.TABLET.ORIGINAL.DIAGNOSTICS.MATRIX.V2
5WH:
WHAT = Bind the existing LeeWay original Diagnostics Matrix into the Tablet and widget surfaces.
WHY = Preserve the recovered application, assets and controls instead of a replacement dashboard.
WHO = Tablet UI maintainer under Creator authorization.
WHERE = apps/agent-tablet/src/components/OriginalDiagnosticsMatrix.tsx.
WHEN = 2026-11-26.
HOW = Resolve the surface through the existing Runtime/local-adapter contract and synchronize validated state.
LICENSE = Repository terms; no new license asserted.
*/

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DiagnosticsSurfaceConfig, DiagnosticsSurfaceResolution } from '../diagnostics/surface';
import { resolveDiagnosticsSurface } from '../diagnostics/surface';
import {
  createDiagnosticsStateMessage,
  DIAGNOSTICS_STATE_CHANNEL,
  DIAGNOSTICS_STATE_TYPE,
  isAuthorizedBodyId,
  isTrustedPostMessage,
  parseDiagnosticsStateMessage,
  shouldApplyState,
  type DiagnosticsSection,
  type DiagnosticsStateInput,
  type DiagnosticsStateMessage,
  type DiagnosticsVisualization
} from '../diagnostics/sync';

const SURFACE = new URLSearchParams(window.location.search).get('leewaySurface') === 'widget' ? 'widget' : 'tablet';

function sourceId(): string {
  try {
    const existing = window.sessionStorage.getItem('leeway_diagnostics_surface_id');
    if (existing) return existing;
    const created = `surface-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem('leeway_diagnostics_surface_id', created);
    return created;
  } catch {
    return `surface-${Date.now().toString(36)}`;
  }
}

const INITIAL_STATE: DiagnosticsStateInput = {
  bodyId: '',
  section: 'DIAG',
  componentId: null,
  visualization: '2D',
  inspectorOpen: false,
  topologyPath: [],
  observationVersion: null,
  observationAt: null
};

export function OriginalDiagnosticsMatrix() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const localSourceId = useRef(sourceId());
  const sequence = useRef(0);
  const suppressBroadcast = useRef(false);
  const lastPublished = useRef('');
  const latestApplied = useRef<DiagnosticsStateMessage | null>(null);

  const [resolution, setResolution] = useState<DiagnosticsSurfaceResolution | null>(null);
  const [state, setState] = useState<DiagnosticsStateInput>(INITIAL_STATE);

  useEffect(() => {
    let stopped = false;
    const resolve = async () => {
      if (stopped) return;
      let config: DiagnosticsSurfaceConfig | null = null;
      try {
        const response = await fetch('/api/diagnostics/surface', { cache: 'no-store' });
        if (response.ok) config = await response.json() as DiagnosticsSurfaceConfig;
      } catch {
        config = null;
      }
      let decision: Parameters<typeof resolveDiagnosticsSurface>[0]['decision'] = null;
      const nativeResolve = window.leewayNative?.resolveAppSurface;
      if (nativeResolve) {
        try { decision = await nativeResolve('diagnostics', SURFACE, 'open-request-file'); }
        catch { decision = null; }
      }
      const queryBodyId = new URLSearchParams(window.location.search).get('bodyId');
      let resolved = resolveDiagnosticsSurface({
        decision, config, queryBodyId, sameOrigin: window.location.origin
      });
      // A denied/unavailable Runtime decision must not downgrade an explicitly
      // authorized local adapter preview; the native decision wins only when it authorizes.
      if (resolved.state !== 'AUTHORIZED' && decision) {
        resolved = resolveDiagnosticsSurface({ config, queryBodyId });
      }
      setResolution(resolved);
      if (resolved.bodyId && (resolved.bodyId !== state.bodyId ||
          resolved.observationVersion !== state.observationVersion)) {
        setState(previous => ({
          ...previous,
          bodyId: resolved.bodyId as string,
          observationVersion: resolved.observationVersion
        }));
      }
    };
    void resolve();
    return () => { stopped = true; };
    // Surface resolution is intentionally evaluated once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyIncoming = useCallback((message: DiagnosticsStateMessage) => {
    if (!shouldApplyState(latestApplied.current, message)) return;
    latestApplied.current = message;
    suppressBroadcast.current = true;
    setState({
      bodyId: message.bodyId,
      section: message.section,
      componentId: message.componentId,
      visualization: message.visualization,
      inspectorOpen: message.inspectorOpen,
      topologyPath: message.topologyPath,
      observationVersion: message.observationVersion,
      observationAt: message.observationAt
    });
  }, []);

  useEffect(() => {
    if (!resolution || !isAuthorizedBodyId(state.bodyId)) return;
    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(DIAGNOSTICS_STATE_CHANNEL);
      channel.onmessage = event => {
        const parsed = parseDiagnosticsStateMessage(event.data);
        if (parsed) applyIncoming(parsed);
      };
    }
    const onWindowMessage = (event: MessageEvent) => {
      const iframeWindow = iframeRef.current?.contentWindow;
      const frameOrigin = resolution.iframeSrc ? new URL(resolution.iframeSrc).origin : window.location.origin;
      if (!isTrustedPostMessage(event, {
        allowedOrigins: [window.location.origin, frameOrigin],
        expectedSource: iframeWindow ?? undefined
      })) return;
      const parsed = parseDiagnosticsStateMessage(event.data);
      if (parsed && (parsed.type === DIAGNOSTICS_STATE_TYPE)) applyIncoming(parsed);
    };
    window.addEventListener('message', onWindowMessage);
    return () => {
      window.removeEventListener('message', onWindowMessage);
      channel?.close();
    };
  }, [resolution, applyIncoming, state.bodyId]);

  useEffect(() => {
    if (!resolution || !isAuthorizedBodyId(state.bodyId)) return;
    const snapshot = JSON.stringify(state);
    if (snapshot === lastPublished.current) return;
    lastPublished.current = snapshot;
    if (suppressBroadcast.current) {
      suppressBroadcast.current = false;
      return;
    }
    const message = createDiagnosticsStateMessage(state, localSourceId.current, sequence.current++);
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(DIAGNOSTICS_STATE_CHANNEL);
      channel.postMessage(message);
      channel.close();
    }
    const iframeWindow = iframeRef.current?.contentWindow;
    if (iframeWindow && resolution.iframeSrc) {
      iframeWindow.postMessage(message, new URL(resolution.iframeSrc).origin);
    }
  }, [state, resolution]);

  const iframeSrc = useMemo(() => {
    if (!resolution?.iframeSrc || !isAuthorizedBodyId(state.bodyId)) return null;
    const url = new URL(resolution.iframeSrc);
    url.searchParams.set('bodyId', state.bodyId);
    url.searchParams.set('leewayTrustedOrigins', window.location.origin);
    if (state.observationVersion) url.searchParams.set('observationVersion', state.observationVersion);
    return url.toString();
  }, [resolution, state.bodyId, state.observationVersion]);

  if (resolution && resolution.state !== 'AUTHORIZED') {
    return (
      <main className="h-full min-h-0 overflow-hidden bg-[#020812] p-6 text-slate-200"
        aria-label="Original LeeWay Diagnostics Matrix unavailable">
        <div className="rounded border border-rose-900/60 bg-rose-950/30 p-4" role="status">
          <strong>Diagnostics surface unavailable</strong>
          <p className="mt-2 text-sm">{resolution.reason || 'DIAGNOSTICS_SURFACE_UNAUTHORIZED'}</p>
          <p className="mt-1 text-xs text-slate-400">
            Source: {resolution.source}. No local address or device identity was substituted.
          </p>
        </div>
      </main>
    );
  }

  if (!iframeSrc) {
    return (
      <main className="h-full min-h-0 overflow-hidden bg-[#020812] p-6 text-slate-200"
        aria-label="Original LeeWay Diagnostics Matrix connecting">
        <div className="rounded border border-cyan-900/60 bg-cyan-950/20 p-4" role="status">
          Resolving authorized Diagnostics surface…
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-full min-h-0 isolate overflow-hidden bg-[#020812]" aria-label="Original LeeWay Diagnostics Matrix">
      <iframe
        ref={iframeRef}
        title="LeeWay Original Diagnostics Matrix"
        src={iframeSrc}
        className="absolute inset-0 h-full w-full border-0"
        sandbox="allow-same-origin allow-scripts allow-downloads"
      />
    </main>
  );
}

export const DIAGNOSTICS_SYNC_CONTRACT = Object.freeze({
  type: DIAGNOSTICS_STATE_TYPE,
  channel: DIAGNOSTICS_STATE_CHANNEL,
  sections: ['DIAG', 'BOARD', 'AGENTS', 'BUS', 'VERITAS', 'PROBES', 'SHELL', 'SETUP'] as DiagnosticsSection[],
  visualizations: ['2D', '3D', 'PCB', 'THERMAL', 'TOPOLOGY', 'XRAY', 'CAD', 'LIVE_SENSOR', 'BUS_ANALYSIS'] as DiagnosticsVisualization[]
});
