/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT_TABLET.APP_SURFACE
TAG: LEEWAY.AGENT_TABLET.LIVE_WIDGET_MIRROR.V1
WHAT: Render the live frame of the native LeeWay app widget inside the tablet and forward tablet input back to that widget in real time.
WHY: The tablet surface and the popped-out LeeWay widget must be one shared interactive session, not two independent views.
WHO: LeeWay Industries / creator-authorized outside contributor (LW-OPENCODE).
WHERE: apps/agent-tablet/src/components/PublishedLeeWayApp.tsx
WHEN: 2026-11-27
HOW: Consumes the existing Agent VT host mirror IPC; no new scheduler, authority or second application engine.
AUTHORITY: LOCAL_PRESENTATION_ONLY. No entitlement, Veritas or receipt claim.
LICENSE: Existing repository terms.
*/
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MonitorUp } from 'lucide-react';
import { PUBLISHED_LEEWAY_APP_BY_ID, publishedAppSurfaceUrl, type PublishedLeeWayAppId } from '../publishedApps';
import type { PublishedAppSurfaceDecision } from '../mobileSurfacePolicy.mjs';
import type { WorkstationAppId } from '../types';
import { isCompactTabletViewport } from '../mobileSurfacePolicy.mjs';
import { CreatorCustomerMonitor } from './CreatorCustomerMonitor';

declare global {
  interface Window {
    leewayNative?: {
      openAppWidget: (appId: Exclude<WorkstationAppId, 'desktop'>, launchOrigin?: string) => Promise<{ state: string; appId: string }>;
      closeAppWidget: (appId: Exclude<WorkstationAppId, 'desktop'>) => Promise<{ state: string; appId: string }>;
      controlAppWidget: (appId: Exclude<WorkstationAppId, 'desktop'>, action: 'center' | 'larger' | 'smaller' | 'reload') => Promise<{ state: string; appId: string }>;
      resolveAppSurface: (appId: Exclude<WorkstationAppId, 'desktop'>, surface: 'tablet' | 'widget', launchOrigin?: string) => Promise<PublishedAppSurfaceDecision>;
      authorizeCoreSurface: () => Promise<{ state: string; reason?: string }>;
      onAppMirrorFrame: (listener: (payload: { appId: string; frame: string; width: number; height: number; at: number }) => void) => () => void;
      sendAppMirrorInput: (appId: string, input: Record<string, unknown>) => void;
    };
  }
}

type Props = { appId: PublishedLeeWayAppId; onBack: () => void; resolution?: PublishedAppSurfaceDecision };
export type PublishedAppLaunchOrigin =
  | 'desktop' | 'context-menu' | 'taskbar' | 'floating-widget' | 'restored-widget'
  | 'widget-control' | 'open-request-file';

type MirrorFrame = { frame: string; width: number; height: number; at: number };

export function PublishedLeeWayApp({ appId, onBack, resolution }: Props) {
  const app = PUBLISHED_LEEWAY_APP_BY_ID[appId];
  const rootRef = useRef<HTMLElement | null>(null);
  const mirrorHostRef = useRef<HTMLDivElement | null>(null);
  const [compact, setCompact] = useState(() => typeof window !== 'undefined' && isCompactTabletViewport(window.innerWidth, window.innerHeight));
  const [mirror, setMirror] = useState<MirrorFrame | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => setCompact(isCompactTabletViewport(root.clientWidth, root.clientHeight));
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(root);
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  // Subscribe to the native host's live widget frame. When present, this is
  // the authoritative shared surface; the direct iframe is only a preview.
  useEffect(() => {
    const subscribe = window.leewayNative?.onAppMirrorFrame;
    if (typeof subscribe !== 'function') return;
    return subscribe((payload) => {
      if (!payload || payload.appId !== appId || typeof payload.frame !== 'string') return;
      setMirror({ frame: payload.frame, width: payload.width, height: payload.height, at: payload.at });
    });
  }, [appId]);

  const surfaceUrl = publishedAppSurfaceUrl(app, 'tablet', compact, resolution);

  const pointFrom = (clientX: number, clientY: number) => {
    const rect = mirrorHostRef.current?.getBoundingClientRect();
    if (!rect || !mirror || !rect.width || !rect.height) return null;
    return {
      x: Math.max(0, Math.min(mirror.width - 1, Math.round(((clientX - rect.left) / rect.width) * mirror.width))),
      y: Math.max(0, Math.min(mirror.height - 1, Math.round(((clientY - rect.top) / rect.height) * mirror.height)))
    };
  };
  const forwardInput = (input: Record<string, unknown>) => {
    if (!mirror) return;
    window.leewayNative?.sendAppMirrorInput?.(appId, input);
  };
  const onPointer = (type: string) => (event: React.PointerEvent<HTMLDivElement>) => {
    const point = pointFrom(event.clientX, event.clientY);
    if (!point) return;
    forwardInput({ type, ...point, button: event.button === 2 ? 'right' : event.button === 1 ? 'middle' : 'left', clickCount: event.type === 'pointerdown' ? 1 : 0 });
  };
  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const point = pointFrom(event.clientX, event.clientY);
    if (!point) return;
    forwardInput({ type: 'wheel', ...point, deltaX: event.deltaX, deltaY: event.deltaY });
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    forwardInput({ type: 'key', phase: 'down', key: event.key, keyCode: event.code });
  };
  const onKeyUp = (event: React.KeyboardEvent<HTMLDivElement>) => {
    forwardInput({ type: 'key', phase: 'up', key: event.key, keyCode: event.code });
  };

  return (
    <section ref={rootRef} className="relative flex min-h-0 min-w-0 flex-grow flex-col overflow-hidden bg-black" aria-label={`${app.title} application surface`}>
      <div className="pointer-events-none absolute left-2 top-2 z-20 hidden items-center gap-2 rounded-full border border-cyan-300/30 bg-slate-950/80 px-2 py-1 text-[8px] font-black tracking-[.1em] text-cyan-100 shadow-lg backdrop-blur sm:flex">
        <MonitorUp size={11} /><span>{app.title}</span><span className="text-cyan-200">SESSION {appId}</span>
        <span className={mirror ? 'text-emerald-300' : 'text-amber-300'}>{mirror ? 'LIVE WIDGET MIRROR' : 'TABLET PREVIEW'}</span>
      </div>
      <button type="button" onClick={onBack} aria-label="Return to LeeWay Tablet home" className="absolute right-2 top-2 z-20 flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full border border-white/20 bg-slate-950/85 px-3 py-2 text-xs font-black text-white shadow-lg backdrop-blur hover:bg-slate-800 focus-visible:outline focus-visible:outline-cyan-300"><ArrowLeft size={11} />HOME</button>
      {surfaceUrl && appId === 'erpCrm' && <CreatorCustomerMonitor />}
      <div
        ref={mirrorHostRef}
        tabIndex={0}
        className="absolute inset-0 bg-black"
        onPointerDown={onPointer('mouseDown')}
        onPointerUp={onPointer('mouseUp')}
        onPointerMove={onPointer('mouseMove')}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
      >
        {mirror ? (
          <img src={mirror.frame} alt={`${app.title} live widget`} className="h-full w-full bg-black object-contain" draggable={false} />
        ) : surfaceUrl ? (
          <iframe title={`${app.title} tablet application`} src={surfaceUrl} className="h-full w-full border-0 bg-black" allow="camera; microphone; autoplay; clipboard-read; clipboard-write" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center text-xs text-slate-300" role="status">
            <span className="font-black tracking-[.12em] text-cyan-200">{app.title} UNAVAILABLE</span>
            <span>No authorized hosted application or connected local adapter was resolved. Entitlement and customer records are unchanged.</span>
          </div>
        )}
      </div>
    </section>
  );
}
