/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.TESTS.STUDIO
TAG: LEEWAY.TESTS.SEGMENTER.EXPORTS

5WH:
WHAT = Unit and integration tests verifying pixel segmentation, zero-wobble geometric centering, interior sub-layer cavity detection, circuit trace waypoints, full-parity HTML/CSS/JS, Lottie JSON, Animated SVG export, and Formula Fabric fail-closed behavior.
WHY = Satisfy LeeWay R14 and R17 by validating real inputs, observable outputs, and negative fail-closed cases across all amended animation engine capabilities.
WHO = Leeway Innovations — KineticGlyph Quality Assurance
WHERE = tests/segmenter.test.ts
WHEN = 2026-11-27
HOW = Executed via Node/tsx native test runner (npm test).

LICENSE = Apache-2.0
*/

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CANVAS_SIZE,
  DEFAULT_SEGMENTATION_OPTIONS,
  classifyComponent,
  computePivotForPreset,
  createDefaultChoreography,
  segmentImageData,
} from '../src/engine/segmenter';
import {
  generateAnimatedSvgExport,
  generateFaviconKitExport,
  generateHtmlButtonExport,
  generateLottieJsonExport,
} from '../src/engine/exporters';
import {
  buildMultiResolutionIcoBytes,
  generateFaviconControllerHtml,
  generateWebManifestJson,
  selectSimplifiedFaviconLayers,
} from '../src/engine/faviconCompiler';
import { inspectFormulaFabricAuthority } from '../src/leeway/formulaAdapter';
import { createExecutionReceipt } from '../src/leeway/receiptLedger';
import { ButtonConfig, SegmentedLayer } from '../src/types/studio';

function paintRect(
  buf: Uint8ClampedArray,
  w: number,
  x0: number,
  y0: number,
  rw: number,
  rh: number,
  rgba: [number, number, number, number]
) {
  for (let y = y0; y < y0 + rh; y++) {
    for (let x = x0; x < x0 + rw; x++) {
      const off = (y * w + x) * 4;
      buf[off] = rgba[0];
      buf[off + 1] = rgba[1];
      buf[off + 2] = rgba[2];
      buf[off + 3] = rgba[3];
    }
  }
}

function paintCircle(
  buf: Uint8ClampedArray,
  w: number,
  cx: number,
  cy: number,
  r: number,
  rgba: [number, number, number, number]
) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) {
        const off = (y * w + x) * 4;
        buf[off] = rgba[0];
        buf[off + 1] = rgba[1];
        buf[off + 2] = rgba[2];
        buf[off + 3] = rgba[3];
      }
    }
  }
}

test('segmentImageData computes wobble-free geometric center and extracts circuit trace waypoints', () => {
  const size = 128;
  const buf = new Uint8ClampedArray(size * size * 4);

  // Component 1: Teal rectangular screen with darker interior display cavity
  paintRect(buf, size, 12, 12, 48, 32, [45, 212, 191, 255]);
  paintRect(buf, size, 17, 17, 38, 22, [15, 23, 42, 255]);

  // Component 2: Amber circular rotor with off-center internal cutout (tests geometricCenter vs weighted centroid)
  paintCircle(buf, size, 88, 84, 20, [245, 158, 11, 255]);
  paintCircle(buf, size, 82, 84, 6, [0, 0, 0, 0]);

  // Component 3: Thin horizontal circuit trace
  paintRect(buf, size, 10, 96, 46, 4, [56, 189, 248, 255]);

  const clusters = segmentImageData(buf, size, size, {
    ...DEFAULT_SEGMENTATION_OPTIONS,
    minRegionArea: 100,
  });

  assert.ok(clusters.length >= 3);
  const roles = clusters.map((c) => classifyComponent(c, size).role);
  assert.ok(roles.includes('screen'), 'Expected framed screen block');
  assert.ok(roles.includes('circuit'), 'Expected thin trace to classify as circuit');

  const circuitCluster = clusters.find((c) => classifyComponent(c, size).role === 'circuit')!;
  assert.ok(circuitCluster.tracePoints.length >= 2, 'Expected extracted circuit trace waypoints');

  const rotorCluster = clusters.find((c) => c.bbox.x >= 60 && c.bbox.y >= 60)!;
  // Geometric center should stay aligned to true outer circle center (~88, 84) despite off-center cutout
  assert.ok(Math.abs(rotorCluster.geometricCenter.x - 88) <= 1.5);
  assert.ok(Math.abs(rotorCluster.geometricCenter.y - 84) <= 1.5);

  const pivot = computePivotForPreset(
    'geometric-center',
    rotorCluster.bbox,
    rotorCluster.centroid,
    rotorCluster.geometricCenter,
    size
  );
  assert.ok(pivot.x > 65 && pivot.x < 72);
});

test('segmentImageData detects interior high-contrast cavity inside framed device bezel', () => {
  const size = 128;
  const buf = new Uint8ClampedArray(size * size * 4);

  // Light metallic outer bezel (color-grouped) + dark interior display panel absorbed or high-contrast
  paintRect(buf, size, 24, 24, 64, 48, [148, 163, 184, 255]);
  paintRect(buf, size, 32, 32, 48, 32, [15, 23, 42, 255]);

  const clusters = segmentImageData(buf, size, size, {
    colorTolerance: 24,
    minRegionArea: 1800,
    backdropTolerance: 20,
    backdropMode: 'auto',
  });

  // With minRegionArea 1800, the 48x32=1536px inner dark panel is absorbed into the outer bezel,
  // and detectInteriorCavity preserves its interior bounds cleanly!
  assert.equal(clusters.length, 1);
  assert.ok(clusters[0].interiorCavity !== null, 'Expected interiorCavity to be detected inside bezel');
  const cavity = clusters[0].interiorCavity!;
  assert.ok(cavity.bbox.x >= 28 && cavity.bbox.y >= 28);
  assert.ok(cavity.bbox.w <= 56 && cavity.bbox.h <= 40);
});

test('segmentImageData separates solid opaque backdrop via flood-fill', () => {
  const size = 96;
  const buf = new Uint8ClampedArray(size * size * 4);
  paintRect(buf, size, 0, 0, size, size, [15, 23, 42, 255]);
  paintRect(buf, size, 38, 18, 18, 60, [220, 38, 38, 255]);

  const clusters = segmentImageData(buf, size, size, {
    colorTolerance: 24,
    minRegionArea: 100,
    backdropTolerance: 20,
    backdropMode: 'auto',
  });

  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].bbox.w, 18);
  assert.equal(clusters[0].bbox.h, 60);
  assert.equal(classifyComponent(clusters[0], size).role, 'gauge');
  assert.equal(classifyComponent(clusters[0], size).animationMode, 'gauge-fluid');
});

const SAMPLE_LAYERS: SegmentedLayer[] = [
  {
    id: 'layer-gear',
    name: 'Mechanical Gear 01',
    role: 'gear',
    animationMode: 'gear-ratchet',
    visible: true,
    locked: false,
    zIndex: 1,
    fullSpriteUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    croppedSpriteUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    maskUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    bbox: { x: 80, y: 80, w: 96, h: 96 },
    interiorSubRegion: null,
    tracePoints: [],
    pivotPreset: 'geometric-center',
    pivotPercent: { x: 50, y: 50 },
    speed: 1.0,
    rpm: 12,
    amplitude: 1.0,
    minAngle: -18,
    maxAngle: 18,
    phaseDelayMs: 120,
    easing: 'steps(12, end)',
    glowColor: '#F59E0B',
    choreography: createDefaultChoreography('gear', 'gear-ratchet'),
    metrics: {
      area: 1800,
      perimeter: 240,
      circularity: 0.4,
      fillRatio: 0.62,
      aspectRatio: 1.0,
      radialVariance: 0.18,
      dominantColor: '#F59E0B',
      centroid: { x: 128, y: 128 },
      geometricCenter: { x: 128, y: 128 },
    },
  },
  {
    id: 'layer-screen',
    name: 'Data Screen 01',
    role: 'screen',
    animationMode: 'screen-radar',
    visible: true,
    locked: false,
    zIndex: 2,
    fullSpriteUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    croppedSpriteUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    maskUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    bbox: { x: 20, y: 150, w: 64, h: 48 },
    interiorSubRegion: {
      bbox: { x: 26, y: 156, w: 52, h: 36 },
      maskUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      coverageRatio: 0.61,
    },
    tracePoints: [],
    pivotPreset: 'centroid',
    pivotPercent: { x: 20.3, y: 68 },
    speed: 1.1,
    rpm: 6,
    amplitude: 1.0,
    minAngle: -10,
    maxAngle: 10,
    phaseDelayMs: 200,
    easing: 'linear',
    glowColor: '#2DD4BF',
    choreography: createDefaultChoreography('screen', 'screen-radar'),
    metrics: {
      area: 2100,
      perimeter: 210,
      circularity: 0.6,
      fillRatio: 0.85,
      aspectRatio: 1.33,
      radialVariance: 0.12,
      dominantColor: '#2DD4BF',
      centroid: { x: 52, y: 174 },
      geometricCenter: { x: 52, y: 174 },
    },
  },
  {
    id: 'layer-circuit',
    name: 'Circuit Trace 01',
    role: 'circuit',
    animationMode: 'circuit-pulse',
    visible: true,
    locked: false,
    zIndex: 3,
    fullSpriteUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    croppedSpriteUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    maskUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    bbox: { x: 20, y: 20, w: 60, h: 12 },
    interiorSubRegion: null,
    tracePoints: [
      { x: 20, y: 26 },
      { x: 50, y: 26 },
      { x: 80, y: 26 },
    ],
    pivotPreset: 'centroid',
    pivotPercent: { x: 19, y: 10 },
    speed: 1.2,
    rpm: 6,
    amplitude: 1.0,
    minAngle: -15,
    maxAngle: 15,
    phaseDelayMs: 0,
    easing: 'ease-in-out',
    glowColor: '#38BDF8',
    choreography: createDefaultChoreography('circuit', 'circuit-pulse'),
    metrics: {
      area: 320,
      perimeter: 140,
      circularity: 0.2,
      fillRatio: 0.3,
      aspectRatio: 5.0,
      radialVariance: 0.4,
      dominantColor: '#38BDF8',
      centroid: { x: 50, y: 26 },
      geometricCenter: { x: 50, y: 26 },
    },
  },
];

const SAMPLE_CONFIG: ButtonConfig = {
  targetMode: 'button',
  label: 'Reactor Test',
  ariaLabel: 'Activate Reactor Test',
  shape: 'squircle',
  sizePx: 148,
  hoverSpeedMultiplier: 2.5,
  hoverGlowIntensity: 1.2,
  pressDepthPx: 3,
  showCaption: true,
  surfaceTint: '#111927',
  accentColor: '#38BDF8',
  reducedMotion: false,
  toggleable: false,
  logoReveal: 'fade-scale',
  logoLoading: false,
  faviconContrastBoost: 1.25,
  faviconSimplifyMinArea: 220,
};

test('exporters preserve interior sub-layers, pivots, choreography, and circuit tracers across HTML, Lottie, and SVG', () => {
  const html = generateHtmlButtonExport(SAMPLE_LAYERS, SAMPLE_CONFIG);
  assert.ok(html.includes('<button') && html.includes('class="kg-button"'));
  assert.ok(html.includes('kg-mode-gear-ratchet'));
  assert.ok(html.includes('kg-radar-sweep'));
  assert.ok(html.includes('kg-trace-dash'));
  assert.ok(html.includes('data-hover-speed='));
  assert.ok(html.includes('transform-origin:50% 50%'));

  const toggleHtml = generateHtmlButtonExport(SAMPLE_LAYERS, {
    ...SAMPLE_CONFIG,
    toggleable: true,
  });
  assert.ok(toggleHtml.includes('data-toggleable="true"'));
  assert.ok(toggleHtml.includes('aria-pressed="false"'));

  const lottieRaw = generateLottieJsonExport(SAMPLE_LAYERS, SAMPLE_CONFIG);
  const lottie = JSON.parse(lottieRaw) as {
    v: string;
    fr: number;
    w: number;
    h: number;
    assets: unknown[];
    layers: Array<{ ty: number; nm: string; st: number }>;
  };
  assert.equal(lottie.v, '5.9.0');
  assert.equal(lottie.fr, 60);
  assert.equal(lottie.w, CANVAS_SIZE);
  assert.equal(lottie.h, CANVAS_SIZE);
  assert.equal(lottie.assets.length, 3);
  // Includes 3 sprite layers + 1 synthesized circuit spark tracer shape layer (ty: 4)
  assert.equal(lottie.layers.length, 4);
  assert.ok(lottie.layers.some((l) => l.ty === 4 && l.nm.includes('Tracer Spark')));

  const svg = generateAnimatedSvgExport(SAMPLE_LAYERS, SAMPLE_CONFIG);
  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(svg.includes('<clipPath'));
  assert.ok(svg.includes('<animateTransform'));
  assert.ok(svg.includes('<animateMotion'));
  assert.ok(svg.includes('stroke-dashoffset'));
  assert.ok(svg.includes('<rect x="2" y="2"'), 'Button SVG includes outer plate');
});

test('Logo Mode exports bezel-free SVG and HTML mark with reveal and optional loading orbital ring', () => {
  const logoConfig: ButtonConfig = {
    ...SAMPLE_CONFIG,
    targetMode: 'logo',
    logoReveal: 'radial-unfold',
    logoLoading: true,
    showCaption: true,
  };

  const logoHtml = generateHtmlButtonExport(SAMPLE_LAYERS, logoConfig);
  assert.ok(logoHtml.includes('class="kg-logo-mark"'));
  assert.ok(logoHtml.includes('kgRevealUnfold'));
  assert.ok(logoHtml.includes('class="kg-logo-ring"'));
  assert.ok(!logoHtml.includes('<button type="button" class="kg-button"'));

  const logoSvg = generateAnimatedSvgExport(SAMPLE_LAYERS, logoConfig);
  assert.ok(!logoSvg.includes('<rect x="2" y="2"'), 'Logo SVG omits button bezel plate');
});

test('Favicon compiler simplifies tiny fragments, packs valid multi-res .ICO, emits WebManifest and browser support notes', () => {
  // With minArea = 500, circuit (320px) is pruned while gear + screen (2100px) remain
  const plan = selectSimplifiedFaviconLayers(SAMPLE_LAYERS, 500);
  assert.equal(plan.keptLayers.length, 2);
  assert.equal(plan.prunedLayers.length, 1);
  assert.equal(plan.prunedLayers[0].id, 'layer-circuit');

  // Fallback keeps largest layer when all visible layers are non-gear/non-chassis below minArea
  const tinyOnly = SAMPLE_LAYERS.filter((l) => l.role !== 'gear' && l.role !== 'chassis');
  const fallbackPlan = selectSimplifiedFaviconLayers(tinyOnly, 99999);
  assert.equal(fallbackPlan.keptLayers.length, 1);
  assert.equal(fallbackPlan.keptLayers[0].id, 'layer-screen');

  // Multi-resolution PNG-in-ICO packer
  const dummyPng =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const ico = buildMultiResolutionIcoBytes([
    { size: 16, pngDataUrl: dummyPng },
    { size: 32, pngDataUrl: dummyPng },
    { size: 48, pngDataUrl: dummyPng },
  ]);
  const icoView = new DataView(ico.buffer);
  assert.equal(icoView.getUint16(0, true), 0); // reserved
  assert.equal(icoView.getUint16(2, true), 1); // type = 1 (.ICO)
  assert.equal(icoView.getUint16(4, true), 3); // 3 frames
  assert.equal(ico[6], 16);
  assert.equal(ico[6 + 16], 32);
  assert.equal(ico[6 + 32], 48);
  assert.ok(ico.length > 6 + 48);

  const manifest = JSON.parse(generateWebManifestJson('KineticGlyph App')) as {
    name: string;
    icons: Array<{ sizes: string }>;
  };
  assert.equal(manifest.name, 'KineticGlyph App');
  assert.ok(manifest.icons.some((i) => i.sizes === '192x192'));
  assert.ok(manifest.icons.some((i) => i.sizes === '512x512'));

  const controllerHtml = generateFaviconControllerHtml(SAMPLE_LAYERS, {
    ...SAMPLE_CONFIG,
    targetMode: 'favicon',
  });
  assert.ok(controllerHtml.includes('rel="icon"'));
  assert.ok(controllerHtml.includes('prefers-reduced-motion'));
  assert.ok(controllerHtml.includes('Safari, iOS'));

  const kitBundle = generateFaviconKitExport(SAMPLE_LAYERS, {
    ...SAMPLE_CONFIG,
    targetMode: 'favicon',
  });
  assert.ok(kitBundle.includes('/site.webmanifest'));
  assert.ok(kitBundle.includes('/apple-touch-icon.png'));
  assert.ok(kitBundle.includes('/favicon.ico'));
});

test('Formula Fabric adapter fails closed when unconfigured and receipts generate valid digests', async () => {
  const status = await inspectFormulaFabricAuthority();
  assert.equal(status.authorityState, 'BLOCKED_NO_VERIFIED_FORMULA_CAPABILITY');
  assert.equal(status.endpointConfigured, false);

  const receipt = await createExecutionReceipt('SEGMENTATION_RUN', 'Test run', { count: 2 });
  assert.ok(receipt.id.startsWith('rcpt-'));
  assert.ok(receipt.sha256.length >= 16);
});
