/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.UI.STAGE
TAG: LEEWAY.UI.MULTIMODE.STAGE

5WH:
WHAT = Multi-mode interactive stage supporting Interactive Button Mode (idle/hover/focus/active/toggle), Logo Mode (entrance reveals, ambient loop, loading ring), and Favicon & Web Icon Mode (browser tab simulation + 16..512px simplified high-contrast legibility matrix).
WHY = Allow designers to preview and calibrate segmented living graphics across buttons, brand logos, and small browser favicons from one unified stage.
WHO = Leeway Innovations — KineticGlyph Studio UI
WHERE = src/components/ButtonStage.tsx
WHEN = 2026-11-27
HOW = Drives WAAPI animations per layer, renders Target Mode containers, and invokes renderFaviconMatrixAssets for real small-size legibility previews.

LICENSE = Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Eye, MousePointerClick, RotateCcw } from 'lucide-react';
import {
  ButtonConfig,
  ButtonShape,
  FaviconRenderedAsset,
  LogoRevealStyle,
  SegmentedLayer,
  TargetMode,
  TracePoint,
} from '../types/studio';
import { CANVAS_SIZE } from '../engine/segmenter';
import {
  renderFaviconMatrixAssets,
  selectSimplifiedFaviconLayers,
} from '../engine/faviconCompiler';

interface ButtonStageProps {
  layers: SegmentedLayer[];
  selectedLayerId: string | null;
  config: ButtonConfig;
  onSelectLayer: (id: string) => void;
  onChangeConfig: (next: ButtonConfig) => void;
}

type StageBackdrop = 'dark' | 'light' | 'grid';
type PreviewStateLock = 'interactive' | 'hover' | 'focus' | 'active';

function radiusClass(shape: ButtonShape): string {
  switch (shape) {
    case 'circle':
      return 'rounded-full';
    case 'rounded':
      return 'rounded-2xl';
    case 'bezel':
      return 'rounded-3xl ring-2 ring-slate-700/80 ring-offset-4 ring-offset-slate-950';
    case 'squircle':
    default:
      return 'rounded-[28px]';
  }
}

export function tracePointsToSvgPath(points: TracePoint[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x} ${points[0].y}`;
  return points
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');
}

export const ButtonStage: React.FC<ButtonStageProps> = ({
  layers,
  selectedLayerId,
  config,
  onSelectLayer,
  onChangeConfig,
}) => {
  const [backdrop, setBackdrop] = useState<StageBackdrop>('dark');
  const [zoom, setZoom] = useState<1 | 1.5 | 2>(1.5);
  const [stateLock, setStateLock] = useState<PreviewStateLock>('interactive');
  const [showBounds, setShowBounds] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isToggled, setIsToggled] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [ripples, setRipples] = useState<number[]>([]);
  const [dischargeTick, setDischargeTick] = useState<number>(0);
  const [revealKey, setRevealKey] = useState<number>(1);
  const [faviconAssets, setFaviconAssets] = useState<FaviconRenderedAsset[]>([]);

  const layerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const animationsRef = useRef<Map<string, Animation>>(new Map());

  const effectiveHovered =
    stateLock === 'hover' || (stateLock === 'interactive' && (isHovered || isToggled));
  const effectiveFocused =
    stateLock === 'focus' || (stateLock === 'interactive' && isFocused);
  const effectivePressed =
    stateLock === 'active' || (stateLock === 'interactive' && isPressed);

  // Build independent WAAPI animations for Button & Logo modes
  useEffect(() => {
    animationsRef.current.forEach((anim) => anim.cancel());
    animationsRef.current.clear();

    if (config.reducedMotion || !isPlaying || config.targetMode === 'favicon') return;

    layers.forEach((layer) => {
      if (!layer.visible || !layer.choreography.idle.enabled) return;
      const el = layerRefs.current.get(layer.id);
      if (!el) return;

      let anim: Animation | null = null;
      const speed = Math.max(0.2, layer.speed * layer.choreography.idle.speedMultiplier);
      const rpmDuration = Math.max(
        450,
        Math.round(60000 / Math.max(1, layer.rpm) / Math.max(0.2, layer.speed))
      );
      const delay = layer.phaseDelayMs || 0;
      const easing = layer.easing || 'linear';

      if (layer.animationMode === 'rotate-cw') {
        anim = el.animate(
          [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
          { duration: rpmDuration, iterations: Infinity, easing, delay }
        );
      } else if (layer.animationMode === 'rotate-ccw') {
        anim = el.animate(
          [{ transform: 'rotate(360deg)' }, { transform: 'rotate(0deg)' }],
          { duration: rpmDuration, iterations: Infinity, easing, delay }
        );
      } else if (layer.animationMode === 'gear-ratchet') {
        anim = el.animate(
          [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
          {
            duration: Math.max(800, rpmDuration),
            iterations: Infinity,
            easing: 'steps(12, end)',
            delay,
          }
        );
      } else if (layer.animationMode === 'fan-spin') {
        anim = el.animate(
          [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
          {
            duration: Math.max(320, Math.round(rpmDuration * 0.45)),
            iterations: Infinity,
            easing: 'linear',
            delay,
          }
        );
      } else if (layer.animationMode === 'gauge-needle') {
        anim = el.animate(
          [
            { transform: `rotate(${layer.minAngle}deg)` },
            { transform: `rotate(${layer.maxAngle}deg)` },
            { transform: `rotate(${layer.minAngle}deg)` },
          ],
          {
            duration: Math.round(2800 / speed),
            iterations: Infinity,
            easing: easing === 'linear' ? 'ease-in-out' : easing,
            delay,
          }
        );
      } else if (layer.animationMode === 'circuit-pulse') {
        anim = el.animate(
          [{ opacity: 0.84 }, { opacity: 1 }, { opacity: 0.84 }],
          { duration: Math.round(1800 / speed), iterations: Infinity, easing, delay }
        );
      } else if (layer.animationMode === 'ambient-breathe') {
        anim = el.animate(
          [{ transform: 'scale(1)' }, { transform: 'scale(1.018)' }, { transform: 'scale(1)' }],
          { duration: Math.round(3600 / speed), iterations: Infinity, easing: 'ease-in-out', delay }
        );
      }

      if (anim) {
        animationsRef.current.set(layer.id, anim);
      }
    });

    return () => {
      animationsRef.current.forEach((anim) => anim.cancel());
      animationsRef.current.clear();
    };
  }, [layers, isPlaying, config.reducedMotion, config.targetMode, revealKey]);

  // Multi-state playbackRate choreography on Hover, Focus, Logo Loading, and Active Click
  useEffect(() => {
    layers.forEach((layer) => {
      const anim = animationsRef.current.get(layer.id);
      if (!anim) return;
      try {
        if (effectivePressed && layer.choreography.active.reverseOnClick) {
          anim.playbackRate = -(layer.choreography.hover.speedMultiplier || config.hoverSpeedMultiplier);
        } else if (
          effectiveHovered ||
          (config.targetMode === 'logo' && config.logoLoading)
        ) {
          const boost = layer.choreography.hover.speedMultiplier || config.hoverSpeedMultiplier;
          anim.playbackRate = layer.choreography.hover.ratchetBoost ? boost * 1.35 : boost;
        } else {
          anim.playbackRate = layer.choreography.idle.speedMultiplier || 1;
        }
      } catch {
        // Ignore stopped animations
      }
    });
  }, [
    effectiveHovered,
    effectivePressed,
    config.hoverSpeedMultiplier,
    config.targetMode,
    config.logoLoading,
    layers,
    isPlaying,
  ]);

  // Render simplified small-size Favicon matrix whenever in Favicon mode or layers/config change
  useEffect(() => {
    if (config.targetMode !== 'favicon') return;
    let active = true;
    void renderFaviconMatrixAssets(layers, config).then((assets) => {
      if (active) setFaviconAssets(assets);
    });
    return () => {
      active = false;
    };
  }, [
    config.targetMode,
    config.faviconContrastBoost,
    config.faviconSimplifyMinArea,
    config.surfaceTint,
    layers,
  ]);

  const handleButtonClick = () => {
    setClickCount((c) => c + 1);
    setDischargeTick((t) => t + 1);
    if (config.toggleable) {
      setIsToggled((prev) => !prev);
    }
    const id = Date.now() + Math.random();
    setRipples((prev) => [...prev, id]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r !== id));
    }, 450);
  };

  const stageBgClass =
    backdrop === 'light'
      ? 'bg-slate-100 text-slate-900'
      : backdrop === 'grid'
      ? 'kg-checker-bg text-slate-100'
      : 'bg-[#0B0F17] text-slate-100';

  const scaledSize = Math.round(config.sizePx * zoom);
  const glowAlpha = effectiveHovered ? Math.min(0.9, config.hoverGlowIntensity * 0.45) : 0.14;
  const activeScale =
    layers.find((l) => l.choreography.active.pressScale)?.choreography.active.pressScale ?? 0.965;

  const { keptLayers, prunedLayers } = selectSimplifiedFaviconLayers(
    layers,
    config.faviconSimplifyMinArea
  );
  const tabIcon16 = faviconAssets.find((a) => a.size === 16)?.dataUrl;

  const renderLayerStack = () => (
    <div className="relative w-full h-full pointer-events-none">
      {layers.map((layer) => {
        if (!layer.visible) return null;

        const speedFactor =
          effectiveHovered || (config.targetMode === 'logo' && config.logoLoading)
            ? layer.speed * layer.choreography.hover.speedMultiplier
            : layer.speed * layer.choreography.idle.speedMultiplier;

        const glowLevel = effectivePressed
          ? layer.choreography.active.glowBurst
          : effectiveHovered
          ? layer.choreography.hover.glowIntensity * config.hoverGlowIntensity
          : layer.choreography.idle.glowIntensity;

        const applyFanBlur =
          layer.animationMode === 'fan-spin' &&
          (effectiveHovered || (config.targetMode === 'logo' && config.logoLoading)) &&
          layer.choreography.hover.fanBlur &&
          !config.reducedMotion;

        const filterCss = [
          glowLevel > 0.3
            ? `drop-shadow(0 0 ${Math.round(5 * glowLevel)}px ${layer.glowColor})`
            : '',
          applyFanBlur ? 'blur(0.6px)' : '',
        ]
          .filter(Boolean)
          .join(' ');

        const subBox = layer.interiorSubRegion?.bbox ?? layer.bbox;
        const subMask = layer.interiorSubRegion?.maskUrl ?? layer.maskUrl;
        const isScreenMode =
          layer.animationMode === 'screen-code' ||
          layer.animationMode === 'screen-oscilloscope' ||
          layer.animationMode === 'screen-radar';

        const tracePath = tracePointsToSvgPath(layer.tracePoints);

        return (
          <div
            key={layer.id}
            ref={(el) => {
              if (el) layerRefs.current.set(layer.id, el);
              else layerRefs.current.delete(layer.id);
            }}
            style={{
              zIndex: layer.zIndex,
              transformOrigin: `${layer.pivotPercent.x}% ${layer.pivotPercent.y}%`,
              filter: filterCss || 'none',
            }}
            className="absolute inset-0 will-change-transform"
          >
            <img
              src={layer.fullSpriteUrl}
              alt={layer.name}
              draggable={false}
              className="w-full h-full object-contain block"
            />

            {isScreenMode && !config.reducedMotion && isPlaying && (
              <div
                style={{
                  WebkitMaskImage: `url(${subMask})`,
                  maskImage: `url(${subMask})`,
                  WebkitMaskSize: '100% 100%',
                  maskSize: '100% 100%',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                }}
                className="absolute inset-0 pointer-events-none"
              >
                <div
                  style={{
                    left: `${(subBox.x / CANVAS_SIZE) * 100}%`,
                    top: `${(subBox.y / CANVAS_SIZE) * 100}%`,
                    width: `${(subBox.w / CANVAS_SIZE) * 100}%`,
                    height: `${(subBox.h / CANVAS_SIZE) * 100}%`,
                  }}
                  className="absolute overflow-hidden mix-blend-screen bg-slate-950/35"
                >
                  {layer.animationMode === 'screen-oscilloscope' && (
                    <>
                      <div
                        style={{
                          animation: `kg-scanline ${(2.2 / Math.max(0.2, speedFactor)).toFixed(2)}s linear infinite`,
                        }}
                        className="w-full h-1/3 bg-gradient-to-b from-transparent via-cyan-200/45 to-transparent"
                      />
                      <svg
                        viewBox="0 0 120 28"
                        preserveAspectRatio="none"
                        className="absolute inset-0 w-[200%] h-full opacity-80"
                        style={{
                          animation: `kg-wave-scroll ${(2.6 / Math.max(0.2, speedFactor)).toFixed(2)}s linear infinite`,
                        }}
                      >
                        <path
                          d="M0 14 L12 14 L17 4 L23 24 L29 10 L35 14 L60 14 L72 14 L77 4 L83 24 L89 10 L95 14 L120 14"
                          fill="none"
                          stroke="#A5F3FC"
                          strokeWidth="2.2"
                        />
                      </svg>
                    </>
                  )}

                  {layer.animationMode === 'screen-code' && (
                    <div
                      style={{
                        animation: `kg-code-scroll ${(3.6 / Math.max(0.2, speedFactor)).toFixed(2)}s linear infinite`,
                      }}
                      className="w-full text-[7px] leading-[9px] font-mono text-emerald-200/85 px-1 select-none"
                    >
                      <div>0x4F SYNC OK</div>
                      <div>RPM: 1420</div>
                      <div>BUS: ACTIVE</div>
                      <div>CRC: 9A2E</div>
                      <div>0x4F SYNC OK</div>
                      <div>RPM: 1420</div>
                      <div>BUS: ACTIVE</div>
                      <div>CRC: 9A2E</div>
                    </div>
                  )}

                  {layer.animationMode === 'screen-radar' && (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div
                        style={{
                          animation: `kg-radar-spin ${(2.8 / Math.max(0.2, speedFactor)).toFixed(2)}s linear infinite`,
                          background:
                            'conic-gradient(from 0deg, rgba(103, 232, 249, 0.72) 0deg, rgba(103, 232, 249, 0.05) 70deg, transparent 90deg)',
                        }}
                        className="w-full h-full rounded-full"
                      />
                      <span className="absolute w-1.5 h-1.5 rounded-full bg-cyan-200 top-[28%] left-[62%] animate-ping" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {layer.animationMode === 'gauge-fluid' && !config.reducedMotion && isPlaying && (
              <div
                style={{
                  WebkitMaskImage: `url(${subMask})`,
                  maskImage: `url(${subMask})`,
                  WebkitMaskSize: '100% 100%',
                  maskSize: '100% 100%',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                }}
                className="absolute inset-0 pointer-events-none"
              >
                <div
                  style={{
                    left: `${(subBox.x / CANVAS_SIZE) * 100}%`,
                    top: `${(subBox.y / CANVAS_SIZE) * 100}%`,
                    width: `${(subBox.w / CANVAS_SIZE) * 100}%`,
                    height: `${(subBox.h / CANVAS_SIZE) * 100}%`,
                  }}
                  className="absolute overflow-hidden"
                >
                  <div
                    style={{
                      background: `linear-gradient(180deg, #FECACA 0%, ${layer.glowColor} 35%, #991B1B 100%)`,
                      animation: `kg-fluid-level ${(2.4 / Math.max(0.2, speedFactor)).toFixed(2)}s ease-in-out infinite`,
                    }}
                    className="w-full h-full origin-bottom"
                  />
                </div>
              </div>
            )}

            {layer.animationMode === 'circuit-pulse' && !config.reducedMotion && isPlaying && (
              <>
                <div
                  style={{
                    WebkitMaskImage: `url(${layer.maskUrl})`,
                    maskImage: `url(${layer.maskUrl})`,
                    WebkitMaskSize: '100% 100%',
                    maskSize: '100% 100%',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                  }}
                  className="absolute inset-0 pointer-events-none"
                >
                  <div
                    style={{
                      background: `linear-gradient(115deg, transparent 35%, ${layer.glowColor}F0 50%, transparent 65%)`,
                      animation: `kg-circuit-sweep ${(2.0 / Math.max(0.2, speedFactor)).toFixed(2)}s linear infinite`,
                    }}
                    className="absolute -inset-1/2"
                  />
                </div>

                {tracePath && (
                  <svg
                    viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  >
                    <path
                      d={tracePath}
                      fill="none"
                      stroke={effectiveHovered && layer.choreography.hover.energySurge ? '#E0F2FE' : layer.glowColor}
                      strokeWidth={effectiveHovered ? '3.2' : '2.2'}
                      strokeDasharray="10 18"
                      strokeLinecap="round"
                      opacity={effectiveHovered ? '0.95' : '0.75'}
                      style={{
                        animation: `kg-circuit-dash ${(1.4 / Math.max(0.2, speedFactor)).toFixed(2)}s linear infinite`,
                      }}
                    />
                    <circle r={effectiveHovered ? '4' : '3'} fill="#FFFFFF">
                      <animateMotion
                        dur={`${(1.8 / Math.max(0.2, speedFactor)).toFixed(2)}s`}
                        repeatCount="indefinite"
                        path={tracePath}
                      />
                    </circle>
                  </svg>
                )}
              </>
            )}
          </div>
        );
      })}

      {showBounds &&
        layers.map((layer) => {
          if (!layer.visible) return null;
          const isSelected = layer.id === selectedLayerId;
          return (
            <React.Fragment key={`bounds-${layer.id}`}>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectLayer(layer.id);
                }}
                style={{
                  left: `${(layer.bbox.x / CANVAS_SIZE) * 100}%`,
                  top: `${(layer.bbox.y / CANVAS_SIZE) * 100}%`,
                  width: `${(layer.bbox.w / CANVAS_SIZE) * 100}%`,
                  height: `${(layer.bbox.h / CANVAS_SIZE) * 100}%`,
                  zIndex: 50,
                }}
                className={`absolute pointer-events-auto border ${
                  isSelected ? 'border-sky-400 bg-sky-400/10' : 'border-amber-400/50'
                }`}
              />
              {layer.interiorSubRegion && (
                <div
                  style={{
                    left: `${(layer.interiorSubRegion.bbox.x / CANVAS_SIZE) * 100}%`,
                    top: `${(layer.interiorSubRegion.bbox.y / CANVAS_SIZE) * 100}%`,
                    width: `${(layer.interiorSubRegion.bbox.w / CANVAS_SIZE) * 100}%`,
                    height: `${(layer.interiorSubRegion.bbox.h / CANVAS_SIZE) * 100}%`,
                    zIndex: 51,
                  }}
                  className="absolute border border-dashed border-cyan-300 pointer-events-none"
                />
              )}
              <span
                style={{
                  left: `${layer.pivotPercent.x}%`,
                  top: `${layer.pivotPercent.y}%`,
                  zIndex: 52,
                }}
                className="absolute w-2.5 h-2.5 -ml-1.25 -mt-1.25 rounded-full bg-sky-400 ring-2 ring-slate-950 pointer-events-none"
              />
            </React.Fragment>
          );
        })}
    </div>
  );

  return (
    <section className="flex-1 flex flex-col min-w-0 bg-[#0B0F17]">
      {/* Stage Toolbar */}
      <div className="h-11 px-4 border-b border-slate-800 bg-[#0F1520] flex items-center justify-between gap-3 shrink-0 overflow-x-auto">
        {/* Target Mode Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center p-0.5 rounded-lg bg-[#151C28] border border-slate-700">
            {(
              [
                { id: 'button', label: 'Button' },
                { id: 'logo', label: 'Logo' },
                { id: 'favicon', label: 'Favicon' },
              ] as Array<{ id: TargetMode; label: string }>
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => onChangeConfig({ ...config, targetMode: mode.id })}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  config.targetMode === mode.id
                    ? 'bg-sky-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className="flex items-center p-0.5 rounded-lg bg-[#151C28] border border-slate-800">
            {(['dark', 'grid', 'light'] as StageBackdrop[]).map((bg) => (
              <button
                key={bg}
                type="button"
                onClick={() => setBackdrop(bg)}
                className={`px-2 py-1 text-[11px] font-medium rounded-md capitalize transition-colors cursor-pointer whitespace-nowrap ${
                  backdrop === bg
                    ? 'bg-slate-700 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {bg}
              </button>
            ))}
          </div>

          {config.targetMode !== 'favicon' && (
            <div className="flex items-center p-0.5 rounded-lg bg-[#151C28] border border-slate-800">
              {([1, 1.5, 2] as const).map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZoom(z)}
                  className={`px-2 py-1 text-[11px] font-mono rounded-md transition-colors cursor-pointer ${
                    zoom === z
                      ? 'bg-slate-700 text-slate-100'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {z}x
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mode-Specific Right Toolbar Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {config.targetMode === 'button' && (
            <div className="flex items-center p-0.5 rounded-lg bg-[#151C28] border border-slate-800">
              {(
                [
                  { id: 'interactive', label: 'Interactive' },
                  { id: 'hover', label: 'Hover' },
                  { id: 'focus', label: 'Focus' },
                  { id: 'active', label: 'Press' },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setStateLock(mode.id)}
                  className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    stateLock === mode.id
                      ? 'bg-sky-500/20 text-sky-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          )}

          {config.targetMode === 'logo' && (
            <button
              type="button"
              onClick={() => setRevealKey((k) => k + 1)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#151C28] hover:border-slate-700 text-[11px] font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Replay Reveal
            </button>
          )}

          {config.targetMode !== 'favicon' && (
            <>
              <button
                type="button"
                onClick={() => setShowBounds((v) => !v)}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  showBounds
                    ? 'border-sky-500/60 bg-sky-500/15 text-sky-300'
                    : 'border-slate-800 bg-[#151C28] text-slate-300 hover:border-slate-700'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Bounds
              </button>

              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                aria-label={isPlaying ? 'Pause animations' : 'Play animations'}
                className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#151C28] hover:border-slate-700 text-[11px] font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isPlaying ? 'Playing' : 'Paused'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Center Stage Content */}
      <div
        className={`flex-1 relative flex flex-col items-center justify-center p-6 transition-colors overflow-y-auto ${stageBgClass}`}
      >
        {/* MODE 1: INTERACTIVE BUTTON */}
        {config.targetMode === 'button' && (
          <>
            <button
              type="button"
              aria-label={config.ariaLabel}
              aria-pressed={config.toggleable ? isToggled : undefined}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => {
                setIsHovered(false);
                setIsPressed(false);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onMouseDown={() => setIsPressed(true)}
              onMouseUp={() => setIsPressed(false)}
              onClick={handleButtonClick}
              style={{
                width: `${scaledSize}px`,
                height: `${scaledSize}px`,
                backgroundColor: config.surfaceTint,
                borderColor: effectiveHovered ? config.accentColor : 'rgba(148, 163, 184, 0.28)',
                outline: effectiveFocused ? `2px solid ${config.accentColor}` : undefined,
                outlineOffset: effectiveFocused ? '4px' : undefined,
                transform: effectivePressed
                  ? `translateY(${config.pressDepthPx}px) scale(${activeScale})`
                  : effectiveHovered
                  ? 'translateY(-2px)'
                  : 'translateY(0)',
                boxShadow: effectivePressed
                  ? `0 4px 12px -4px rgba(0, 0, 0, 0.85), 0 0 22px ${config.accentColor}60`
                  : effectiveHovered
                  ? `0 20px 44px -12px rgba(0,0,0,0.8), 0 0 36px rgba(56, 189, 248, ${glowAlpha}), inset 0 0 0 1px rgba(255,255,255,0.14)`
                  : `0 14px 32px -10px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.06)`,
              }}
              className={`relative p-3 border transition-all duration-150 ease-out cursor-pointer select-none overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${radiusClass(
                config.shape
              )}`}
            >
              {renderLayerStack()}

              {dischargeTick > 0 && !config.reducedMotion && (
                <span
                  key={`discharge-${dischargeTick}`}
                  style={{
                    background: `radial-gradient(circle, ${config.accentColor}44 0%, transparent 70%)`,
                    animation: 'kg-discharge-flash 360ms ease-out forwards',
                  }}
                  className="absolute inset-0 rounded-[inherit] pointer-events-none"
                />
              )}

              {ripples.map((r) => (
                <span
                  key={r}
                  style={{
                    borderColor: config.accentColor,
                    animation: 'kg-click-ripple 420ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
                  }}
                  className="absolute inset-0 rounded-[inherit] border-2 pointer-events-none"
                />
              ))}
            </button>

            {config.showCaption && (
              <p className={`mt-4 text-xs font-medium tracking-wide ${backdrop === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                {config.label}
              </p>
            )}

            <div className={`mt-3 flex items-center gap-3 text-[11px] font-mono tabular-nums ${backdrop === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              <span>
                State: {effectivePressed ? 'Active Press' : effectiveFocused ? 'Focused' : isToggled ? 'Toggled On' : effectiveHovered ? `Hover (${config.hoverSpeedMultiplier}x)` : 'Idle'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <MousePointerClick className="w-3 h-3" />
                Clicks: {clickCount}
              </span>
              <span aria-hidden="true">·</span>
              <span>{scaledSize}×{scaledSize}px</span>
            </div>
          </>
        )}

        {/* MODE 2: LOGO MARK */}
        {config.targetMode === 'logo' && (
          <div className="flex flex-col items-center">
            <div
              key={revealKey}
              role="img"
              aria-label={config.ariaLabel}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                width: `${scaledSize}px`,
                height: `${scaledSize}px`,
                animation:
                  config.reducedMotion || config.logoReveal === 'none'
                    ? undefined
                    : config.logoReveal === 'fade-scale'
                    ? 'kg-reveal-fade 550ms cubic-bezier(0.16, 1, 0.3, 1) forwards'
                    : 'kg-reveal-unfold 720ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              }}
              className="relative flex items-center justify-center p-2"
            >
              {config.logoLoading && !config.reducedMotion && (
                <span
                  aria-hidden="true"
                  style={{
                    borderTopColor: config.accentColor,
                    borderRightColor: 'rgba(56, 189, 248, 0.3)',
                    animation: 'kg-logo-loading-ring 1.1s linear infinite',
                  }}
                  className="absolute -inset-2 rounded-full border-2 border-transparent pointer-events-none"
                />
              )}
              {renderLayerStack()}
            </div>

            {config.showCaption && (
              <p className={`mt-4 text-sm font-display font-semibold tracking-tight ${backdrop === 'light' ? 'text-slate-800' : 'text-slate-100'}`}>
                {config.label}
              </p>
            )}

            <div className={`mt-2 flex items-center gap-3 text-[11px] font-mono tabular-nums ${backdrop === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              <span>Reveal: {config.logoReveal}</span>
              <span aria-hidden="true">·</span>
              <span>State: {config.logoLoading ? 'Active / Loading' : effectiveHovered ? 'Hover Boost' : 'Ambient Loop'}</span>
              <span aria-hidden="true">·</span>
              <span>{scaledSize}×{scaledSize}px</span>
            </div>
          </div>
        )}

        {/* MODE 3: FAVICON & WEB ICON */}
        {config.targetMode === 'favicon' && (
          <div className="w-full max-w-3xl space-y-5">
            {/* Simulated Browser Tab Bar */}
            <div className="border border-slate-800 rounded-xl bg-[#0F1520] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-200">
                  Browser Tab &amp; Small-Scale Legibility Preview
                </span>
                <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                  {keptLayers.length} kept · {prunedLayers.length} micro-layers simplified ≤ 48px
                </span>
              </div>

              <div className="rounded-t-lg bg-[#182030] border border-slate-700/80 px-3 pt-2 flex items-end gap-2">
                <div className="bg-[#0B0F17] border border-b-0 border-slate-700 rounded-t-md px-3 py-1.5 flex items-center gap-2 min-w-[200px]">
                  {tabIcon16 ? (
                    <img
                      src={tabIcon16}
                      alt="16x16 browser tab icon"
                      className="w-4 h-4 shrink-0"
                    />
                  ) : (
                    <span className="w-4 h-4 rounded bg-slate-700 shrink-0" />
                  )}
                  <span className="text-xs text-slate-200 truncate">
                    {config.label || 'KineticGlyph Web App'}
                  </span>
                </div>
                <div className="px-3 py-1.5 text-xs text-slate-500 truncate">
                  New Tab
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Small tab sizes (16×16 to 48×48) automatically filter out sub-threshold trace clutter and apply contrast boost so silhouettes stay crisp. Chromium and Firefox support throttled dynamic Canvas &lt;link rel=&quot;icon&quot;&gt; updates; Safari, iOS, and mobile browsers fall back to static PNG/ICO/SVG links.
              </p>
            </div>

            {/* Multi-Size Matrix (16, 32, 48, 180, 192, 512) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {faviconAssets.map((asset) => {
                const displayPx = asset.size > 96 ? 72 : asset.size;
                return (
                  <div
                    key={asset.size}
                    className="border border-slate-800 rounded-xl bg-[#0F1520] p-3.5 flex flex-col items-center justify-between gap-3"
                  >
                    <div className="h-20 flex items-center justify-center">
                      <img
                        src={asset.dataUrl}
                        alt={`${asset.size}x${asset.size} favicon preview`}
                        style={{ width: `${displayPx}px`, height: `${displayPx}px` }}
                        className="object-contain"
                      />
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-mono font-semibold text-slate-100 tabular-nums">
                        {asset.size}×{asset.size}px
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {asset.roleLabel}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Contextual Bottom Configuration Bar */}
      <div className="border-t border-slate-800 bg-[#0F1520] px-5 py-3.5 grid grid-cols-2 md:grid-cols-5 gap-4 shrink-0">
        <div>
          <label htmlFor="btn-label" className="block text-[11px] text-slate-400 mb-1">
            {config.targetMode === 'logo' ? 'Brand / Mark Title' : config.targetMode === 'favicon' ? 'App / Tab Title' : 'Button Label'}
          </label>
          <input
            id="btn-label"
            type="text"
            value={config.label}
            onChange={(e) =>
              onChangeConfig({ ...config, label: e.target.value, ariaLabel: e.target.value || 'Interactive graphic' })
            }
            className="w-full rounded-lg bg-[#151C28] border border-slate-700 px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
          />
        </div>

        {config.targetMode === 'button' && (
          <>
            <div>
              <label htmlFor="btn-shape" className="block text-[11px] text-slate-400 mb-1">
                Container Shape
              </label>
              <select
                id="btn-shape"
                value={config.shape}
                onChange={(e) => onChangeConfig({ ...config, shape: e.target.value as ButtonShape })}
                className="w-full rounded-lg bg-[#151C28] border border-slate-700 px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
              >
                <option value="squircle">Squircle</option>
                <option value="rounded">Rounded Square</option>
                <option value="circle">Circle</option>
                <option value="bezel">Hardware Bezel</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <label htmlFor="btn-hover-boost" className="text-slate-400">Hover Speed</label>
                <span className="font-mono text-slate-200 tabular-nums">{config.hoverSpeedMultiplier.toFixed(1)}x</span>
              </div>
              <input
                id="btn-hover-boost"
                type="range"
                min={1.2}
                max={4.0}
                step={0.1}
                value={config.hoverSpeedMultiplier}
                onChange={(e) =>
                  onChangeConfig({ ...config, hoverSpeedMultiplier: Number(e.target.value) })
                }
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <label htmlFor="btn-glow" className="text-slate-400">Hover Glow</label>
                <span className="font-mono text-slate-200 tabular-nums">{Math.round(config.hoverGlowIntensity * 100)}%</span>
              </div>
              <input
                id="btn-glow"
                type="range"
                min={0.2}
                max={2.0}
                step={0.1}
                value={config.hoverGlowIntensity}
                onChange={(e) =>
                  onChangeConfig({ ...config, hoverGlowIntensity: Number(e.target.value) })
                }
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, toggleable: !config.toggleable })}
                className={`flex-1 py-1.5 px-2.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  config.toggleable
                    ? 'border-sky-500/60 bg-sky-500/15 text-sky-300'
                    : 'border-slate-700 bg-[#151C28] text-slate-300'
                }`}
              >
                {config.toggleable ? 'Toggle Mode' : 'Momentary'}
              </button>
              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, reducedMotion: !config.reducedMotion })}
                className={`flex-1 py-1.5 px-2.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  config.reducedMotion
                    ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
                    : 'border-slate-700 bg-[#151C28] text-slate-300'
                }`}
              >
                {config.reducedMotion ? 'Reduced' : 'Motion On'}
              </button>
            </div>
          </>
        )}

        {config.targetMode === 'logo' && (
          <>
            <div>
              <label htmlFor="logo-reveal" className="block text-[11px] text-slate-400 mb-1">
                Entrance Reveal
              </label>
              <select
                id="logo-reveal"
                value={config.logoReveal}
                onChange={(e) =>
                  onChangeConfig({ ...config, logoReveal: e.target.value as LogoRevealStyle })
                }
                className="w-full rounded-lg bg-[#151C28] border border-slate-700 px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
              >
                <option value="fade-scale">Fade + Scale</option>
                <option value="radial-unfold">Radial Unfold</option>
                <option value="none">None (Immediate)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <label htmlFor="logo-size" className="text-slate-400">Base Mark Size</label>
                <span className="font-mono text-slate-200 tabular-nums">{config.sizePx}px</span>
              </div>
              <input
                id="logo-size"
                type="range"
                min={64}
                max={220}
                step={4}
                value={config.sizePx}
                onChange={(e) =>
                  onChangeConfig({ ...config, sizePx: Number(e.target.value) })
                }
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, logoLoading: !config.logoLoading })}
                className={`w-full py-1.5 px-3 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  config.logoLoading
                    ? 'border-sky-500/60 bg-sky-500/15 text-sky-300'
                    : 'border-slate-700 bg-[#151C28] text-slate-300'
                }`}
              >
                {config.logoLoading ? 'Loading State: On' : 'Loading State: Off'}
              </button>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, showCaption: !config.showCaption })}
                className={`flex-1 py-1.5 px-2.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  config.showCaption
                    ? 'border-sky-500/60 bg-sky-500/15 text-sky-300'
                    : 'border-slate-700 bg-[#151C28] text-slate-300'
                }`}
              >
                {config.showCaption ? 'Wordmark On' : 'Wordmark Off'}
              </button>
              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, reducedMotion: !config.reducedMotion })}
                className={`flex-1 py-1.5 px-2.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  config.reducedMotion
                    ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
                    : 'border-slate-700 bg-[#151C28] text-slate-300'
                }`}
              >
                {config.reducedMotion ? 'Reduced' : 'Motion On'}
              </button>
            </div>
          </>
        )}

        {config.targetMode === 'favicon' && (
          <>
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <label htmlFor="fav-contrast" className="text-slate-400">Tab Contrast Boost</label>
                <span className="font-mono text-slate-200 tabular-nums">{Math.round(config.faviconContrastBoost * 100)}%</span>
              </div>
              <input
                id="fav-contrast"
                type="range"
                min={1.0}
                max={1.8}
                step={0.05}
                value={config.faviconContrastBoost}
                onChange={(e) =>
                  onChangeConfig({ ...config, faviconContrastBoost: Number(e.target.value) })
                }
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <label htmlFor="fav-simplify" className="text-slate-400">Simplify Min Area (≤48px)</label>
                <span className="font-mono text-slate-200 tabular-nums">{config.faviconSimplifyMinArea}px</span>
              </div>
              <input
                id="fav-simplify"
                type="range"
                min={40}
                max={800}
                step={20}
                value={config.faviconSimplifyMinArea}
                onChange={(e) =>
                  onChangeConfig({ ...config, faviconSimplifyMinArea: Number(e.target.value) })
                }
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            <div className="col-span-2 flex items-end justify-end">
              <span className="text-[11px] text-slate-400">
                Export 16–512px PNGs, multi-res .ICO, SVG, and dynamic tab controller in Export Code.
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
