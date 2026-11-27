/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.UI.LAYERS
TAG: LEEWAY.UI.LAYER.EDITOR

5WH:
WHAT = Right sidebar inspector displaying extracted independent visual layers and quick procedural animation controls.
WHY = Enable rapid selection, role switching, preset assignment, RPM/speed tuning, anchor snapping, and layer merging inside the Studio view.
WHO = Leeway Innovations — KineticGlyph Studio UI
WHERE = src/components/LayerPanel.tsx
WHEN = 2026-11-27
HOW = Renders layer list from SegmentedLayer[] and dispatches immutable layer updates or merge actions to parent state.

LICENSE = Apache-2.0
*/

import React from 'react';
import {
  Eye,
  EyeOff,
  Merge,
  RotateCw,
  Monitor,
  Gauge,
  Cpu,
  Layers,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import {
  AnimationMode,
  LayerRole,
  PivotAnchorPreset,
  SegmentedLayer,
} from '../types/studio';
import {
  CANVAS_SIZE,
  computePivotForPreset,
  defaultEasingForMode,
  defaultModeForRole,
} from '../engine/segmenter';

interface LayerPanelProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  layers: SegmentedLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (id: string, patch: Partial<SegmentedLayer>) => void;
  onMergeWithNext: (id: string) => void;
}

function RoleIcon({ role }: { role: LayerRole }) {
  switch (role) {
    case 'gear':
      return <RotateCw className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    case 'screen':
      return <Monitor className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    case 'gauge':
      return <Gauge className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
    case 'circuit':
      return <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    case 'chassis':
    default:
      return <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  }
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  collapsed,
  onToggleCollapse,
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onMergeWithNext,
}) => {
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? layers[0] ?? null;
  const selectedIdx = selectedLayer ? layers.findIndex((l) => l.id === selectedLayer.id) : -1;

  if (collapsed) {
    return (
      <aside className="w-full lg:w-11 border-t lg:border-t-0 lg:border-l border-slate-800 bg-[#0F1520] flex lg:flex-col items-center justify-between lg:justify-start px-3 py-2 lg:py-3 gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Expand Layers Panel"
          title="Expand Layers Panel"
          className="p-1.5 rounded-lg border border-slate-700 bg-[#151C28] hover:border-sky-400 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <PanelRightOpen className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono text-slate-400 lg:hidden">
          Layers ({layers.filter((l) => l.visible).length}/{layers.length})
        </span>
        <span className="hidden lg:block text-[11px] font-mono text-slate-500 [writing-mode:vertical-rl] tracking-wider select-none">
          Layers ({layers.length})
        </span>
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-[320px] border-t lg:border-t-0 lg:border-l border-slate-800 bg-[#0F1520] flex flex-col shrink-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 gap-2">
        <h2 className="text-xs font-semibold text-slate-200">
          Segmented Layers
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 tabular-nums">
            {layers.filter((l) => l.visible).length}/{layers.length} active
          </span>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Collapse Layers Panel"
            title="Collapse Layers Panel"
            className="p-1 rounded border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <PanelRightClose className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {layers.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
            Upload an icon or select a fixture to extract independent layers.
          </div>
        ) : (
          layers.map((layer) => {
            const active = selectedLayer?.id === layer.id;
            return (
              <div
                key={layer.id}
                onClick={() => onSelectLayer(layer.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectLayer(layer.id);
                  }
                }}
                className={`flex items-center gap-2.5 p-2 rounded-lg border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  active
                    ? 'border-sky-500/60 bg-sky-500/10'
                    : 'border-slate-800/90 bg-[#151C28]/70 hover:border-slate-700'
                }`}
              >
                <div className="w-9 h-9 rounded bg-slate-950/90 border border-slate-800 p-1 flex items-center justify-center shrink-0">
                  <img
                    src={layer.croppedSpriteUrl}
                    alt={layer.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <RoleIcon role={layer.role} />
                    <span className="text-xs font-medium text-slate-100 truncate">
                      {layer.name}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 tabular-nums mt-0.5 truncate">
                    {layer.animationMode} · {layer.interiorSubRegion ? 'masked' : `${layer.metrics.area}px`}
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={layer.visible ? `Hide ${layer.name}` : `Show ${layer.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateLayer(layer.id, { visible: !layer.visible });
                  }}
                  className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 cursor-pointer"
                >
                  {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })
        )}
      </div>

      {selectedLayer && (
        <div className="border-t border-slate-800 bg-[#0D131D] p-4 space-y-3 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-200 truncate">
              {selectedLayer.name}
            </span>
            {selectedIdx >= 0 && selectedIdx < layers.length - 1 && (
              <button
                type="button"
                onClick={() => onMergeWithNext(selectedLayer.id)}
                className="px-2 py-1 rounded border border-slate-700 bg-[#151C28] hover:border-slate-500 text-[11px] text-slate-300 flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Merge className="w-3 h-3" />
                Merge Next
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="layer-role" className="block text-[11px] text-slate-400 mb-1">
                Component Role
              </label>
              <select
                id="layer-role"
                value={selectedLayer.role}
                onChange={(e) => {
                  const role = e.target.value as LayerRole;
                  const mode = defaultModeForRole(role);
                  onUpdateLayer(selectedLayer.id, {
                    role,
                    animationMode: mode,
                    easing: defaultEasingForMode(mode),
                  });
                }}
                className="w-full rounded-lg bg-[#151C28] border border-slate-700 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
              >
                <option value="gear">Mechanical Gear</option>
                <option value="screen">Telemetry Screen</option>
                <option value="gauge">Gauge / Meter</option>
                <option value="circuit">Circuit Path</option>
                <option value="chassis">Chassis Base</option>
              </select>
            </div>

            <div>
              <label htmlFor="layer-mode" className="block text-[11px] text-slate-400 mb-1">
                Animation Preset
              </label>
              <select
                id="layer-mode"
                value={selectedLayer.animationMode}
                onChange={(e) => {
                  const mode = e.target.value as AnimationMode;
                  onUpdateLayer(selectedLayer.id, {
                    animationMode: mode,
                    easing: defaultEasingForMode(mode),
                  });
                }}
                className="w-full rounded-lg bg-[#151C28] border border-slate-700 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
              >
                <option value="rotate-cw">Rotate CW</option>
                <option value="rotate-ccw">Rotate CCW</option>
                <option value="gear-ratchet">Gear Ratchet</option>
                <option value="fan-spin">Fan Spin</option>
                <option value="screen-oscilloscope">Oscilloscope</option>
                <option value="screen-code">Scrolling Code</option>
                <option value="screen-radar">Radar Sweep</option>
                <option value="gauge-needle">Needle Sweep</option>
                <option value="gauge-fluid">Fluid Level</option>
                <option value="circuit-pulse">Circuit Surge</option>
                <option value="ambient-breathe">Ambient Breathe</option>
                <option value="static">Static</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <label htmlFor="layer-speed" className="text-slate-400">
                Speed / RPM Scale
              </label>
              <span className="font-mono text-slate-200 tabular-nums">
                {selectedLayer.speed.toFixed(1)}x ({Math.round(selectedLayer.rpm * selectedLayer.speed)} RPM)
              </span>
            </div>
            <input
              id="layer-speed"
              type="range"
              min={0.2}
              max={3.5}
              step={0.1}
              value={selectedLayer.speed}
              onChange={(e) =>
                onUpdateLayer(selectedLayer.id, { speed: Number(e.target.value) })
              }
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="pivot-preset" className="block text-[11px] text-slate-400 mb-1">
                Pivot Anchor
              </label>
              <select
                id="pivot-preset"
                value={selectedLayer.pivotPreset}
                onChange={(e) => {
                  const preset = e.target.value as PivotAnchorPreset;
                  const pivotPercent = computePivotForPreset(
                    preset,
                    selectedLayer.bbox,
                    selectedLayer.metrics.centroid,
                    selectedLayer.metrics.geometricCenter,
                    CANVAS_SIZE
                  );
                  onUpdateLayer(selectedLayer.id, { pivotPreset: preset, pivotPercent });
                }}
                className="w-full rounded-lg bg-[#151C28] border border-slate-700 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
              >
                <option value="geometric-center">Geometric Center</option>
                <option value="centroid">Pixel Centroid</option>
                <option value="bottom-center">Bottom Anchor</option>
                <option value="top-center">Top Anchor</option>
                <option value="custom">Custom XY</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <label htmlFor="pivot-x" className="text-slate-400">
                  Pivot XY
                </label>
                <span className="font-mono text-slate-300 tabular-nums">
                  {selectedLayer.pivotPercent.x.toFixed(0)}%,{selectedLayer.pivotPercent.y.toFixed(0)}%
                </span>
              </div>
              <input
                id="pivot-x"
                type="range"
                min={5}
                max={95}
                step={0.5}
                value={selectedLayer.pivotPercent.x}
                onChange={(e) =>
                  onUpdateLayer(selectedLayer.id, {
                    pivotPreset: 'custom',
                    pivotPercent: { ...selectedLayer.pivotPercent, x: Number(e.target.value) },
                  })
                }
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
