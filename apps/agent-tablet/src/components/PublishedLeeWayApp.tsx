import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MonitorUp } from 'lucide-react';
import { PUBLISHED_LEEWAY_APP_BY_ID, publishedAppSurfaceUrl, type PublishedLeeWayAppId } from '../publishedApps';
import type { PublishedAppSurfaceDecision } from '../mobileSurfacePolicy.mjs';
import type { WorkstationAppId } from '../types';
import { isCompactTabletViewport } from '../mobileSurfacePolicy.mjs';

declare global {
  interface Window {
    leewayNative?: {
      openAppWidget: (appId: Exclude<WorkstationAppId, 'desktop'>) => Promise<{ state: string; appId: string }>;
      closeAppWidget: (appId: Exclude<WorkstationAppId, 'desktop'>) => Promise<{ state: string; appId: string }>;
      controlAppWidget: (appId: Exclude<WorkstationAppId, 'desktop'>, action: 'center' | 'larger' | 'smaller' | 'reload') => Promise<{ state: string; appId: string }>;
    };
  }
}

type Props = { appId: PublishedLeeWayAppId; onBack: () => void; resolution?: PublishedAppSurfaceDecision };

// The tablet renders the real application directly.  It intentionally does
// not paint a captured widget frame or replay tablet input into another page:
// those techniques break WebGL, camera, voice, editors, and component state.
// Both surfaces receive the stable `leewaySession` contract; the application
// source owns its canonical shared state adapter.
export function PublishedLeeWayApp({ appId, onBack, resolution }: Props) {
  const app = PUBLISHED_LEEWAY_APP_BY_ID[appId];
  const rootRef = useRef<HTMLElement | null>(null);
  const [compact, setCompact] = useState(() => typeof window !== 'undefined' && isCompactTabletViewport(window.innerWidth, window.innerHeight));
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
  const surfaceUrl = publishedAppSurfaceUrl(app, 'tablet', compact, resolution);

  return (
    <section ref={rootRef} className="relative flex min-h-0 min-w-0 flex-grow overflow-hidden bg-black" aria-label={`${app.title} application surface`}>
      <div className="pointer-events-none absolute left-2 top-2 z-20 hidden items-center gap-2 sm:flex rounded-full border border-cyan-300/30 bg-slate-950/80 px-2 py-1 text-[8px] font-black tracking-[.1em] text-cyan-100 shadow-lg backdrop-blur"><MonitorUp size={11} /><span>{app.title}</span><span className="text-cyan-200">SESSION {appId}</span></div>
      <button type="button" onClick={onBack} aria-label="Return to LeeWay Tablet home" className="absolute right-2 top-2 z-20 flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full border border-white/20 bg-slate-950/85 px-3 py-2 text-xs font-black text-white shadow-lg backdrop-blur hover:bg-slate-800 focus-visible:outline focus-visible:outline-cyan-300"><ArrowLeft size={11} />HOME</button>
      {surfaceUrl ? (
        <iframe title={`${app.title} tablet application`} src={surfaceUrl} className="h-full w-full border-0 bg-black" allow="camera; microphone; autoplay; clipboard-read; clipboard-write" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-black px-6 text-center text-xs text-slate-300" role="status">
          <span className="font-black tracking-[.12em] text-cyan-200">{app.title} UNAVAILABLE</span>
          <span>No authorized hosted application or connected local adapter was resolved. Entitlement and customer records are unchanged.</span>
        </div>
      )}
    </section>
  );
}
