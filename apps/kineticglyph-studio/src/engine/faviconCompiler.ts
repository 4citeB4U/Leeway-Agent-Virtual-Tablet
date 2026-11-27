/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.ENGINE.FAVICON
TAG: LEEWAY.ENGINE.WEBICON.COMPILER

5WH:
WHAT = Deterministic favicon & web-icon simplification, multi-size rasterization (16x16..512x512), binary PNG-in-ICO builder, Web App Manifest generator, and dynamic tab favicon controller snippet compiler.
WHY = Ensure fine segmented details remain crisp at small browser tab sizes and provide complete static fallbacks alongside dynamic <link rel="icon"> animation with honest browser compatibility notes.
WHO = Leeway Innovations — KineticGlyph Web Icon Engine
WHERE = src/engine/faviconCompiler.ts
WHEN = 2026-11-27
HOW = Selects high-impact structural layers for small-scale legibility, renders contrast-boosted Canvas sprites across 16/32/48/180/192/512px, packs multi-resolution .ico binary headers, and generates <link>/manifest/JS controller artifacts.

LICENSE = Apache-2.0
*/

import {
  ButtonConfig,
  FAVICON_TARGET_SIZES,
  FaviconRenderedAsset,
  FaviconSize,
  SegmentedLayer,
} from '../types/studio';
import { CANVAS_SIZE, loadImageElement } from './segmenter';

export interface SimplifiedFaviconPlan {
  keptLayers: SegmentedLayer[];
  prunedLayers: SegmentedLayer[];
}

const SIZE_ROLE_LABELS: Record<FaviconSize, string> = {
  16: 'Browser Tab (1x)',
  32: 'Browser Tab (Retina) / Taskbar',
  48: 'Windows Site Icon / Shortcut',
  180: 'Apple Touch Icon (iOS)',
  192: 'Android / PWA Home Icon',
  512: 'PWA Splash / Store Icon',
};

/**
 * Selects simplified, high-legibility layers for tiny favicon sizes (<= 48px)
 * so fine sub-pixel circuitry does not turn into visual noise in a browser tab.
 */
export function selectSimplifiedFaviconLayers(
  layers: SegmentedLayer[],
  minArea: number
): SimplifiedFaviconPlan {
  const visible = layers.filter((l) => l.visible);
  if (visible.length === 0) {
    return { keptLayers: [], prunedLayers: [] };
  }

  const keptLayers: SegmentedLayer[] = [];
  const prunedLayers: SegmentedLayer[] = [];

  for (const layer of visible) {
    // Always preserve primary structural shapes, gears, screens, or large gauges; prune tiny trace fragments
    if (layer.metrics.area >= minArea || layer.role === 'gear' || layer.role === 'chassis') {
      keptLayers.push(layer);
    } else {
      prunedLayers.push(layer);
    }
  }

  // Never prune all layers; keep the largest layer as a fallback silhouette
  if (keptLayers.length === 0) {
    const largest = [...visible].sort((a, b) => b.metrics.area - a.metrics.area)[0];
    return {
      keptLayers: [largest],
      prunedLayers: visible.filter((l) => l.id !== largest.id),
    };
  }

  return { keptLayers, prunedLayers };
}

/**
 * Renders contrast-boosted, simplified favicon PNGs for all standard web sizes:
 * 16x16, 32x32, 48x48, 180x180, 192x192, and 512x512.
 */
export async function renderFaviconMatrixAssets(
  layers: SegmentedLayer[],
  config: ButtonConfig
): Promise<FaviconRenderedAsset[]> {
  const { keptLayers } = selectSimplifiedFaviconLayers(layers, config.faviconSimplifyMinArea);
  const fullVisible = layers.filter((l) => l.visible);

  const uniqueUrls = Array.from(
    new Set([...keptLayers, ...fullVisible].map((l) => l.fullSpriteUrl))
  );
  const imageCache = new Map<string, HTMLImageElement>();
  await Promise.all(
    uniqueUrls.map(async (url) => {
      try {
        imageCache.set(url, await loadImageElement(url));
      } catch {
        // Skip broken data URL
      }
    })
  );

  const assets: FaviconRenderedAsset[] = [];

  for (const size of FAVICON_TARGET_SIZES) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, size, size);

    // Rounded high-contrast plate for tiny sizes so silhouettes stay crisp over light or dark browser chrome
    if (size <= 48) {
      const r = Math.round(size * 0.22);
      ctx.fillStyle = config.surfaceTint || '#0F172A';
      ctx.beginPath();
      ctx.roundRect(0, 0, size, size, r);
      ctx.fill();
    }

    const activeSet = size <= 48 ? keptLayers : fullVisible;
    const contrastPct = Math.round(
      (size <= 48 ? config.faviconContrastBoost : 1.05) * 100
    );
    const saturatePct = size <= 48 ? 118 : 105;
    ctx.filter = `contrast(${contrastPct}%) saturate(${saturatePct}%)`;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const pad = size <= 48 ? Math.max(1, Math.round(size * 0.08)) : Math.round(size * 0.06);
    const drawSize = size - pad * 2;

    for (const layer of activeSet) {
      const img = imageCache.get(layer.fullSpriteUrl);
      if (img) {
        ctx.drawImage(img, pad, pad, drawSize, drawSize);
      }
    }

    ctx.filter = 'none';
    assets.push({
      size,
      dataUrl: canvas.toDataURL('image/png'),
      roleLabel: SIZE_ROLE_LABELS[size],
    });
  }

  return assets;
}

function decodeBase64PngBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] ?? '';
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

/**
 * Packs 16x16, 32x32, and 48x48 PNG images into a valid multi-resolution binary Microsoft .ICO container.
 */
export function buildMultiResolutionIcoBytes(
  frames: Array<{ size: number; pngDataUrl: string }>
): Uint8Array {
  const validFrames = frames
    .filter((f) => f.size <= 256 && f.pngDataUrl.startsWith('data:image/png;base64,'))
    .slice(0, 8);

  const count = validFrames.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const payloads = validFrames.map((f) => ({
    size: f.size,
    bytes: decodeBase64PngBytes(f.pngDataUrl),
  }));

  const totalPayloadBytes = payloads.reduce((sum, p) => sum + p.bytes.length, 0);
  const totalSize = headerSize + count * dirEntrySize + totalPayloadBytes;
  const buffer = new Uint8Array(totalSize);
  const view = new DataView(buffer.buffer);

  // ICONDIR header: Reserved(0), Type(1 = icon), Count
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, count, true);

  let offset = headerSize + count * dirEntrySize;
  payloads.forEach((p, idx) => {
    const entryOffset = headerSize + idx * dirEntrySize;
    const dimByte = p.size >= 256 ? 0 : p.size;
    buffer[entryOffset] = dimByte; // width
    buffer[entryOffset + 1] = dimByte; // height
    buffer[entryOffset + 2] = 0; // color palette
    buffer[entryOffset + 3] = 0; // reserved
    view.setUint16(entryOffset + 4, 1, true); // color planes
    view.setUint16(entryOffset + 6, 32, true); // bits per pixel
    view.setUint32(entryOffset + 8, p.bytes.length, true); // image byte size
    view.setUint32(entryOffset + 12, offset, true); // image offset

    buffer.set(p.bytes, offset);
    offset += p.bytes.length;
  });

  return buffer;
}

export function generateWebManifestJson(appName: string): string {
  const manifest = {
    name: appName || 'KineticGlyph Web App',
    short_name: (appName || 'KineticGlyph').slice(0, 16),
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    theme_color: '#0B0F17',
    background_color: '#0B0F17',
    display: 'standalone',
  };
  return JSON.stringify(manifest, null, 2);
}

export function generateFaviconLinkTagsHtml(): string {
  return `<!-- Static Favicon & Web Icon Fallbacks (Required for Safari, iOS, and all browsers) -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
<link rel="shortcut icon" href="/favicon.ico" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />`;
}

/**
 * Generates a self-contained dynamic browser-tab favicon controller (<link rel="icon"> updater)
 * paired with static fallbacks and explicit browser compatibility documentation.
 */
export function generateFaviconControllerHtml(
  layers: SegmentedLayer[],
  config: ButtonConfig
): string {
  const { keptLayers } = selectSimplifiedFaviconLayers(layers, config.faviconSimplifyMinArea);
  const serializedLayers = keptLayers.map((l) => ({
    src: l.fullSpriteUrl,
    mode: l.animationMode,
    pivotX: (l.pivotPercent.x / 100) * 32,
    pivotY: (l.pivotPercent.y / 100) * 32,
    rpm: l.rpm,
    speed: l.speed,
    minAngle: l.minAngle,
    maxAngle: l.maxAngle,
  }));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${config.label || 'KineticGlyph'} — Web Icon & Dynamic Tab Favicon Kit</title>
  ${generateFaviconLinkTagsHtml()}
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #0b0f17;
      color: #f1f5f9;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 24px;
    }
    .kit-card {
      max-width: 460px;
      border: 1px solid #1e293b;
      border-radius: 16px;
      background: #0f1520;
      padding: 20px;
    }
    .kit-card h1 { font-size: 15px; margin: 0 0 8px; }
    .kit-card p { font-size: 12px; line-height: 1.55; color: #94a3b8; margin: 0 0 12px; }
    .preview-row { display: flex; align-items: center; gap: 14px; }
    canvas { border: 1px solid #334155; border-radius: 6px; image-rendering: auto; }
  </style>
</head>
<body>
  <div class="kit-card">
    <h1>Dynamic Tab Favicon Controller</h1>
    <p>
      Updates <code>&lt;link rel="icon"&gt;</code> via offscreen Canvas at 4 fps when the tab is visible and <code>prefers-reduced-motion</code> is unset.
      <strong>Browser Note:</strong> Chromium and Firefox support live Canvas favicon updates; Safari, iOS, and mobile browsers ignore or throttle dynamic tab icon swaps and automatically display the static PNG/ICO/SVG fallback links.
    </p>
    <div class="preview-row">
      <canvas id="kgFaviconCanvas" width="32" height="32" aria-label="Live 32x32 tab icon preview"></canvas>
      <span style="font-size:12px;color:#cbd5e1;">Live 32×32 simplified tab render</span>
    </div>
  </div>

  <script>
    (function () {
      const layerSpecs = ${JSON.stringify(serializedLayers)};
      const surfaceTint = ${JSON.stringify(config.surfaceTint || '#0F172A')};
      const contrastPct = ${Math.round(config.faviconContrastBoost * 100)};
      const canvas = document.getElementById('kgFaviconCanvas');
      const ctx = canvas.getContext('2d');
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      let linkEl = document.querySelector('link[rel="icon"][data-kg-dynamic="true"]');
      if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.rel = 'icon';
        linkEl.type = 'image/png';
        linkEl.setAttribute('data-kg-dynamic', 'true');
        document.head.appendChild(linkEl);
      }

      const loaded = layerSpecs.map((spec) => {
        const img = new Image();
        img.src = spec.src;
        return { spec, img };
      });

      function renderFrame(nowMs) {
        const t = nowMs / 1000;
        ctx.clearRect(0, 0, 32, 32);
        ctx.fillStyle = surfaceTint;
        ctx.beginPath();
        ctx.roundRect(0, 0, 32, 32, 7);
        ctx.fill();
        ctx.filter = 'contrast(' + contrastPct + '%) saturate(118%)';

        loaded.forEach(({ spec, img }) => {
          if (!img.complete) return;
          ctx.save();
          ctx.translate(spec.pivotX, spec.pivotY);
          if (spec.mode === 'rotate-cw' || spec.mode === 'fan-spin' || spec.mode === 'gear-ratchet') {
            ctx.rotate((t * (spec.rpm / 60) * spec.speed) * Math.PI * 2);
          } else if (spec.mode === 'rotate-ccw') {
            ctx.rotate(-(t * (spec.rpm / 60) * spec.speed) * Math.PI * 2);
          } else if (spec.mode === 'gauge-needle') {
            const mid = (spec.minAngle + spec.maxAngle) / 2;
            const span = (spec.maxAngle - spec.minAngle) / 2;
            const deg = mid + Math.sin(t * 2.2 * spec.speed) * span;
            ctx.rotate((deg * Math.PI) / 180);
          }
          ctx.translate(-spec.pivotX, -spec.pivotY);
          ctx.drawImage(img, 2, 2, 28, 28);
          ctx.restore();
        });

        ctx.filter = 'none';
        try {
          linkEl.href = canvas.toDataURL('image/png');
        } catch (err) {
          // Ignore security/tainted canvas errors if external CORS assets are used
        }
      }

      // Render initial crisp frame immediately
      setTimeout(() => renderFrame(0), 60);

      if (!reduced) {
        // Throttled 250ms (4 fps) interval respects browser tab CPU budgets
        setInterval(() => {
          if (document.visibilityState === 'visible') {
            renderFrame(performance.now());
          }
        }, 250);
      }
    })();
  </script>
</body>
</html>`;
}

export function getCanonicalCanvasSize(): number {
  return CANVAS_SIZE;
}
