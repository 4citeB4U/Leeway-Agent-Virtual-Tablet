/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.UI.INSPECTOR
TAG: LEEWAY.UI.LAYER.CHOREOGRAPHY

5WH:
WHAT = Full-viewport Layer Inspector & Choreography workbench displaying geometric segmentation metrics, interior sub-layer masks, pivot anchor calibration, and independent Idle / Hover / Active Click choreography controls.
WHY = Give designers granular control over Animation Type, Speed/RPM, Amplitude/Angle, Phase Delay, Easing Curve, Transform Origin, and multi-state behavior per layer.
WHO = Leeway Innovations — KineticGlyph Studio UI
WHERE = src/components/LayerInspectorView.tsx
WHEN = 2026-11-27
HOW = Combines interactive layer choreography editor with tabular-nums geometric metrics and visual pivot/interior-mask inspection.

LICENSE = Apache-2.0
*/

import React from 'react';
import {
  AnimationMode,
  EasingCurve,
  PivotAnchorPreset,
  SegmentedLayer,
} from '../types/studio';
import {
  CANVAS_SIZE,
  computePivotForPreset,
  defaultEasingForMode,
} from '../engine/segmenter';

interface LayerInspectorViewProps {
  layers: SegmentedLayer[];
  selectedLayerId: string | null;
  normalizedPreviewUrl: string | null;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (id: string, patch: Partial<SegmentedLayer>) => void;
  onSelectForEdit: (id: string) => void;
}

export const LayerInspectorView: React.FC<LayerInspectorViewProps> = ({
  layers,
  selectedLayerId,
  normalizedPreviewUrl,
  onSelectLayer,
  onUpdateLayer,
  onSelectForEdit,
}) => {
  const activeLayer = layers.find((l) => l.id === selectedLayerId) ?? layers[0] ?? null;

  const updateChoreography = (
    section: 'idle' | 'hover' | 'active',
    patch: Record<string, number | boolean>
  ) => {
    if (!activeLayer) return;
    onUpdateLayer(activeLayer.id, {
      choreography: {
        ...activeLayer.choreography,
        [section]: {
          ...activeLayer.choreography[section],
          ...patch,
        },
      },
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B0F17] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="font-display text-xl font-semibold text-slate-100">
              Layer Choreography &amp; Geometry Inspector
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Calibrate exact centroids, interior masked cavities, timing curves, and multi-state Idle, Hover, and Active Click rules on a {CANVAS_SIZE}×{CANVAS_SIZE}px grid.
            </p>
          </div>
          {normalizedPreviewUrl && (
            <div className="flex items-center gap-3">
              <img
                src={normalizedPreviewUrl}
                alt="Normalized source"
                className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-900 p-1 object-contain"
              />
              <span className="text-xs font-mono text-slate-400 tabular-nums">
                {layers.length} extracted layers
              </span>
            </div>
          )}
        </div>

        {/* Granular Layer Controls & Multi-State Choreography Panel */}
        {activeLayer && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Visual Sprite + Pivot + Interior Mask Inspector */}
            <div className="lg:col-span-4 border border-slate-800 rounded-xl bg-[#0F1520] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-200">
                  {activeLayer.name}
                </h2>
                <button
                  type="button"
                  onClick={() => onSelectForEdit(activeLayer.id)}
                  className="px-2.5 py-1 rounded border border-slate-700 bg-[#151C28] hover:border-sky-400 text-[11px] text-slate-200 cursor-pointer"
                >
                  Open in Stage
                </button>
              </div>

              <div className="relative aspect-square w-full max-w-[220px] mx-auto rounded-lg border border-slate-800 kg-checker-bg overflow-hidden">
                <img
                  src={activeLayer.fullSpriteUrl}
                  alt={activeLayer.name}
                  className="w-full h-full object-contain"
                />
                {activeLayer.interiorSubRegion && (
                  <div
                    style={{
                      left: `${(activeLayer.interiorSubRegion.bbox.x / CANVAS_SIZE) * 100}%`,
                      top: `${(activeLayer.interiorSubRegion.bbox.y / CANVAS_SIZE) * 100}%`,
                      width: `${(activeLayer.interiorSubRegion.bbox.w / CANVAS_SIZE) * 100}%`,
                      height: `${(activeLayer.interiorSubRegion.bbox.h / CANVAS_SIZE) * 100}%`,
                    }}
                    className="absolute border border-dashed border-cyan-400 bg-cyan-400/15 pointer-events-none"
                  />
                )}
                <span
                  style={{
                    left: `${activeLayer.pivotPercent.x}%`,
                    top: `${activeLayer.pivotPercent.y}%`,
                  }}
                  className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-sky-400 ring-2 ring-slate-950 pointer-events-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 tabular-nums pt-2 border-t border-slate-800">
                <div>Geo Center: {activeLayer.metrics.geometricCenter.x}, {activeLayer.metrics.geometricCenter.y}</div>
                <div>Centroid: {activeLayer.metrics.centroid.x}, {activeLayer.metrics.centroid.y}</div>
                <div>Sub-Mask: {activeLayer.interiorSubRegion ? `${activeLayer.interiorSubRegion.bbox.w}×${activeLayer.interiorSubRegion.bbox.h}` : 'None'}</div>
                <div>Trace Pts: {activeLayer.tracePoints.length}</div>
              </div>
            </div>

            {/* Granular Animation & Multi-State Choreography Controls */}
            <div className="lg:col-span-8 border border-slate-800 rounded-xl bg-[#0F1520] p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="insp-mode" className="block text-[11px] text-slate-400 mb-1">
                    Animation Type
                  </label>
                  <select
                    id="insp-mode"
                    value={activeLayer.animationMode}
                    onChange={(e) => {
                      const mode = e.target.value as AnimationMode;
                      onUpdateLayer(activeLayer.id, {
                        animationMode: mode,
                        easing: defaultEasingForMode(mode),
                      });
                    }}
                    className="w-full rounded-lg bg-[#151C28] border border-slate-700 px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
                  >
                    <option value="rotate-cw">Mechanical: Rotate CW</option>
                    <option value="rotate-ccw">Mechanical: Rotate CCW</option>
                    <option value="gear-ratchet">Mechanical: Gear Micro-Ratchet</option>
                    <option value="fan-spin">Mechanical: High-RPM Fan Spin</option>
                    <option value="screen-oscilloscope">Screen: EKG / Oscilloscope</option>
                    <option value="screen-code">Screen: Scrolling Code</option>
                    <option value="screen-radar">Screen: Radar Sweep</option>
                    <option value="gauge-needle">Gauge: Needle Sweep</option>
                    <option value="gauge-fluid">Gauge: Rising/Falling Fluid</option>
                    <option value="circuit-pulse">Circuit: Light Tracers &amp; Sparks</option>
                    <option value="ambient-breathe">Chassis: Ambient Breathe</option>
                    <option value="static">Static Grounded</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="insp-easing" className="block text-[11px] text-slate-400 mb-1">
                    Easing Curve
                  </label>
                  <select
                    id="insp-easing"
                    value={activeLayer.easing}
                    onChange={(e) =>
                      onUpdateLayer(activeLayer.id, { easing: e.target.value as EasingCurve })
                    }
                    className="w-full rounded-lg bg-[#151C28] border border-slate-700 px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
                  >
                    <option value="linear">linear (Constant)</option>
                    <option value="ease-in-out">ease-in-out (Smooth)</option>
                    <option value="cubic-bezier(0.34, 1.56, 0.64, 1)">cubic-bezier (Spring Overshoot)</option>
                    <option value="steps(12, end)">steps(12) (Mechanical Detent)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="insp-pivot-preset" className="block text-[11px] text-slate-400 mb-1">
                    Transform Origin Anchor
                  </label>
                  <select
                    id="insp-pivot-preset"
                    value={activeLayer.pivotPreset}
                    onChange={(e) => {
                      const preset = e.target.value as PivotAnchorPreset;
                      const pivotPercent = computePivotForPreset(
                        preset,
                        activeLayer.bbox,
                        activeLayer.metrics.centroid,
                        activeLayer.metrics.geometricCenter,
                        CANVAS_SIZE
                      );
                      onUpdateLayer(activeLayer.id, { pivotPreset: preset, pivotPercent });
                    }}
                    className="w-full rounded-lg bg-[#151C28] border border-slate-700 px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
                  >
                    <option value="geometric-center">Geometric Circle Center</option>
                    <option value="centroid">Weighted Pixel Centroid</option>
                    <option value="bottom-center">Bottom-Center Hub</option>
                    <option value="top-center">Top-Center Hinge</option>
                    <option value="left-center">Left-Center Anchor</option>
                    <option value="right-center">Right-Center Anchor</option>
                    <option value="custom">Custom Coordinates</option>
                  </select>
                </div>
              </div>

              {/* Numeric Sliders */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <label htmlFor="insp-rpm" className="text-slate-400">Base RPM</label>
                    <span className="font-mono text-slate-200 tabular-nums">{activeLayer.rpm}</span>
                  </div>
                  <input
                    id="insp-rpm"
                    type="range"
                    min={1}
                    max={60}
                    value={activeLayer.rpm}
                    onChange={(e) =>
                      onUpdateLayer(activeLayer.id, { rpm: Number(e.target.value) })
                    }
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <label htmlFor="insp-speed" className="text-slate-400">Speed Scale</label>
                    <span className="font-mono text-slate-200 tabular-nums">{activeLayer.speed.toFixed(1)}x</span>
                  </div>
                  <input
                    id="insp-speed"
                    type="range"
                    min={0.2}
                    max={4.0}
                    step={0.1}
                    value={activeLayer.speed}
                    onChange={(e) =>
                      onUpdateLayer(activeLayer.id, { speed: Number(e.target.value) })
                    }
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <label htmlFor="insp-min-ang" className="text-slate-400">Min / Max Angle</label>
                    <span className="font-mono text-slate-200 tabular-nums">
                      {activeLayer.minAngle}°..{activeLayer.maxAngle}°
                    </span>
                  </div>
                  <input
                    id="insp-min-ang"
                    type="range"
                    min={2}
                    max={60}
                    value={activeLayer.maxAngle}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      onUpdateLayer(activeLayer.id, {
                        minAngle: -val,
                        maxAngle: val,
                        amplitude: val,
                      });
                    }}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <label htmlFor="insp-delay" className="text-slate-400">Phase Delay</label>
                    <span className="font-mono text-slate-200 tabular-nums">{activeLayer.phaseDelayMs}ms</span>
                  </div>
                  <input
                    id="insp-delay"
                    type="range"
                    min={0}
                    max={2000}
                    step={50}
                    value={activeLayer.phaseDelayMs}
                    onChange={(e) =>
                      onUpdateLayer(activeLayer.id, { phaseDelayMs: Number(e.target.value) })
                    }
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Custom Transform Origin XY */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <label htmlFor="insp-ox" className="text-slate-400">Transform Origin X</label>
                    <span className="font-mono text-slate-200 tabular-nums">{activeLayer.pivotPercent.x}%</span>
                  </div>
                  <input
                    id="insp-ox"
                    type="range"
                    min={0}
                    max={100}
                    step={0.5}
                    value={activeLayer.pivotPercent.x}
                    onChange={(e) =>
                      onUpdateLayer(activeLayer.id, {
                        pivotPreset: 'custom',
                        pivotPercent: { ...activeLayer.pivotPercent, x: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <label htmlFor="insp-oy" className="text-slate-400">Transform Origin Y</label>
                    <span className="font-mono text-slate-200 tabular-nums">{activeLayer.pivotPercent.y}%</span>
                  </div>
                  <input
                    id="insp-oy"
                    type="range"
                    min={0}
                    max={100}
                    step={0.5}
                    value={activeLayer.pivotPercent.y}
                    onChange={(e) =>
                      onUpdateLayer(activeLayer.id, {
                        pivotPreset: 'custom',
                        pivotPercent: { ...activeLayer.pivotPercent, y: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Multi-State Choreography Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
                <div className="p-3 rounded-lg bg-[#151C28] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">Idle Loop</span>
                    <input
                      type="checkbox"
                      aria-label="Enable Idle Loop"
                      checked={activeLayer.choreography.idle.enabled}
                      onChange={(e) => updateChoreography('idle', { enabled: e.target.checked })}
                      className="accent-sky-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Idle Speed</span>
                      <span className="font-mono tabular-nums">{activeLayer.choreography.idle.speedMultiplier.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={2.0}
                      step={0.1}
                      value={activeLayer.choreography.idle.speedMultiplier}
                      onChange={(e) =>
                        updateChoreography('idle', { speedMultiplier: Number(e.target.value) })
                      }
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#151C28] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">Hover Surge</span>
                    <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeLayer.choreography.hover.energySurge}
                        onChange={(e) => updateChoreography('hover', { energySurge: e.target.checked })}
                        className="accent-sky-400"
                      />
                      Surge
                    </label>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Hover Speed</span>
                      <span className="font-mono tabular-nums">{activeLayer.choreography.hover.speedMultiplier.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min={1.0}
                      max={5.0}
                      step={0.1}
                      value={activeLayer.choreography.hover.speedMultiplier}
                      onChange={(e) =>
                        updateChoreography('hover', { speedMultiplier: Number(e.target.value) })
                      }
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeLayer.choreography.hover.fanBlur}
                      onChange={(e) => updateChoreography('hover', { fanBlur: e.target.checked })}
                      className="accent-sky-400"
                    />
                    Motion Blur at High RPM
                  </label>
                </div>

                <div className="p-3 rounded-lg bg-[#151C28] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">Active Click</span>
                    <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeLayer.choreography.active.dischargePulse}
                        onChange={(e) => updateChoreography('active', { dischargePulse: e.target.checked })}
                        className="accent-sky-400"
                      />
                      Discharge
                    </label>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Glow Burst</span>
                      <span className="font-mono tabular-nums">{activeLayer.choreography.active.glowBurst.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min={1.0}
                      max={3.0}
                      step={0.1}
                      value={activeLayer.choreography.active.glowBurst}
                      onChange={(e) =>
                        updateChoreography('active', { glowBurst: Number(e.target.value) })
                      }
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeLayer.choreography.active.reverseOnClick}
                      onChange={(e) => updateChoreography('active', { reverseOnClick: e.target.checked })}
                      className="accent-sky-400"
                    />
                    Reverse Spin on Press
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Geometric Telemetry Table */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0F1520]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400 bg-[#151C28]">
                  <th className="py-2.5 px-4">Sprite</th>
                  <th className="py-2.5 px-4">Layer</th>
                  <th className="py-2.5 px-4">Preset / Easing</th>
                  <th className="py-2.5 px-4 text-right">Pivot (%)</th>
                  <th className="py-2.5 px-4 text-right">Sub-Mask</th>
                  <th className="py-2.5 px-4 text-right">Circularity</th>
                  <th className="py-2.5 px-4 text-right">Radial Var</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {layers.map((layer) => {
                  const selected = activeLayer?.id === layer.id;
                  return (
                    <tr
                      key={layer.id}
                      onClick={() => onSelectLayer(layer.id)}
                      className={`cursor-pointer transition-colors ${
                        selected ? 'bg-sky-500/10' : 'hover:bg-slate-800/35'
                      }`}
                    >
                      <td className="py-2.5 px-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 p-1 flex items-center justify-center">
                          <img
                            src={layer.croppedSpriteUrl}
                            alt={layer.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-slate-100">{layer.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {layer.metrics.area}px · {layer.metrics.dominantColor}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="text-slate-200 font-mono text-[11px]">{layer.animationMode}</div>
                        <div className="text-[11px] text-slate-400">{layer.easing}</div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-300 tabular-nums">
                        {layer.pivotPercent.x}%, {layer.pivotPercent.y}%
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-300 tabular-nums">
                        {layer.interiorSubRegion ? `${layer.interiorSubRegion.bbox.w}×${layer.interiorSubRegion.bbox.h}` : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-300 tabular-nums">
                        {layer.metrics.circularity.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-300 tabular-nums">
                        {layer.metrics.radialVariance.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectForEdit(layer.id);
                          }}
                          className="px-2.5 py-1 rounded-md border border-slate-700 bg-[#151C28] hover:border-sky-400 text-[11px] font-medium text-slate-200 cursor-pointer"
                        >
                          Stage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
