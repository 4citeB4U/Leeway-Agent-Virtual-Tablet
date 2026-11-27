/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.STUDIO.EXPORTERS
TAG: LEEWAY.ENGINE.ARTIFACT.EXPORT

5WH:
WHAT = Full-parity deterministic exporters serializing Interactive Button Mode, Logo Mode, and Favicon/Web Icon Mode artifacts into HTML/CSS/JS, Lottie v5.9.0 JSON, Animated SVG, and Web Icon kits.
WHY = Ensure exported code matches the selected Target Mode (button, logo, or favicon) and preserves all procedural overlays, pivots, circuit tracers, and multi-state choreography.
WHO = Leeway Innovations — KineticGlyph Export Compiler
WHERE = src/engine/exporters.ts
WHEN = 2026-11-27
HOW = Transforms SegmentedLayer[] and ButtonConfig into portable HTML5, Lottie JSON, SMIL SVG, and Web Icon/Favicon artifacts.

LICENSE = Apache-2.0
*/

import { ButtonConfig, EasingCurve, SegmentedLayer, TracePoint } from '../types/studio';
import { CANVAS_SIZE } from './segmenter';
import {
  generateFaviconControllerHtml,
  generateFaviconLinkTagsHtml,
  generateWebManifestJson,
} from './faviconCompiler';

function borderRadiusForShape(shape: ButtonConfig['shape']): string {
  switch (shape) {
    case 'circle':
      return '9999px';
    case 'rounded':
      return '18px';
    case 'bezel':
      return '22px';
    case 'squircle':
    default:
      return '28px';
  }
}

function tracePointsToSvgPath(points: TracePoint[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x} ${points[0].y}`;
  return points
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');
}

function lottieHandlesForEasing(easing: EasingCurve): {
  i: { x: [number]; y: [number] };
  o: { x: [number]; y: [number] };
} {
  switch (easing) {
    case 'ease-in-out':
      return { i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] } };
    case 'cubic-bezier(0.34, 1.56, 0.64, 1)':
      return { i: { x: [0.64], y: [1] }, o: { x: [0.34], y: [1] } };
    case 'steps(12, end)':
      return { i: { x: [0.99], y: [0] }, o: { x: [0.01], y: [1] } };
    case 'linear':
    default:
      return { i: { x: [1], y: [1] }, o: { x: [0], y: [0] } };
  }
}

function buildLayerMarkup(activeLayers: SegmentedLayer[]): string {
  return activeLayers
    .map((layer, idx) => {
      const safeId = `kg-layer-${idx + 1}`;
      const subBox = layer.interiorSubRegion?.bbox ?? layer.bbox;
      const subMask = layer.interiorSubRegion?.maskUrl ?? layer.maskUrl;
      const boxStyle = `left:${((subBox.x / CANVAS_SIZE) * 100).toFixed(2)}%;top:${((subBox.y / CANVAS_SIZE) * 100).toFixed(2)}%;width:${((subBox.w / CANVAS_SIZE) * 100).toFixed(2)}%;height:${((subBox.h / CANVAS_SIZE) * 100).toFixed(2)}%;`;
      const maskStyle = `-webkit-mask-image:url('${subMask}');mask-image:url('${subMask}');`;
      const tracePath = tracePointsToSvgPath(layer.tracePoints);

      let overlayMarkup = '';
      if (layer.animationMode === 'screen-oscilloscope') {
        overlayMarkup = `
      <div class="kg-submask" style="${maskStyle}">
        <div class="kg-screen-box" style="${boxStyle}">
          <div class="kg-scanline"></div>
          <svg viewBox="0 0 120 28" preserveAspectRatio="none" class="kg-wave-svg">
            <path d="M0 14 L12 14 L17 4 L23 24 L29 10 L35 14 L60 14 L72 14 L77 4 L83 24 L89 10 L95 14 L120 14" fill="none" stroke="#A5F3FC" stroke-width="2.2"/>
          </svg>
        </div>
      </div>`;
      } else if (layer.animationMode === 'screen-code') {
        overlayMarkup = `
      <div class="kg-submask" style="${maskStyle}">
        <div class="kg-screen-box" style="${boxStyle}">
          <div class="kg-code-scroll">
            <div>0x4F SYNC OK</div><div>RPM: ${layer.rpm}</div><div>BUS: ACTIVE</div><div>CRC: 9A2E</div>
            <div>0x4F SYNC OK</div><div>RPM: ${layer.rpm}</div><div>BUS: ACTIVE</div><div>CRC: 9A2E</div>
          </div>
        </div>
      </div>`;
      } else if (layer.animationMode === 'screen-radar') {
        overlayMarkup = `
      <div class="kg-submask" style="${maskStyle}">
        <div class="kg-screen-box" style="${boxStyle}">
          <div class="kg-radar-sweep"></div>
          <span class="kg-radar-blip"></span>
        </div>
      </div>`;
      } else if (layer.animationMode === 'gauge-fluid') {
        overlayMarkup = `
      <div class="kg-submask" style="${maskStyle}">
        <div class="kg-screen-box" style="${boxStyle}">
          <div class="kg-fluid-fill" style="--fluid-color:${layer.glowColor};"></div>
        </div>
      </div>`;
      } else if (layer.animationMode === 'circuit-pulse') {
        const tracerSvg = tracePath
          ? `<svg viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}" class="kg-tracer-svg">
          <path d="${tracePath}" fill="none" stroke="${layer.glowColor}" stroke-width="2.4" stroke-dasharray="10 18" stroke-linecap="round" class="kg-trace-dash"/>
          <circle r="3.2" fill="#FFFFFF"><animateMotion dur="${(1.8 / layer.speed).toFixed(2)}s" repeatCount="indefinite" path="${tracePath}"/></circle>
        </svg>`
          : '';
        overlayMarkup = `
      <div class="kg-submask" style="-webkit-mask-image:url('${layer.maskUrl}');mask-image:url('${layer.maskUrl}');">
        <div class="kg-circuit-sweep" style="--kg-glow:${layer.glowColor};"></div>
      </div>
      ${tracerSvg}`;
      }

      return `    <div
      class="kg-layer kg-mode-${layer.animationMode}"
      id="${safeId}"
      data-mode="${layer.animationMode}"
      data-idle-enabled="${layer.choreography.idle.enabled}"
      data-idle-speed="${layer.choreography.idle.speedMultiplier}"
      data-hover-speed="${layer.choreography.hover.speedMultiplier}"
      data-ratchet-boost="${layer.choreography.hover.ratchetBoost}"
      data-fan-blur="${layer.choreography.hover.fanBlur}"
      data-reverse-click="${layer.choreography.active.reverseOnClick}"
      data-speed="${layer.speed}"
      data-rpm="${layer.rpm}"
      data-min-angle="${layer.minAngle}"
      data-max-angle="${layer.maxAngle}"
      data-delay="${layer.phaseDelayMs}"
      data-easing="${layer.easing}"
      style="z-index:${layer.zIndex};transform-origin:${layer.pivotPercent.x}% ${layer.pivotPercent.y}%;--layer-glow:${layer.glowColor};"
    >
      <img src="${layer.fullSpriteUrl}" alt="${layer.name}" draggable="false" />${overlayMarkup}
    </div>`;
    })
    .join('\n');
}

const SHARED_LAYER_CSS = `
    .kg-stage { position: relative; width: 100%; height: 100%; pointer-events: none; }
    .kg-layer { position: absolute; inset: 0; will-change: transform, filter, opacity; transition: filter 180ms ease; }
    .kg-layer img { width: 100%; height: 100%; object-fit: contain; display: block; }
    .kg-submask { position: absolute; inset: 0; -webkit-mask-size: 100% 100%; mask-size: 100% 100%; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; pointer-events: none; }
    .kg-screen-box { position: absolute; overflow: hidden; mix-blend-mode: screen; background: rgba(2, 6, 23, 0.35); }
    .kg-scanline { width: 100%; height: 32%; background: linear-gradient(180deg, transparent, rgba(165, 243, 252, 0.45), transparent); animation: kgScanline 2.2s linear infinite; }
    .kg-wave-svg { position: absolute; inset: 0; width: 200%; height: 100%; animation: kgWaveScroll 2.6s linear infinite; }
    .kg-code-scroll { font-family: ui-monospace, monospace; font-size: 7px; line-height: 9px; color: rgba(167, 243, 208, 0.88); padding: 2px 4px; animation: kgCodeScroll 3.4s linear infinite; }
    .kg-radar-sweep { width: 100%; height: 100%; border-radius: 9999px; background: conic-gradient(from 0deg, rgba(103, 232, 249, 0.72) 0deg, rgba(103, 232, 249, 0.05) 70deg, transparent 90deg); animation: kgRadarSpin 2.8s linear infinite; }
    .kg-radar-blip { position: absolute; width: 5px; height: 5px; border-radius: 9999px; background: #A5F3FC; top: 28%; left: 62%; }
    .kg-fluid-fill { width: 100%; height: 100%; background: linear-gradient(180deg, #FECACA 0%, var(--fluid-color, #EF4444) 38%, #991B1B 100%); transform-origin: bottom; animation: kgFluidLevel 2.4s ease-in-out infinite; }
    .kg-circuit-sweep { position: absolute; inset: -45%; background: linear-gradient(115deg, transparent 35%, var(--kg-glow, #38BDF8) 50%, transparent 65%); animation: kgCircuitSweep 2.0s linear infinite; }
    .kg-tracer-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
    .kg-trace-dash { animation: kgCircuitDash 1.4s linear infinite; }
    .kg-ripple { position: absolute; inset: 0; border-radius: inherit; border: 2px solid var(--kg-accent); pointer-events: none; animation: kgRipple 420ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes kgScanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(320%); } }
    @keyframes kgWaveScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
    @keyframes kgCodeScroll { 0% { transform: translateY(0%); } 100% { transform: translateY(-50%); } }
    @keyframes kgRadarSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @keyframes kgFluidLevel { 0%, 100% { transform: translateY(42%) scaleY(0.95); } 50% { transform: translateY(10%) scaleY(1.04); } }
    @keyframes kgCircuitSweep { 0% { transform: translate(-60%, -60%); } 100% { transform: translate(60%, 60%); } }
    @keyframes kgCircuitDash { 0% { stroke-dashoffset: 64; } 100% { stroke-dashoffset: 0; } }
    @keyframes kgRipple { 0% { transform: scale(0.8); opacity: 0.85; } 100% { transform: scale(1.22); opacity: 0; } }
    @keyframes kgRevealFade { 0% { opacity: 0; transform: scale(0.84) translateY(6px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
    @keyframes kgRevealUnfold { 0% { opacity: 0; transform: scale(0.65) rotate(-14deg); } 70% { opacity: 1; transform: scale(1.03) rotate(2deg); } 100% { opacity: 1; transform: scale(1) rotate(0deg); } }
    @keyframes kgLogoSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) {
      .kg-layer, .kg-scanline, .kg-wave-svg, .kg-code-scroll, .kg-radar-sweep, .kg-fluid-fill, .kg-circuit-sweep, .kg-trace-dash, .kg-logo-mark, .kg-logo-ring { animation: none !important; }
    }
`;

function buildWaapiBootstrapScript(hoverSpeedFallback: number, rootSelector: string): string {
  return `
    (function () {
      const root = document.getElementById('${rootSelector}');
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const layerAnimations = [];

      if (!reduced && root) {
        root.querySelectorAll('.kg-layer').forEach((el) => {
          if (el.dataset.idleEnabled === 'false') return;
          const mode = el.dataset.mode;
          const speed = parseFloat(el.dataset.speed || '1');
          const rpm = parseFloat(el.dataset.rpm || '8');
          const minA = parseFloat(el.dataset.minAngle || '-18');
          const maxA = parseFloat(el.dataset.maxAngle || '18');
          const delay = parseFloat(el.dataset.delay || '0');
          const easing = el.dataset.easing || 'linear';
          const idleSpeed = parseFloat(el.dataset.idleSpeed || '1');
          const hoverSpeed = parseFloat(el.dataset.hoverSpeed || '${hoverSpeedFallback}');
          const reverseClick = el.dataset.reverseClick === 'true';
          const rpmDuration = Math.max(450, Math.round((60000 / Math.max(1, rpm)) / Math.max(0.2, speed)));
          let anim = null;

          if (mode === 'rotate-cw') {
            anim = el.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: rpmDuration, iterations: Infinity, easing, delay });
          } else if (mode === 'rotate-ccw') {
            anim = el.animate([{ transform: 'rotate(360deg)' }, { transform: 'rotate(0deg)' }], { duration: rpmDuration, iterations: Infinity, easing, delay });
          } else if (mode === 'gear-ratchet') {
            anim = el.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: Math.max(800, rpmDuration), iterations: Infinity, easing: 'steps(12, end)', delay });
          } else if (mode === 'fan-spin') {
            anim = el.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: Math.max(320, Math.round(rpmDuration * 0.45)), iterations: Infinity, easing: 'linear', delay });
          } else if (mode === 'gauge-needle') {
            anim = el.animate(
              [{ transform: 'rotate(' + minA + 'deg)' }, { transform: 'rotate(' + maxA + 'deg)' }, { transform: 'rotate(' + minA + 'deg)' }],
              { duration: Math.round(2800 / speed), iterations: Infinity, easing: easing === 'linear' ? 'ease-in-out' : easing, delay }
            );
          } else if (mode === 'circuit-pulse') {
            anim = el.animate([{ opacity: 0.84 }, { opacity: 1 }, { opacity: 0.84 }], { duration: Math.round(1800 / speed), iterations: Infinity, easing, delay });
          } else if (mode === 'ambient-breathe') {
            anim = el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.018)' }, { transform: 'scale(1)' }], { duration: Math.round(3600 / speed), iterations: Infinity, easing: 'ease-in-out', delay });
          }

          if (anim) {
            anim.playbackRate = idleSpeed;
            layerAnimations.push({ anim, idleSpeed, hoverSpeed, reverseClick });
          }
        });
      }

      if (!root) return;
      root.addEventListener('mouseenter', () => {
        layerAnimations.forEach((entry) => { entry.anim.playbackRate = entry.hoverSpeed; });
      });
      root.addEventListener('mouseleave', () => {
        layerAnimations.forEach((entry) => { entry.anim.playbackRate = entry.idleSpeed; });
      });
      if (root.tagName === 'BUTTON') {
        root.addEventListener('mousedown', () => {
          layerAnimations.forEach((entry) => { if (entry.reverseClick) entry.anim.playbackRate = -entry.hoverSpeed; });
        });
        root.addEventListener('mouseup', () => {
          layerAnimations.forEach((entry) => { entry.anim.playbackRate = entry.hoverSpeed; });
        });
        root.addEventListener('click', () => {
          if (root.dataset.toggleable === 'true') {
            const next = root.getAttribute('aria-pressed') !== 'true';
            root.setAttribute('aria-pressed', String(next));
          }
          const ripple = document.createElement('span');
          ripple.className = 'kg-ripple';
          root.appendChild(ripple);
          setTimeout(() => ripple.remove(), 450);
        });
      }
    })();
  `;
}

export function generateHtmlLogoExport(
  layers: SegmentedLayer[],
  config: ButtonConfig
): string {
  const activeLayers = layers.filter((l) => l.visible);
  const layerMarkup = buildLayerMarkup(activeLayers);
  const revealAnim =
    config.logoReveal === 'fade-scale'
      ? 'animation: kgRevealFade 550ms cubic-bezier(0.16, 1, 0.3, 1) forwards;'
      : config.logoReveal === 'radial-unfold'
      ? 'animation: kgRevealUnfold 720ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;'
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${config.label} — Animated Logo Mark</title>
  <style>
    :root { --kg-size: ${config.sizePx}px; --kg-accent: ${config.accentColor}; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0b0f17; font-family: system-ui, -apple-system, sans-serif; }
    .kg-logo-wrap { display: inline-flex; flex-direction: column; align-items: center; gap: 12px; }
    .kg-logo-mark { position: relative; width: var(--kg-size); height: var(--kg-size); display: grid; place-items: center; ${revealAnim} }
    .kg-logo-mark:hover .kg-layer { filter: drop-shadow(0 0 8px var(--layer-glow, var(--kg-accent))); }
    .kg-logo-ring { position: absolute; inset: -6px; border-radius: 9999px; border: 2px solid transparent; border-top-color: var(--kg-accent); border-right-color: rgba(56, 189, 248, 0.35); pointer-events: none; animation: kgLogoSpin 1.1s linear infinite; }
    .kg-logo-label { font-size: 13px; font-weight: 600; color: #e2e8f0; letter-spacing: 0.02em; }
${SHARED_LAYER_CSS}
  </style>
</head>
<body>
  <div class="kg-logo-wrap">
    <div class="kg-logo-mark" id="kineticLogoMark" role="img" aria-label="${config.ariaLabel}">
      ${config.logoLoading ? '<span class="kg-logo-ring" aria-hidden="true"></span>' : ''}
      <div class="kg-stage">
${layerMarkup}
      </div>
    </div>
    ${config.showCaption ? `<span class="kg-logo-label">${config.label}</span>` : ''}
  </div>
  <script>${buildWaapiBootstrapScript(config.hoverSpeedMultiplier, 'kineticLogoMark')}</script>
</body>
</html>`;
}

export function generateHtmlButtonExport(
  layers: SegmentedLayer[],
  config: ButtonConfig
): string {
  if (config.targetMode === 'logo') {
    return generateHtmlLogoExport(layers, config);
  }
  if (config.targetMode === 'favicon') {
    return generateFaviconControllerHtml(layers, config);
  }

  const activeLayers = layers.filter((l) => l.visible);
  const radius = borderRadiusForShape(config.shape);
  const layerMarkup = buildLayerMarkup(activeLayers);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${config.label} — Living Interactive Button</title>
  <style>
    :root {
      --kg-size: ${config.sizePx}px;
      --kg-radius: ${radius};
      --kg-surface: ${config.surfaceTint};
      --kg-accent: ${config.accentColor};
      --kg-glow-alpha: ${Math.min(0.85, config.hoverGlowIntensity * 0.42).toFixed(2)};
      --kg-press-depth: ${config.pressDepthPx}px;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #0b0f17;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .kg-button {
      position: relative;
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: var(--kg-size);
      height: var(--kg-size);
      padding: 12px;
      border-radius: var(--kg-radius);
      border: 1px solid rgba(148, 163, 184, 0.28);
      background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.08), transparent 65%), var(--kg-surface);
      box-shadow:
        0 14px 32px -10px rgba(0, 0, 0, 0.7),
        0 0 0 1px rgba(255, 255, 255, 0.05) inset;
      cursor: pointer;
      overflow: hidden;
      user-select: none;
      transition: transform 140ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms ease, border-color 220ms ease;
    }

    .kg-button:hover,
    .kg-button[aria-pressed="true"] {
      transform: translateY(-2px);
      border-color: var(--kg-accent);
      box-shadow:
        0 18px 40px -10px rgba(0, 0, 0, 0.78),
        0 0 28px rgba(56, 189, 248, var(--kg-glow-alpha)),
        0 0 0 1px rgba(255, 255, 255, 0.14) inset;
    }

    .kg-button:active {
      transform: translateY(var(--kg-press-depth)) scale(0.965);
      box-shadow:
        0 4px 12px -4px rgba(0, 0, 0, 0.85),
        0 0 20px rgba(56, 189, 248, 0.38);
    }

    .kg-button:focus-visible {
      outline: 2px solid var(--kg-accent);
      outline-offset: 4px;
    }

    .kg-button:hover .kg-layer,
    .kg-button[aria-pressed="true"] .kg-layer {
      filter: drop-shadow(0 0 8px var(--layer-glow, var(--kg-accent)));
    }

    .kg-button:hover .kg-layer[data-fan-blur="true"] {
      filter: drop-shadow(0 0 8px var(--layer-glow, var(--kg-accent))) blur(0.6px);
    }
${SHARED_LAYER_CSS}
  </style>
</head>
<body>
  <button
    type="button"
    class="kg-button"
    id="kineticGlyphBtn"
    aria-label="${config.ariaLabel}"
    data-toggleable="${config.toggleable}"
    ${config.toggleable ? 'aria-pressed="false"' : ''}
  >
    <div class="kg-stage">
${layerMarkup}
    </div>
  </button>

  <script>${buildWaapiBootstrapScript(config.hoverSpeedMultiplier, 'kineticGlyphBtn')}</script>
</body>
</html>`;
}

export function generateFaviconKitExport(
  layers: SegmentedLayer[],
  config: ButtonConfig
): string {
  const linkTags = generateFaviconLinkTagsHtml();
  const manifest = generateWebManifestJson(config.label);
  const controller = generateFaviconControllerHtml(layers, config);

  return `<!-- ============================================================
     KineticGlyph Web Icon & Dynamic Favicon Bundle
     Browser Support Note:
       - Chromium & Firefox support throttled dynamic Canvas <link rel="icon"> updates while the tab is visible.
       - Safari, iOS, and mobile browsers ignore or block dynamic tab favicon updates and rely on the static PNG/ICO/SVG fallbacks below.
     ============================================================ -->

<!-- 1. Add these static & manifest tags to <head> -->
${linkTags}

<!-- 2. Save as /site.webmanifest -->
/*
${manifest}
*/

<!-- 3. Dynamic Tab Controller + Fallback Reference Document -->
${controller}`;
}

/**
 * Generates a valid Bodymovin / Lottie v5.9.0 JSON document embedding each isolated
 * layer sprite asset, true pivot anchor coordinates, easing handles, phase offsets,
 * interior sub-layer overlays, and circuit tracer spark layers.
 */
export function generateLottieJsonExport(
  layers: SegmentedLayer[],
  config: ButtonConfig
): string {
  const activeLayers = layers.filter((l) => l.visible);
  const fps = 60;
  const totalFrames = 180;

  const assets = activeLayers.map((layer, idx) => ({
    id: `asset_${idx + 1}`,
    w: layer.bbox.w,
    h: layer.bbox.h,
    u: '',
    p: layer.croppedSpriteUrl,
    e: 1,
  }));

  const lottieLayers: Array<Record<string, unknown>> = [];

  activeLayers.forEach((layer, idx) => {
    const worldPivotX = (layer.pivotPercent.x / 100) * CANVAS_SIZE;
    const worldPivotY = (layer.pivotPercent.y / 100) * CANVAS_SIZE;
    const anchorX = worldPivotX - layer.bbox.x;
    const anchorY = worldPivotY - layer.bbox.y;
    const handles = lottieHandlesForEasing(layer.easing);
    const delayFrames = Math.round(((layer.phaseDelayMs || 0) / 1000) * fps);

    let rProp: Record<string, unknown> = { a: 0, k: 0 };
    if (
      layer.animationMode === 'rotate-cw' ||
      layer.animationMode === 'rotate-ccw' ||
      layer.animationMode === 'gear-ratchet' ||
      layer.animationMode === 'fan-spin'
    ) {
      const dir = layer.animationMode === 'rotate-ccw' ? -360 : 360;
      rProp = {
        a: 1,
        k: [
          { t: 0, s: [0], e: [dir], ...handles },
          { t: totalFrames, s: [dir] },
        ],
      };
    } else if (layer.animationMode === 'gauge-needle') {
      rProp = {
        a: 1,
        k: [
          { t: 0, s: [layer.minAngle], e: [layer.maxAngle], ...handles },
          { t: totalFrames / 2, s: [layer.maxAngle], e: [layer.minAngle], ...handles },
          { t: totalFrames, s: [layer.minAngle] },
        ],
      };
    }

    let oProp: Record<string, unknown> = { a: 0, k: 100 };
    if (
      layer.animationMode === 'circuit-pulse' ||
      layer.animationMode === 'screen-code' ||
      layer.animationMode === 'screen-oscilloscope' ||
      layer.animationMode === 'screen-radar'
    ) {
      oProp = {
        a: 1,
        k: [
          { t: 0, s: [76], e: [100], ...handles },
          { t: totalFrames / 2, s: [100], e: [76], ...handles },
          { t: totalFrames, s: [76] },
        ],
      };
    }

    let sProp: Record<string, unknown> = { a: 0, k: [100, 100, 100] };
    if (layer.animationMode === 'ambient-breathe') {
      sProp = {
        a: 1,
        k: [
          { t: 0, s: [100, 100, 100], e: [103, 103, 100], ...handles },
          { t: totalFrames / 2, s: [103, 103, 100], e: [100, 100, 100], ...handles },
          { t: totalFrames, s: [100, 100, 100] },
        ],
      };
    }

    lottieLayers.push({
      ddd: 0,
      ind: idx + 1,
      ty: 2,
      nm: layer.name,
      refId: `asset_${idx + 1}`,
      sr: Number((layer.speed * (layer.rpm / 8)).toFixed(2)),
      ks: {
        o: oProp,
        r: rProp,
        p: { a: 0, k: [Number(worldPivotX.toFixed(2)), Number(worldPivotY.toFixed(2)), 0] },
        a: { a: 0, k: [Number(anchorX.toFixed(2)), Number(anchorY.toFixed(2)), 0] },
        s: sProp,
      },
      ao: 0,
      ip: 0,
      op: totalFrames,
      st: delayFrames,
      bm: 0,
    });

    if (layer.animationMode === 'circuit-pulse' && layer.tracePoints.length >= 2) {
      const start = layer.tracePoints[0];
      const mid = layer.tracePoints[Math.floor(layer.tracePoints.length / 2)];
      const end = layer.tracePoints[layer.tracePoints.length - 1];
      lottieLayers.push({
        ddd: 0,
        ind: 100 + idx,
        ty: 4,
        nm: `${layer.name} Tracer Spark`,
        sr: Number(layer.speed.toFixed(2)),
        ks: {
          o: { a: 0, k: 95 },
          r: { a: 0, k: 0 },
          p: {
            a: 1,
            k: [
              { t: 0, s: [start.x, start.y, 0], e: [mid.x, mid.y, 0], ...handles },
              { t: totalFrames / 2, s: [mid.x, mid.y, 0], e: [end.x, end.y, 0], ...handles },
              { t: totalFrames, s: [end.x, end.y, 0] },
            ],
          },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] },
        },
        shapes: [
          { ty: 'el', d: 1, s: { a: 0, k: [7, 7] }, p: { a: 0, k: [0, 0] }, nm: 'Spark Ellipse' },
          { ty: 'fl', c: { a: 0, k: [1, 1, 1, 1] }, o: { a: 0, k: 100 }, nm: 'Spark Fill' },
        ],
        ip: 0,
        op: totalFrames,
        st: delayFrames,
        bm: 0,
      });
    }
  });

  const lottieDocument = {
    v: '5.9.0',
    fr: fps,
    ip: 0,
    op: totalFrames,
    w: CANVAS_SIZE,
    h: CANVAS_SIZE,
    nm: config.label || 'KineticGlyph Asset',
    ddd: 0,
    assets,
    layers: lottieLayers.reverse(),
    markers: [],
  };

  return JSON.stringify(lottieDocument, null, 2);
}

/**
 * Generates a self-contained Animated SVG document adapting cleanly for Button, Logo, or Favicon modes.
 */
export function generateAnimatedSvgExport(
  layers: SegmentedLayer[],
  config: ButtonConfig
): string {
  const activeLayers = layers.filter((l) => l.visible);
  const rx = config.shape === 'circle' ? 128 : config.shape === 'rounded' ? 24 : 38;
  const defs: string[] = [];

  const svgLayers = activeLayers
    .map((layer, idx) => {
      const px = ((layer.pivotPercent.x / 100) * CANVAS_SIZE).toFixed(1);
      const py = ((layer.pivotPercent.y / 100) * CANVAS_SIZE).toFixed(1);
      const delaySec = (layer.phaseDelayMs / 1000).toFixed(2);
      const rpmDur = Math.max(0.45, (60 / Math.max(1, layer.rpm)) / Math.max(0.2, layer.speed)).toFixed(2);
      let animTag = '';
      let subContent = '';

      if (layer.animationMode === 'rotate-cw' || layer.animationMode === 'fan-spin') {
        const dur = layer.animationMode === 'fan-spin' ? (Number(rpmDur) * 0.45).toFixed(2) : rpmDur;
        animTag = `<animateTransform attributeName="transform" type="rotate" from="0 ${px} ${py}" to="360 ${px} ${py}" dur="${dur}s" begin="${delaySec}s" repeatCount="indefinite" />`;
      } else if (layer.animationMode === 'rotate-ccw') {
        animTag = `<animateTransform attributeName="transform" type="rotate" from="360 ${px} ${py}" to="0 ${px} ${py}" dur="${rpmDur}s" begin="${delaySec}s" repeatCount="indefinite" />`;
      } else if (layer.animationMode === 'gear-ratchet') {
        animTag = `<animateTransform attributeName="transform" type="rotate" values="0 ${px} ${py};90 ${px} ${py};180 ${px} ${py};270 ${px} ${py};360 ${px} ${py}" calcMode="discrete" dur="${rpmDur}s" begin="${delaySec}s" repeatCount="indefinite" />`;
      } else if (layer.animationMode === 'gauge-needle') {
        const dur = (2.8 / layer.speed).toFixed(2);
        animTag = `<animateTransform attributeName="transform" type="rotate" values="${layer.minAngle} ${px} ${py};${layer.maxAngle} ${px} ${py};${layer.minAngle} ${px} ${py}" dur="${dur}s" begin="${delaySec}s" repeatCount="indefinite" />`;
      } else if (layer.animationMode === 'circuit-pulse') {
        const dur = (1.8 / layer.speed).toFixed(2);
        animTag = `<animate attributeName="opacity" values="0.78;1;0.78" dur="${dur}s" begin="${delaySec}s" repeatCount="indefinite" />`;
        const pathD = tracePointsToSvgPath(layer.tracePoints);
        if (pathD) {
          subContent = `
      <path d="${pathD}" fill="none" stroke="${layer.glowColor}" stroke-width="2.4" stroke-dasharray="10 18" stroke-linecap="round">
        <animate attributeName="stroke-dashoffset" from="56" to="0" dur="${(1.4 / layer.speed).toFixed(2)}s" repeatCount="indefinite" />
      </path>
      <circle r="3" fill="#FFFFFF">
        <animateMotion dur="${dur}s" repeatCount="indefinite" path="${pathD}" />
      </circle>`;
        }
      } else if (
        layer.animationMode === 'screen-oscilloscope' ||
        layer.animationMode === 'screen-code' ||
        layer.animationMode === 'screen-radar' ||
        layer.animationMode === 'gauge-fluid'
      ) {
        const subBox = layer.interiorSubRegion?.bbox ?? layer.bbox;
        const clipId = `clip-${idx}-${layer.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
        defs.push(
          `<clipPath id="${clipId}"><rect x="${subBox.x}" y="${subBox.y}" width="${subBox.w}" height="${subBox.h}" rx="3" /></clipPath>`
        );
        if (layer.animationMode === 'gauge-fluid') {
          subContent = `
      <g clip-path="url(#${clipId})">
        <rect x="${subBox.x}" y="${subBox.y}" width="${subBox.w}" height="${subBox.h}" fill="${layer.glowColor}" opacity="0.85">
          <animate attributeName="y" values="${subBox.y + subBox.h * 0.45};${subBox.y + subBox.h * 0.1};${subBox.y + subBox.h * 0.45}" dur="${(2.4 / layer.speed).toFixed(2)}s" repeatCount="indefinite" />
        </rect>
      </g>`;
        } else if (layer.animationMode === 'screen-radar') {
          const rcx = (subBox.x + subBox.w / 2).toFixed(1);
          const rcy = (subBox.y + subBox.h / 2).toFixed(1);
          subContent = `
      <g clip-path="url(#${clipId})">
        <line x1="${rcx}" y1="${rcy}" x2="${subBox.x + subBox.w}" y2="${rcy}" stroke="#67E8F9" stroke-width="2.2" stroke-linecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 ${rcx} ${rcy}" to="360 ${rcx} ${rcy}" dur="${(2.6 / layer.speed).toFixed(2)}s" repeatCount="indefinite" />
        </line>
      </g>`;
        } else {
          const midY = (subBox.y + subBox.h / 2).toFixed(1);
          subContent = `
      <g clip-path="url(#${clipId})">
        <path d="M${subBox.x} ${midY} L${subBox.x + subBox.w * 0.3} ${midY} L${subBox.x + subBox.w * 0.45} ${subBox.y + 4} L${subBox.x + subBox.w * 0.6} ${subBox.y + subBox.h - 4} L${subBox.x + subBox.w * 0.75} ${midY} L${subBox.x + subBox.w} ${midY}" fill="none" stroke="#A5F3FC" stroke-width="2">
          <animate attributeName="opacity" values="0.45;1;0.45" dur="${(1.8 / layer.speed).toFixed(2)}s" repeatCount="indefinite" />
        </path>
      </g>`;
        }
      }

      return `    <g id="${layer.id}">
      <image href="${layer.fullSpriteUrl}" x="0" y="0" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" />
      ${animTag}${subContent}
    </g>`;
    })
    .join('\n');

  const containerPlate =
    config.targetMode === 'logo'
      ? ''
      : `<rect x="2" y="2" width="${CANVAS_SIZE - 4}" height="${CANVAS_SIZE - 4}" rx="${rx}" fill="${config.surfaceTint}" stroke="${config.accentColor}" stroke-opacity="0.35" stroke-width="2" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}" width="${config.sizePx}" height="${config.sizePx}" role="img" aria-label="${config.ariaLabel}">
  <defs>
    ${defs.join('\n    ')}
  </defs>
  <style>
    .kg-root { cursor: pointer; transition: transform 150ms cubic-bezier(0.16, 1, 0.3, 1), filter 200ms ease; transform-origin: center; }
    .kg-root:hover { filter: drop-shadow(0 0 10px ${config.accentColor}); transform: translateY(-2px); }
    .kg-root:active { transform: scale(0.96); }
  </style>
  <g class="kg-root">
    ${containerPlate}
${svgLayers}
  </g>
</svg>`;
}
