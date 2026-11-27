/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.FRONTEND.WORKSPACE_ENGINE
TAG: LEEWAY.CORE.CONFIGURABLE.PANEL.GRID.V1

5WH:
WHAT = Configurable enterprise workspace panel engine supporting drag-and-drop, keyboard reordering, resizing, collapse, maximize, pin, hide/restore, and saved views.
WHY = Satisfy Section 05 workspace customization across mouse, keyboard, and touch without requiring heavy executive approval for layout edits.
WHO = Creator/Human Authority via Leeway Innovations.
WHERE = src/components/workspace/WorkspaceEngine.tsx
WHEN = 2026-11-27
HOW = React state synchronized with localStorage preference cache and server /api/workspace/views endpoint.

LICENSE = Apache-2.0
*/
import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  Maximize2,
  Minimize2,
  Pin,
  RotateCcw,
  Save,
  X,
} from 'lucide-react';
import type { WorkspacePanelConfig, WorkspaceView } from '../../types/leeway';

export interface WorkspacePanelDefinition {
  id: string;
  title: string;
  subtitle?: string;
  defaultSpan: 1 | 2 | 3;
  render: (isMaximized: boolean) => React.ReactNode;
}

export function WorkspaceEngine({
  sectionId,
  definitions,
  savedViews,
  onSaveView,
}: {
  sectionId: string;
  definitions: WorkspacePanelDefinition[];
  savedViews: WorkspaceView[];
  onSaveView: (name: string, sectionId: string, panels: WorkspacePanelConfig[]) => Promise<void>;
}) {
  const defaultConfigs: WorkspacePanelConfig[] = definitions.map((d) => ({
    id: d.id,
    title: d.title,
    span: d.defaultSpan,
    collapsed: false,
    pinned: false,
    hidden: false,
  }));

  const [panels, setPanels] = useState<WorkspacePanelConfig[]>(() => {
    try {
      const cached = window.localStorage.getItem(`leeway_core_layout_${sectionId}`);
      if (cached) {
        const parsed = JSON.parse(cached) as WorkspacePanelConfig[];
        if (Array.isArray(parsed) && parsed.length === definitions.length) {
          return parsed;
        }
      }
    } catch {
      // Ignore storage failures
    }
    return defaultConfigs;
  });

  const [editMode, setEditMode] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [maximizedId, setMaximizedId] = useState<string | null>(null);
  const [viewName, setViewName] = useState('');
  const [saving, setSaving] = useState(false);

  const persistLocal = (next: WorkspacePanelConfig[]) => {
    setPanels(next);
    try {
      window.localStorage.setItem(`leeway_core_layout_${sectionId}`, JSON.stringify(next));
    } catch {
      // Ignore
    }
  };

  const movePanel = (id: string, delta: -1 | 1) => {
    const idx = panels.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const nextIdx = idx + delta;
    if (nextIdx < 0 || nextIdx >= panels.length) return;
    const copy = [...panels];
    const [item] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, item);
    persistLocal(copy);
  };

  const reorderByDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const fromIdx = panels.findIndex((p) => p.id === draggedId);
    const toIdx = panels.findIndex((p) => p.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const copy = [...panels];
    const [item] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, item);
    setDraggedId(null);
    persistLocal(copy);
  };

  const updatePanel = (id: string, patch: Partial<WorkspacePanelConfig>) => {
    persistLocal(panels.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const cycleSpan = (id: string) => {
    const current = panels.find((p) => p.id === id);
    if (!current) return;
    const nextSpan: 1 | 2 | 3 = current.span === 1 ? 2 : current.span === 2 ? 3 : 1;
    updatePanel(id, { span: nextSpan });
  };

  const orderedPanels = [
    ...panels.filter((p) => p.pinned && !p.hidden),
    ...panels.filter((p) => !p.pinned && !p.hidden),
  ];
  const hiddenPanels = panels.filter((p) => p.hidden);
  const sectionSavedViews = savedViews.filter((v) => v.sectionId === sectionId);
  const maximizedDef = definitions.find((d) => d.id === maximizedId);

  const handleSaveView = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewName.trim()) return;
    setSaving(true);
    try {
      await onSaveView(viewName.trim(), sectionId, panels);
      setViewName('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Workspace Customization Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#252D3D] bg-[#121721] px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setEditMode((v) => !v)}
            className={`rounded border px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
              editMode
                ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#F8E7A1]'
                : 'border-[#2D3648] bg-[#171D2A] text-slate-200 hover:border-[#D4AF37]/60'
            }`}
          >
            {editMode ? 'Done Customizing Layout' : 'Customize Workspace Layout'}
          </button>

          <button
            type="button"
            onClick={() => persistLocal(defaultConfigs)}
            className="inline-flex items-center gap-1.5 rounded border border-[#2D3648] bg-[#171D2A] px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500 whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restore Default</span>
          </button>

          {hiddenPanels.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-400">Hidden ({hiddenPanels.length}):</span>
              {hiddenPanels.map((hp) => (
                <button
                  key={hp.id}
                  type="button"
                  onClick={() => updatePanel(hp.id, { hidden: false })}
                  className="inline-flex items-center gap-1 rounded border border-[#2D3648] bg-[#171D2A] px-2 py-1 text-xs text-[#38BDF8] hover:border-[#38BDF8]"
                >
                  <Eye className="h-3 w-3" />
                  <span>Restore {hp.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sectionSavedViews.length > 0 && (
            <select
              aria-label="Load saved operational view"
              defaultValue=""
              onChange={(e) => {
                const chosen = sectionSavedViews.find((v) => v.id === e.target.value);
                if (chosen) persistLocal(chosen.panels);
              }}
              className="rounded border border-[#2D3648] bg-[#0E131C] px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="" disabled>
                Load Saved View ({sectionSavedViews.length})
              </option>
              {sectionSavedViews.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          )}

          <form onSubmit={handleSaveView} className="flex items-center gap-1.5">
            <input
              type="text"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              placeholder="Save view name..."
              className="w-36 rounded border border-[#2D3648] bg-[#0E131C] px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={saving || !viewName.trim()}
              className="inline-flex items-center gap-1 rounded border border-[#D4AF37]/60 bg-[#D4AF37]/10 px-2.5 py-1.5 text-xs font-medium text-[#F8E7A1] hover:bg-[#D4AF37]/20 disabled:opacity-40 whitespace-nowrap"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save View</span>
            </button>
          </form>
        </div>
      </div>

      {/* Configurable 3-column Responsive Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {orderedPanels.map((cfg) => {
          const def = definitions.find((d) => d.id === cfg.id);
          if (!def) return null;
          const spanClass =
            cfg.span === 3 ? 'lg:col-span-3' : cfg.span === 2 ? 'lg:col-span-2' : 'lg:col-span-1';

          return (
            <section
              key={cfg.id}
              draggable={editMode}
              onDragStart={() => setDraggedId(cfg.id)}
              onDragOver={(e) => {
                if (editMode) e.preventDefault();
              }}
              onDrop={() => {
                if (editMode) reorderByDrop(cfg.id);
              }}
              className={`${spanClass} rounded-lg border ${
                cfg.pinned ? 'border-[#D4AF37]/50' : 'border-[#252D3D]'
              } bg-[#121721] flex flex-col`}
            >
              <header className="flex items-center justify-between gap-2 border-b border-[#1F2736] px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  {editMode && (
                    <span
                      title="Drag panel to reorder"
                      className="cursor-grab text-[#D4AF37] shrink-0"
                    >
                      <GripVertical className="h-4 w-4" />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => updatePanel(cfg.id, { collapsed: !cfg.collapsed })}
                    aria-label={cfg.collapsed ? `Expand ${cfg.title}` : `Collapse ${cfg.title}`}
                    className="text-slate-400 hover:text-white shrink-0"
                  >
                    {cfg.collapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-sm font-semibold text-white">
                      {def.title}
                    </h3>
                    {def.subtitle && (
                      <p className="truncate text-[11px] text-slate-400">{def.subtitle}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {editMode && (
                    <>
                      <button
                        type="button"
                        onClick={() => movePanel(cfg.id, -1)}
                        title="Move panel earlier"
                        aria-label={`Move ${cfg.title} earlier`}
                        className="rounded p-1 text-slate-400 hover:bg-[#1E2534] hover:text-white"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => movePanel(cfg.id, 1)}
                        title="Move panel later"
                        aria-label={`Move ${cfg.title} later`}
                        className="rounded p-1 text-slate-400 hover:bg-[#1E2534] hover:text-white"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => cycleSpan(cfg.id)}
                        title="Resize panel width (1x / 2x / 3x)"
                        className="rounded border border-[#2D3648] px-1.5 py-0.5 font-mono text-[10px] text-[#38BDF8] hover:border-[#38BDF8]"
                      >
                        {cfg.span}×
                      </button>
                      <button
                        type="button"
                        onClick={() => updatePanel(cfg.id, { hidden: true })}
                        title="Hide panel"
                        aria-label={`Hide ${cfg.title}`}
                        className="rounded p-1 text-slate-400 hover:bg-[#1E2534] hover:text-rose-300"
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => updatePanel(cfg.id, { pinned: !cfg.pinned })}
                    title={cfg.pinned ? 'Unpin panel' : 'Pin panel'}
                    aria-label={cfg.pinned ? `Unpin ${cfg.title}` : `Pin ${cfg.title}`}
                    className={`rounded p-1 ${
                      cfg.pinned ? 'text-[#D4AF37]' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaximizedId(cfg.id)}
                    title="Maximize panel"
                    aria-label={`Maximize ${cfg.title}`}
                    className="rounded p-1 text-slate-400 hover:bg-[#1E2534] hover:text-white"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </header>

              {!cfg.collapsed && <div className="p-4 flex-1">{def.render(false)}</div>}
            </section>
          );
        })}
      </div>

      {/* Maximized Inspection Modal */}
      {maximizedDef && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={maximizedDef.title}
        >
          <div className="flex max-h-[90vh] w-full max-w-6xl flex-col rounded-xl border border-[#D4AF37]/50 bg-[#121721]">
            <header className="flex items-center justify-between border-b border-[#252D3D] px-5 py-3.5">
              <div>
                <h2 className="font-display text-lg font-semibold text-white">
                  {maximizedDef.title}
                </h2>
                {maximizedDef.subtitle && (
                  <p className="text-xs text-slate-400">{maximizedDef.subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMaximizedId(null)}
                  className="inline-flex items-center gap-1.5 rounded border border-[#2D3648] bg-[#171D2A] px-3 py-1.5 text-xs text-slate-200 hover:border-[#D4AF37]"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span>Exit Maximized</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMaximizedId(null)}
                  aria-label="Close modal"
                  className="rounded p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>
            <div className="overflow-y-auto p-6">{maximizedDef.render(true)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
