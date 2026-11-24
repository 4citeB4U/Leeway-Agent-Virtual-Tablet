import React from 'react';
import { ArrowLeft, MonitorUp } from 'lucide-react';
import { PUBLISHED_LEEWAY_APP_BY_ID, publishedAppSurfaceUrl, type PublishedLeeWayAppId } from '../publishedApps';
import type { WorkstationAppId } from '../types';
import { CreatorCustomerMonitor } from './CreatorCustomerMonitor';

declare global {
  interface Window {
    leewayNative?: {
      openAppWidget: (appId: Exclude<WorkstationAppId, 'desktop'>) => Promise<{ state: string; appId: string }>;
      closeAppWidget: (appId: Exclude<WorkstationAppId, 'desktop'>) => Promise<{ state: string; appId: string }>;
      controlAppWidget: (appId: Exclude<WorkstationAppId, 'desktop'>, action: 'center' | 'larger' | 'smaller' | 'reload') => Promise<{ state: string; appId: string }>;
    };
  }
}

type Props = { appId: PublishedLeeWayAppId; onBack: () => void };

// The tablet renders the real application directly.  It intentionally does
// not paint a captured widget frame or replay tablet input into another page:
// those techniques break WebGL, camera, voice, editors, and component state.
// Both surfaces receive the stable `leewaySession` contract; the application
// source owns its canonical shared state adapter.
export function PublishedLeeWayApp({ appId, onBack }: Props) {
  const app = PUBLISHED_LEEWAY_APP_BY_ID[appId];
  const surfaceUrl = publishedAppSurfaceUrl(app, 'tablet');

  return (
    <section className="relative flex min-h-0 flex-grow flex-col overflow-hidden bg-black" aria-label={`${app.title} application surface`}>
      <div className="pointer-events-none absolute left-2 top-2 z-20 flex items-center gap-2 rounded-full border border-cyan-300/30 bg-slate-950/80 px-2 py-1 text-[8px] font-black tracking-[.1em] text-cyan-100 shadow-lg backdrop-blur"><MonitorUp size={11} /><span>{app.title}</span><span className="text-cyan-200">SESSION {appId}</span></div>
      <button type="button" onClick={onBack} className="absolute right-2 top-2 z-20 flex items-center gap-1 rounded-full border border-white/20 bg-slate-950/80 px-2 py-1 text-[8px] font-black text-white shadow-lg backdrop-blur hover:bg-slate-800"><ArrowLeft size={11} />HOME</button>
      {appId === 'erpCrm' && <CreatorCustomerMonitor />}
      <iframe title={`${app.title} tablet application`} src={surfaceUrl} className="min-h-0 w-full flex-grow border-0 bg-black" allow="camera; microphone; autoplay; clipboard-read; clipboard-write" />
    </section>
  );
}
