import React, { useEffect, useState, useRef } from 'react';
import {
  Bot,
  BriefcaseBusiness,
  FileText,
  FolderArchive,
  HeartPulse,
  ExternalLink,
  Pin,
  Trash2,
  RefreshCw,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import type { WorkstationAppId } from '../types';
import { PUBLISHED_LEEWAY_APPS } from '../publishedApps';
import { GalacticMeshBackground } from './GalacticMeshBackground';

type Props = {
  workboardStatus: string;
  onOpenSurface: (surface: WorkstationAppId) => void;
  onPinToTaskbar?: (appId: WorkstationAppId) => void;
};

type ProviderObservation = { id: string; configured?: boolean };

type DesktopItem = {
  id: WorkstationAppId;
  label: string;
  detail: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  image?: string;
  gradient: string;
};

const INITIAL_DESKTOP_APPS: DesktopItem[] = [
  ...PUBLISHED_LEEWAY_APPS.filter(app => app.id !== 'workforce').map(app => ({
    id: app.id as WorkstationAppId,
    label: app.shortTitle,
    detail: app.title,
    image: app.iconImage,
    gradient: app.gradient,
    icon: undefined
  }))
];

const STORAGE_KEY = 'leeway_tablet_desktop_apps_v1';

export function AgentCommandCenter({ workboardStatus, onOpenSurface, onPinToTaskbar }: Props) {
  const [runtimeState, setRuntimeState] = useState('CHECKING');
  const [observed, setObserved] = useState<ProviderObservation[]>([]);
  const [desktopApps, setDesktopApps] = useState<DesktopItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        const map = new Map(INITIAL_DESKTOP_APPS.map(a => [a.id, a]));
        const result: DesktopItem[] = [];
        const seen = new Set<WorkstationAppId>();
        for (const id of ids) {
          const item = map.get(id as WorkstationAppId);
          if (item && !seen.has(item.id)) {
            seen.add(item.id);
            result.push(item);
          }
        }
        return result.length > 0 ? result : INITIAL_DESKTOP_APPS;
      }
    } catch {}
    return INITIAL_DESKTOP_APPS;
  });

  const [draggedAppId, setDraggedAppId] = useState<WorkstationAppId | null>(null);
  const [dragOverAppId, setDragOverAppId] = useState<WorkstationAppId | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    app: DesktopItem | null;
  } | null>(null);

  const [propModalApp, setPropModalApp] = useState<DesktopItem | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Save desktop arrangement
  const persistApps = (items: DesktopItem[]) => {
    setDesktopApps(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map(a => a.id)));
    } catch {}
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/agent-roster', { cache: 'no-store', signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
      .then(data => {
        setRuntimeState(typeof data.state === 'string' ? data.state : 'UNVERIFIED');
        setObserved(Array.isArray(data.clients) ? data.clients : []);
      })
      .catch(error => { if (error?.name !== 'AbortError') setRuntimeState('STATUS UNAVAILABLE'); });
    return () => controller.abort();
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Drag and drop reordering
  const handleDragStart = (e: React.DragEvent, app: DesktopItem) => {
    setDraggedAppId(app.id);
    e.dataTransfer.setData('text/leeway-app-id', app.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetApp: DesktopItem) => {
    e.preventDefault();
    if (draggedAppId && draggedAppId !== targetApp.id) {
      setDragOverAppId(targetApp.id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetApp: DesktopItem) => {
    e.preventDefault();
    setDragOverAppId(null);
    if (!draggedAppId || draggedAppId === targetApp.id) return;

    const fromIndex = desktopApps.findIndex(a => a.id === draggedAppId);
    const toIndex = desktopApps.findIndex(a => a.id === targetApp.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      const next = [...desktopApps];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      persistApps(next);
    }
    setDraggedAppId(null);
  };

  // Context Menu Handlers
  const handleAppContextMenu = (e: React.MouseEvent, app: DesktopItem) => {
    e.preventDefault();
    e.stopPropagation();
    const bounds = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    const menuWidth = 220;
    const menuHeight = 260;
    const x = Math.min(e.clientX - bounds.left, bounds.width - menuWidth - 10);
    const y = Math.min(e.clientY - bounds.top, bounds.height - menuHeight - 10);
    setContextMenu({ x, y, app });
  };

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const bounds = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    const menuWidth = 200;
    const menuHeight = 160;
    const x = Math.min(e.clientX - bounds.left, bounds.width - menuWidth - 10);
    const y = Math.min(e.clientY - bounds.top, bounds.height - menuHeight - 10);
    setContextMenu({ x, y, app: null });
  };

  const handleLaunchWidget = (appId: WorkstationAppId) => {
    if (window.leewayNative?.openAppWidget) {
      void window.leewayNative.openAppWidget(appId as any);
    }
  };

  const handlePin = (appId: WorkstationAppId) => {
    if (onPinToTaskbar) {
      onPinToTaskbar(appId);
    } else {
      window.dispatchEvent(new CustomEvent('leeway:pin-to-taskbar', { detail: { appId } }));
    }
  };

  const handleRemoveFromDesktop = (appId: WorkstationAppId) => {
    const next = desktopApps.filter(a => a.id !== appId);
    persistApps(next);
  };

  const handleAutoArrange = () => {
    persistApps(INITIAL_DESKTOP_APPS);
  };

  return (
    <main
      ref={containerRef}
      onContextMenu={handleBackgroundContextMenu}
      className="relative flex-grow overflow-hidden bg-black text-white select-none"
    >
      <GalacticMeshBackground tint="#3b82f6" density={700} style="all" speed={0.3} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,rgba(37,99,235,.14),transparent_34%),linear-gradient(90deg,rgba(0,0,0,.18),transparent_52%,rgba(0,0,0,.12))]" />

      {/* Desktop Icons Grid */}
      <section
        aria-label="Desktop Shortcuts"
        className="absolute inset-y-0 left-0 z-10 grid auto-cols-[92px] grid-flow-col grid-rows-4 content-start gap-x-3 gap-y-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-5 pr-40"
      >
        {desktopApps.map(app => {
          const Icon = app.icon;
          const isDragOver = dragOverAppId === app.id;
          return (
            <div
              key={app.id}
              draggable
              onDragStart={e => handleDragStart(e, app)}
              onDragOver={e => handleDragOver(e, app)}
              onDragLeave={() => setDragOverAppId(null)}
              onDrop={e => handleDrop(e, app)}
              onContextMenu={e => handleAppContextMenu(e, app)}
              onClick={() => onOpenSurface(app.id)}
              title={`${app.detail} (Right click for Jump List)`}
              className={`group relative flex h-[92px] w-[88px] flex-col items-center justify-start rounded-2xl p-1.5 text-center transition cursor-pointer hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${isDragOver ? 'scale-105 ring-2 ring-cyan-400 bg-white/15' : ''}`}
            >
              <span
                className={`relative flex h-[58px] w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-white/30 bg-gradient-to-br ${app.gradient} shadow-[0_10px_24px_rgba(0,0,0,.55),inset_0_1px_1px_rgba(255,255,255,.4)] transition group-hover:-translate-y-1 group-hover:scale-105`}
              >
                {app.image ? (
                  <img src={app.image} alt="" className="h-full w-full object-cover" draggable={false} />
                ) : Icon ? (
                  <Icon size={29} />
                ) : null}
                <span className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/25" />
              </span>
              <strong className="mt-1.5 line-clamp-2 max-w-[86px] text-[10px] font-extrabold leading-[12px] text-white [text-shadow:0_2px_3px_#000,0_0_5px_#000]">
                {app.label}
              </strong>
            </div>
          );
        })}
      </section>

      {/* Right-Click Context Menu / Jump List (Windows 11 Style) */}
      {contextMenu && (
        <div
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
          className="absolute z-50 min-w-[200px] rounded-xl border border-cyan-400/30 bg-slate-950/90 p-1.5 text-xs text-white shadow-[0_16px_40px_rgba(0,0,0,.8),0_0_20px_rgba(34,211,238,.2)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100"
        >
          {contextMenu.app ? (
            <>
              {/* App Jump List Header */}
              <div className="flex items-center gap-2 border-b border-white/10 px-2 py-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/10">
                  {contextMenu.app.image ? (
                    <img src={contextMenu.app.image} alt="" className="h-4 w-4 object-cover" />
                  ) : contextMenu.app.icon ? (
                    React.createElement(contextMenu.app.icon, { size: 14 })
                  ) : (
                    <Layers size={14} />
                  )}
                </span>
                <div className="overflow-hidden">
                  <div className="truncate font-black text-cyan-200">{contextMenu.app.label}</div>
                  <div className="truncate text-[9px] text-zinc-400">{contextMenu.app.detail}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    onOpenSurface(contextMenu.app!.id);
                    setContextMenu(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-bold text-white hover:bg-cyan-500/20 hover:text-cyan-200"
                >
                  <Sparkles size={13} className="text-cyan-400" />
                  <span>Open in Tablet</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleLaunchWidget(contextMenu.app!.id);
                    setContextMenu(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-bold text-white hover:bg-cyan-500/20 hover:text-cyan-200"
                >
                  <ExternalLink size={13} className="text-amber-400" />
                  <span>Launch as Floating Widget</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handlePin(contextMenu.app!.id);
                    setContextMenu(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-bold text-white hover:bg-cyan-500/20 hover:text-cyan-200"
                >
                  <Pin size={13} className="text-emerald-400" />
                  <span>Pin to Taskbar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleRemoveFromDesktop(contextMenu.app!.id);
                    setContextMenu(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-bold text-rose-300 hover:bg-rose-500/20 hover:text-rose-200"
                >
                  <Trash2 size={13} />
                  <span>Remove from Desktop</span>
                </button>
              </div>

              <div className="border-t border-white/10 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPropModalApp(contextMenu.app);
                    setContextMenu(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-[10px] text-zinc-400 hover:bg-white/10 hover:text-white"
                >
                  <Info size={12} />
                  <span>Properties</span>
                </button>
              </div>
            </>
          ) : (
            /* Desktop Background Context Menu */
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  handleAutoArrange();
                  setContextMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-bold text-white hover:bg-cyan-500/20 hover:text-cyan-200"
              >
                <RefreshCw size={13} className="text-cyan-400" />
                <span>Auto-arrange Icons</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleAutoArrange();
                  setContextMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-bold text-white hover:bg-cyan-500/20 hover:text-cyan-200"
              >
                <Layers size={13} className="text-emerald-400" />
                <span>Restore All Shortcuts</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Properties Modal */}
      {propModalApp && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm" onClick={() => setPropModalApp(null)}>
          <div className="w-[320px] rounded-2xl border border-cyan-400/40 bg-slate-950 p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${propModalApp.gradient}`}>
                {propModalApp.image ? <img src={propModalApp.image} alt="" className="h-8 w-8 object-cover" /> : propModalApp.icon ? React.createElement(propModalApp.icon, { size: 24 }) : null}
              </span>
              <div>
                <div className="font-black text-cyan-200">{propModalApp.label}</div>
                <div className="text-[10px] text-zinc-400">{propModalApp.detail}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1.5 text-[10px] text-zinc-300">
              <div><strong className="text-zinc-500">ID:</strong> {propModalApp.id}</div>
              <div><strong className="text-zinc-500">Architecture:</strong> LeeWay Governed Floating Widget (LFW-v1.0)</div>
              <div><strong className="text-zinc-500">Session Mode:</strong> Persistent Canonical WebContents</div>
            </div>
            <button
              type="button"
              onClick={() => setPropModalApp(null)}
              className="mt-4 w-full rounded-xl bg-cyan-500/20 py-1.5 text-center text-xs font-black text-cyan-200 hover:bg-cyan-500/30"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
