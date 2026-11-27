/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.STUDIO.SEGMENTER
TAG: LEEWAY.ENGINE.PIXEL.SEGMENTATION

5WH:
WHAT = Deterministic Canvas 2D pixel analysis, connected-component labeling, true geometric center calculation, interior cavity sub-layer detection, circuit waypoint extraction, and component role classifier.
WHY = Decompose static raster or SVG icons into independent, wobble-free animated layers with masked interior screen/gauge sub-layers and circuit tracer paths without external AI dependencies.
WHO = Leeway Innovations — KineticGlyph Segmentation Engine
WHERE = src/engine/segmenter.ts
WHEN = 2026-11-27
HOW = Performs border backdrop flood-fill, Union-Find 8-connectivity color clustering, enclosed/high-contrast interior cavity extraction, octant extrema circle centering, trace skeleton sampling, and sprite generation.

LICENSE = Apache-2.0
*/

import {
  AnimationMode,
  BoundingBox,
  EasingCurve,
  InteriorSubRegion,
  LayerMetrics,
  LayerRole,
  PivotAnchorPreset,
  SegmentationOptions,
  SegmentedLayer,
  StateChoreography,
  TracePoint,
} from '../types/studio';

export const CANVAS_SIZE = 256;

export interface RawInteriorCavity {
  pixels: number[];
  bbox: BoundingBox;
  coverageRatio: number;
}

export interface RawComponentCluster {
  id: number;
  pixels: number[];
  absorbedPixels: number[];
  bbox: BoundingBox;
  centroid: { x: number; y: number };
  geometricCenter: { x: number; y: number };
  area: number;
  perimeter: number;
  circularity: number;
  fillRatio: number;
  aspectRatio: number;
  radialVariance: number;
  avgRgb: [number, number, number];
  dominantColor: string;
  interiorCavity: RawInteriorCavity | null;
  tracePoints: TracePoint[];
}

export const DEFAULT_SEGMENTATION_OPTIONS: SegmentationOptions = {
  colorTolerance: 36,
  minRegionArea: 140,
  backdropTolerance: 28,
  backdropMode: 'auto',
};

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function colorDistance(
  data: Uint8ClampedArray,
  idxA: number,
  idxB: number
): number {
  const dr = data[idxA] - data[idxB];
  const dg = data[idxA + 1] - data[idxB + 1];
  const db = data[idxA + 2] - data[idxB + 2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function colorDistToRgb(
  data: Uint8ClampedArray,
  idx: number,
  rgb: [number, number, number]
): number {
  const dr = data[idx] - rgb[0];
  const dg = data[idx + 1] - rgb[1];
  const db = data[idx + 2] - rgb[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function detectBorderColor(
  data: Uint8ClampedArray,
  width: number,
  height: number
): { hasTransparency: boolean; medianBg: [number, number, number] } {
  let transparentCount = 0;
  const samples: Array<[number, number, number]> = [];
  const totalPixels = width * height;

  for (let i = 0; i < totalPixels; i++) {
    if (data[i * 4 + 3] < 24) {
      transparentCount++;
    }
  }

  if (transparentCount > totalPixels * 0.08) {
    return { hasTransparency: true, medianBg: [0, 0, 0] };
  }

  for (let x = 0; x < width; x++) {
    const top = x * 4;
    const bot = ((height - 1) * width + x) * 4;
    samples.push([data[top], data[top + 1], data[top + 2]]);
    samples.push([data[bot], data[bot + 1], data[bot + 2]]);
  }
  for (let y = 1; y < height - 1; y++) {
    const left = (y * width) * 4;
    const right = (y * width + (width - 1)) * 4;
    samples.push([data[left], data[left + 1], data[left + 2]]);
    samples.push([data[right], data[right + 1], data[right + 2]]);
  }

  const rs = samples.map((s) => s[0]).sort((a, b) => a - b);
  const gs = samples.map((s) => s[1]).sort((a, b) => a - b);
  const bs = samples.map((s) => s[2]).sort((a, b) => a - b);
  const mid = Math.floor(samples.length / 2);

  return {
    hasTransparency: false,
    medianBg: [rs[mid], gs[mid], bs[mid]],
  };
}

export function buildForegroundMask(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: SegmentationOptions
): Uint8Array {
  const total = width * height;
  const fg = new Uint8Array(total);
  const { hasTransparency, medianBg } = detectBorderColor(data, width, height);

  if (options.backdropMode === 'alpha-only' || (options.backdropMode === 'auto' && hasTransparency)) {
    for (let i = 0; i < total; i++) {
      fg[i] = data[i * 4 + 3] >= 24 ? 1 : 0;
    }
    return fg;
  }

  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const tryEnqueue = (p: number) => {
    if (visited[p]) return;
    const off = p * 4;
    if (data[off + 3] < 24 || colorDistToRgb(data, off, medianBg) <= options.backdropTolerance) {
      visited[p] = 1;
      queue[tail++] = p;
    }
  };

  for (let x = 0; x < width; x++) {
    tryEnqueue(x);
    tryEnqueue((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y++) {
    tryEnqueue(y * width);
    tryEnqueue(y * width + (width - 1));
  }

  while (head < tail) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);
    const neighbors = [
      cx > 0 ? curr - 1 : -1,
      cx < width - 1 ? curr + 1 : -1,
      cy > 0 ? curr - width : -1,
      cy < height - 1 ? curr + width : -1,
    ];
    for (const n of neighbors) {
      if (n >= 0 && !visited[n]) {
        const off = n * 4;
        if (data[off + 3] < 24 || colorDistToRgb(data, off, medianBg) <= options.backdropTolerance) {
          visited[n] = 1;
          queue[tail++] = n;
        }
      }
    }
  }

  for (let i = 0; i < total; i++) {
    fg[i] = visited[i] === 0 && data[i * 4 + 3] >= 24 ? 1 : 0;
  }

  return fg;
}

/**
 * Computes exact outer-extrema geometric center (eliminating spin wobble from asymmetric interior cutouts).
 */
function computeGeometricCenter(
  edgePoints: Array<{ x: number; y: number }>,
  bbox: BoundingBox
): { x: number; y: number } {
  if (edgePoints.length === 0) {
    return { x: bbox.x + bbox.w / 2, y: bbox.y + bbox.h / 2 };
  }

  let minDiag1 = Infinity;
  let maxDiag1 = -Infinity;
  let minDiag2 = Infinity;
  let maxDiag2 = -Infinity;

  for (const pt of edgePoints) {
    const d1 = pt.x + pt.y;
    const d2 = pt.x - pt.y;
    if (d1 < minDiag1) minDiag1 = d1;
    if (d1 > maxDiag1) maxDiag1 = d1;
    if (d2 < minDiag2) minDiag2 = d2;
    if (d2 > maxDiag2) maxDiag2 = d2;
  }

  // Average axis-aligned midpoint and 45-degree diagonal midpoint for sub-pixel circle symmetry
  const axisCx = bbox.x + (bbox.w - 1) / 2;
  const axisCy = bbox.y + (bbox.h - 1) / 2;
  const midD1 = (minDiag1 + maxDiag1) / 2;
  const midD2 = (minDiag2 + maxDiag2) / 2;
  const diagCx = (midD1 + midD2) / 2;
  const diagCy = (midD1 - midD2) / 2;

  return {
    x: Number(((axisCx + diagCx) / 2).toFixed(2)),
    y: Number(((axisCy + diagCy) / 2).toFixed(2)),
  };
}

/**
 * Detects interior dark, high-contrast, or enclosed cavity regions inside a device frame or gauge
 * so screen telemetry or fluid fill renders cleanly inside the bezel without moving the chassis.
 */
export function detectInteriorCavity(
  data: Uint8ClampedArray,
  pixels: number[],
  absorbedPixels: number[],
  bbox: BoundingBox,
  width: number,
  height: number
): RawInteriorCavity | null {
  if (bbox.w < 14 || bbox.h < 14) return null;

  const pixelSet = new Set(pixels);
  const absorbedSet = new Set(absorbedPixels);

  // Measure average outer bezel/rim luminance from pixels near the bbox perimeter
  let rimLumSum = 0;
  let rimCount = 0;
  for (const p of pixels) {
    if (absorbedSet.has(p)) continue;
    const x = p % width;
    const y = Math.floor(p / width);
    const nearEdge =
      x <= bbox.x + 2 ||
      x >= bbox.x + bbox.w - 3 ||
      y <= bbox.y + 2 ||
      y >= bbox.y + bbox.h - 3;
    if (nearEdge) {
      const off = p * 4;
      rimLumSum += luminance(data[off], data[off + 1], data[off + 2]);
      rimCount++;
    }
  }
  const rimLum = rimCount > 0 ? rimLumSum / rimCount : 128;

  // Scan interior bounding box with 2px inset margin for enclosed/contrasting screen cavity
  const inset = Math.max(2, Math.min(4, Math.floor(Math.min(bbox.w, bbox.h) * 0.12)));
  const cavityPixels: number[] = [];

  // Track horizontal & vertical span coverage of parent pixels to confirm enclosure
  const rowBounds = new Map<number, { minX: number; maxX: number }>();
  for (const p of pixels) {
    const x = p % width;
    const y = Math.floor(p / width);
    const b = rowBounds.get(y);
    if (!b) {
      rowBounds.set(y, { minX: x, maxX: x });
    } else {
      if (x < b.minX) b.minX = x;
      if (x > b.maxX) b.maxX = x;
    }
  }

  for (let y = bbox.y + inset; y <= bbox.y + bbox.h - 1 - inset; y++) {
    const span = rowBounds.get(y);
    if (!span) continue;
    for (let x = bbox.x + inset; x <= bbox.x + bbox.w - 1 - inset; x++) {
      if (x <= span.minX || x >= span.maxX) continue;
      const p = y * width + x;
      const off = p * 4;
      const alpha = data[off + 3];

      // 1) Enclosed transparent cutout inside a hollow bezel
      if (alpha < 24) {
        cavityPixels.push(p);
        continue;
      }

      // 2) Absorbed inner glyph/content pixels (waveforms, readouts, mercury stems)
      if (absorbedSet.has(p)) {
        cavityPixels.push(p);
        continue;
      }

      // 3) High-contrast or noticeably darker interior display surface relative to bezel rim
      if (pixelSet.has(p)) {
        const lum = luminance(data[off], data[off + 1], data[off + 2]);
        if (lum < rimLum - 16 || Math.abs(lum - rimLum) > 28) {
          cavityPixels.push(p);
        }
      }
    }
  }

  // Fallback for solid uniform screens: synthesize inset display aperture when shape is rectangular/tall
  if (cavityPixels.length < 24 && bbox.w >= 18 && bbox.h >= 18) {
    const padX = Math.max(3, Math.round(bbox.w * 0.14));
    const padY = Math.max(3, Math.round(bbox.h * 0.14));
    for (let y = bbox.y + padY; y <= bbox.y + bbox.h - 1 - padY; y++) {
      for (let x = bbox.x + padX; x <= bbox.x + bbox.w - 1 - padX; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const p = y * width + x;
          if (pixelSet.has(p)) {
            cavityPixels.push(p);
          }
        }
      }
    }
  }

  if (cavityPixels.length < 16) return null;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (const p of cavityPixels) {
    const x = p % width;
    const y = Math.floor(p / width);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return {
    pixels: cavityPixels,
    bbox: {
      x: minX,
      y: minY,
      w: Math.max(1, maxX - minX + 1),
      h: Math.max(1, maxY - minY + 1),
    },
    coverageRatio: Number((cavityPixels.length / Math.max(1, pixels.length)).toFixed(3)),
  };
}

/**
 * Extracts ordered trace waypoints along a cluster's centerline for traveling circuit particles & dash tracers.
 */
export function extractCircuitTracePoints(
  pixels: number[],
  bbox: BoundingBox,
  width: number
): TracePoint[] {
  if (pixels.length === 0) return [];
  if (pixels.length < 16) {
    return [
      { x: bbox.x, y: bbox.y + bbox.h / 2 },
      { x: bbox.x + bbox.w, y: bbox.y + bbox.h / 2 },
    ];
  }

  const horizontalDominant = bbox.w >= bbox.h;
  const buckets = new Map<number, number[]>();

  for (const p of pixels) {
    const x = p % width;
    const y = Math.floor(p / width);
    const key = horizontalDominant ? x : y;
    const val = horizontalDominant ? y : x;
    let list = buckets.get(key);
    if (!list) {
      list = [];
      buckets.set(key, list);
    }
    list.push(val);
  }

  const keys = Array.from(buckets.keys()).sort((a, b) => a - b);
  const maxSamples = 12;
  const step = Math.max(1, Math.floor(keys.length / maxSamples));
  const points: TracePoint[] = [];

  for (let i = 0; i < keys.length; i += step) {
    const k = keys[i];
    const vals = buckets.get(k)!;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    points.push(
      horizontalDominant
        ? { x: k, y: Number(avg.toFixed(1)) }
        : { x: Number(avg.toFixed(1)), y: k }
    );
  }

  // Ensure end point is included
  const lastKey = keys[keys.length - 1];
  const lastVals = buckets.get(lastKey)!;
  const lastAvg = lastVals.reduce((a, b) => a + b, 0) / lastVals.length;
  const endPt = horizontalDominant
    ? { x: lastKey, y: Number(lastAvg.toFixed(1)) }
    : { x: Number(lastAvg.toFixed(1)), y: lastKey };

  const prev = points[points.length - 1];
  if (!prev || prev.x !== endPt.x || prev.y !== endPt.y) {
    points.push(endPt);
  }

  return points;
}

/**
 * Pure pixel-level Connected Component Labeling & geometric feature extractor.
 * Works in both browser Canvas and headless Node.js test environments.
 */
export function segmentImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: SegmentationOptions = DEFAULT_SEGMENTATION_OPTIONS
): RawComponentCluster[] {
  const total = width * height;
  const fg = buildForegroundMask(data, width, height, options);

  const parent = new Int32Array(total);
  const size = new Int32Array(total);
  for (let i = 0; i < total; i++) {
    parent[i] = fg[i] ? i : -1;
    size[i] = fg[i] ? 1 : 0;
  }

  const find = (x: number): number => {
    let root = x;
    while (parent[root] !== root) {
      root = parent[root];
    }
    let curr = x;
    while (curr !== root) {
      const next = parent[curr];
      parent[curr] = root;
      curr = next;
    }
    return root;
  };

  const union = (a: number, b: number) => {
    let ra = find(a);
    let rb = find(b);
    if (ra === rb) return;
    if (size[ra] < size[rb]) {
      const tmp = ra;
      ra = rb;
      rb = tmp;
    }
    parent[rb] = ra;
    size[ra] += size[rb];
  };

  const tol = options.colorTolerance;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (!fg[p]) continue;
      const pOff = p * 4;

      const neighbors = [
        x > 0 ? p - 1 : -1,
        y > 0 ? p - width : -1,
        x > 0 && y > 0 ? p - width - 1 : -1,
        x < width - 1 && y > 0 ? p - width + 1 : -1,
      ];

      for (const n of neighbors) {
        if (n >= 0 && fg[n]) {
          if (colorDistance(data, pOff, n * 4) <= tol) {
            union(p, n);
          }
        }
      }
    }
  }

  const map = new Map<number, number[]>();
  for (let i = 0; i < total; i++) {
    if (!fg[i]) continue;
    const r = find(i);
    let list = map.get(r);
    if (!list) {
      list = [];
      map.set(r, list);
    }
    list.push(i);
  }

  const labelGrid = new Int32Array(total).fill(-1);
  const majorGroups: number[][] = [];
  const absorbedByGroup: number[][] = [];
  const minorGroups: number[][] = [];

  for (const pixels of map.values()) {
    if (pixels.length >= options.minRegionArea) {
      const id = majorGroups.length;
      majorGroups.push(pixels);
      absorbedByGroup.push([]);
      for (const p of pixels) {
        labelGrid[p] = id;
      }
    } else if (pixels.length >= 12) {
      minorGroups.push(pixels);
    }
  }

  for (const small of minorGroups) {
    const neighborVotes = new Map<number, number>();
    for (const p of small) {
      const px = p % width;
      const py = Math.floor(p / width);
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = px + dx;
          const ny = py + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const nid = labelGrid[ny * width + nx];
          if (nid >= 0) {
            neighborVotes.set(nid, (neighborVotes.get(nid) ?? 0) + 1);
          }
        }
      }
    }

    let bestId = -1;
    let bestCount = 0;
    for (const [id, count] of neighborVotes.entries()) {
      if (count > bestCount) {
        bestCount = count;
        bestId = id;
      }
    }

    if (bestId >= 0) {
      for (const p of small) {
        majorGroups[bestId].push(p);
        absorbedByGroup[bestId].push(p);
        labelGrid[p] = bestId;
      }
    } else if (small.length >= Math.max(40, options.minRegionArea * 0.45)) {
      const id = majorGroups.length;
      majorGroups.push(small);
      absorbedByGroup.push([]);
      for (const p of small) {
        labelGrid[p] = id;
      }
    }
  }

  const clusters: RawComponentCluster[] = [];
  majorGroups.forEach((pixels, idx) => {
    if (pixels.length === 0) return;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let sumX = 0;
    let sumY = 0;
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;

    const pixelSet = new Set(pixels);
    const edgePoints: Array<{ x: number; y: number }> = [];
    let perimeter = 0;

    for (const p of pixels) {
      const x = p % width;
      const y = Math.floor(p / width);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      sumX += x;
      sumY += y;

      const off = p * 4;
      sumR += data[off];
      sumG += data[off + 1];
      sumB += data[off + 2];

      const onEdge =
        x === 0 ||
        x === width - 1 ||
        y === 0 ||
        y === height - 1 ||
        !pixelSet.has(p - 1) ||
        !pixelSet.has(p + 1) ||
        !pixelSet.has(p - width) ||
        !pixelSet.has(p + width);
      if (onEdge) {
        perimeter++;
        edgePoints.push({ x, y });
      }
    }

    const area = pixels.length;
    const cx = sumX / area;
    const cy = sumY / area;
    const bw = Math.max(1, maxX - minX + 1);
    const bh = Math.max(1, maxY - minY + 1);
    const bbox: BoundingBox = { x: minX, y: minY, w: bw, h: bh };
    const fillRatio = area / (bw * bh);
    const aspectRatio = Math.max(bw, bh) / Math.min(bw, bh);
    const circularity = perimeter > 0 ? (4 * Math.PI * area) / (perimeter * perimeter) : 0;

    const geometricCenter = computeGeometricCenter(edgePoints, bbox);

    const distances = edgePoints.map((pt) =>
      Math.hypot(pt.x - geometricCenter.x, pt.y - geometricCenter.y)
    );
    const meanDist =
      distances.length > 0 ? distances.reduce((a, b) => a + b, 0) / distances.length : 1;
    const radialVariance =
      distances.length > 0
        ? Math.sqrt(
            distances.reduce((acc, d) => acc + (d - meanDist) ** 2, 0) / distances.length
          ) / Math.max(1, meanDist)
        : 0;

    const avgR = sumR / area;
    const avgG = sumG / area;
    const avgB = sumB / area;

    const absorbed = absorbedByGroup[idx] ?? [];
    const interiorCavity = detectInteriorCavity(data, pixels, absorbed, bbox, width, height);
    const tracePoints = extractCircuitTracePoints(pixels, bbox, width);

    clusters.push({
      id: idx,
      pixels,
      absorbedPixels: absorbed,
      bbox,
      centroid: { x: Number(cx.toFixed(2)), y: Number(cy.toFixed(2)) },
      geometricCenter,
      area,
      perimeter,
      circularity,
      fillRatio,
      aspectRatio,
      radialVariance,
      avgRgb: [avgR, avgG, avgB],
      dominantColor: rgbToHex(avgR, avgG, avgB),
      interiorCavity,
      tracePoints,
    });
  });

  clusters.sort((a, b) => b.area - a.area);
  return clusters.slice(0, 16);
}

/**
 * Classifies a segmented cluster into its functional UI animation role & default preset.
 */
export function classifyComponent(
  cluster: RawComponentCluster,
  canvasSize: number = CANVAS_SIZE
): { role: LayerRole; animationMode: AnimationMode; namePrefix: string } {
  const { circularity, fillRatio, aspectRatio, radialVariance, bbox, area, avgRgb } = cluster;
  const [r, g, b] = avgRgb;
  const areaFraction = area / (canvasSize * canvasSize);
  const nearSquare = aspectRatio <= 1.35;

  if (areaFraction > 0.32) {
    return { role: 'chassis', animationMode: 'ambient-breathe', namePrefix: 'Chassis Frame' };
  }

  const maxTraceThickness = Math.max(10, Math.round(canvasSize * 0.05));
  if (
    fillRatio < 0.38 ||
    (aspectRatio > 2.8 && fillRatio < 0.55) ||
    (aspectRatio >= 3.2 && Math.min(bbox.w, bbox.h) <= maxTraceThickness)
  ) {
    return { role: 'circuit', animationMode: 'circuit-pulse', namePrefix: 'Circuit Trace' };
  }

  if (
    nearSquare &&
    ((radialVariance >= 0.14 && circularity < 0.72) ||
      (circularity >= 0.45 && fillRatio >= 0.45 && fillRatio <= 0.78 && r > 140 && b < 140))
  ) {
    return { role: 'gear', animationMode: 'rotate-cw', namePrefix: 'Mechanical Gear' };
  }

  // Tall vertical thermometer / level bar -> rising/falling fluid fill
  if (bbox.h > bbox.w * 1.45 && fillRatio >= 0.55) {
    return { role: 'gauge', animationMode: 'gauge-fluid', namePrefix: 'Fluid Gauge' };
  }

  // Circular dial gauge -> oscillating needle sweep
  if (nearSquare && circularity >= 0.72 && (r > b + 20 || (b > 130 && r < 100 && area < 2200))) {
    return { role: 'gauge', animationMode: 'gauge-needle', namePrefix: 'Dial Gauge' };
  }

  // Wide or rectangular high-fill display panels -> screen telemetry
  if (fillRatio >= 0.65 && (bbox.w >= bbox.h * 1.1 || (g > 90 && b > 90 && r < 90))) {
    const mode: AnimationMode =
      cluster.interiorCavity && nearSquare ? 'screen-radar' : 'screen-oscilloscope';
    return { role: 'screen', animationMode: mode, namePrefix: 'Data Screen' };
  }

  if (nearSquare && circularity >= 0.48 && radialVariance >= 0.1) {
    return { role: 'gear', animationMode: 'fan-spin', namePrefix: 'Rotor Assembly' };
  }

  return { role: 'gauge', animationMode: 'gauge-needle', namePrefix: 'Sensor Module' };
}

export function defaultModeForRole(role: LayerRole): AnimationMode {
  switch (role) {
    case 'gear':
      return 'rotate-cw';
    case 'screen':
      return 'screen-oscilloscope';
    case 'gauge':
      return 'gauge-needle';
    case 'circuit':
      return 'circuit-pulse';
    case 'chassis':
      return 'ambient-breathe';
  }
}

export function defaultEasingForMode(mode: AnimationMode): EasingCurve {
  switch (mode) {
    case 'gear-ratchet':
      return 'steps(12, end)';
    case 'gauge-needle':
    case 'gauge-fluid':
    case 'ambient-breathe':
      return 'ease-in-out';
    default:
      return 'linear';
  }
}

export function computePivotForPreset(
  preset: PivotAnchorPreset,
  bbox: BoundingBox,
  centroid: { x: number; y: number },
  geometricCenter: { x: number; y: number },
  canvasSize: number = CANVAS_SIZE
): { x: number; y: number } {
  let px = geometricCenter.x;
  let py = geometricCenter.y;

  switch (preset) {
    case 'centroid':
      px = centroid.x;
      py = centroid.y;
      break;
    case 'bottom-center':
      px = bbox.x + bbox.w / 2;
      py = bbox.y + bbox.h * 0.85;
      break;
    case 'top-center':
      px = bbox.x + bbox.w / 2;
      py = bbox.y + bbox.h * 0.15;
      break;
    case 'left-center':
      px = bbox.x + bbox.w * 0.15;
      py = bbox.y + bbox.h / 2;
      break;
    case 'right-center':
      px = bbox.x + bbox.w * 0.85;
      py = bbox.y + bbox.h / 2;
      break;
    case 'geometric-center':
    case 'custom':
    default:
      px = geometricCenter.x;
      py = geometricCenter.y;
      break;
  }

  return {
    x: Number(((px / canvasSize) * 100).toFixed(2)),
    y: Number(((py / canvasSize) * 100).toFixed(2)),
  };
}

export function createDefaultChoreography(
  role: LayerRole,
  mode: AnimationMode
): StateChoreography {
  return {
    idle: {
      enabled: mode !== 'static',
      speedMultiplier: 1.0,
      glowIntensity: role === 'circuit' ? 0.55 : 0.25,
      particleRate: role === 'circuit' ? 1.0 : 0.5,
    },
    hover: {
      speedMultiplier: role === 'gear' ? 2.6 : role === 'circuit' ? 2.4 : 1.8,
      glowIntensity: role === 'circuit' ? 1.6 : 1.15,
      ratchetBoost: mode === 'gear-ratchet',
      fanBlur: mode === 'fan-spin',
      energySurge: role === 'circuit' || role === 'screen',
    },
    active: {
      pressScale: 0.96,
      glowBurst: 1.85,
      dischargePulse: true,
      reverseOnClick: false,
    },
  };
}

export function computeMetricsFromCluster(c: RawComponentCluster): LayerMetrics {
  return {
    area: c.area,
    perimeter: c.perimeter,
    circularity: Number(c.circularity.toFixed(3)),
    fillRatio: Number(c.fillRatio.toFixed(3)),
    aspectRatio: Number(c.aspectRatio.toFixed(2)),
    radialVariance: Number(c.radialVariance.toFixed(3)),
    dominantColor: c.dominantColor,
    centroid: c.centroid,
    geometricCenter: c.geometricCenter,
  };
}

function renderInteriorMaskUrl(cavity: RawInteriorCavity | null, size: number): InteriorSubRegion | null {
  if (!cavity) return null;
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = size;
  maskCanvas.height = size;
  const ctx = maskCanvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);

  for (const p of cavity.pixels) {
    const off = p * 4;
    img.data[off] = 255;
    img.data[off + 1] = 255;
    img.data[off + 2] = 255;
    img.data[off + 3] = 255;
  }

  ctx.putImageData(img, 0, 0);
  return {
    bbox: cavity.bbox,
    maskUrl: maskCanvas.toDataURL('image/png'),
    coverageRatio: cavity.coverageRatio,
  };
}

function renderClusterSprites(
  sourceData: Uint8ClampedArray,
  cluster: RawComponentCluster,
  size: number
): { fullSpriteUrl: string; croppedSpriteUrl: string; maskUrl: string } {
  const fullCanvas = document.createElement('canvas');
  fullCanvas.width = size;
  fullCanvas.height = size;
  const fullCtx = fullCanvas.getContext('2d')!;
  const fullImg = fullCtx.createImageData(size, size);

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = size;
  maskCanvas.height = size;
  const maskCtx = maskCanvas.getContext('2d')!;
  const maskImg = maskCtx.createImageData(size, size);

  for (const p of cluster.pixels) {
    const off = p * 4;
    fullImg.data[off] = sourceData[off];
    fullImg.data[off + 1] = sourceData[off + 1];
    fullImg.data[off + 2] = sourceData[off + 2];
    fullImg.data[off + 3] = sourceData[off + 3];

    maskImg.data[off] = 255;
    maskImg.data[off + 1] = 255;
    maskImg.data[off + 2] = 255;
    maskImg.data[off + 3] = sourceData[off + 3];
  }

  fullCtx.putImageData(fullImg, 0, 0);
  maskCtx.putImageData(maskImg, 0, 0);

  const { x, y, w, h } = cluster.bbox;
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = w;
  cropCanvas.height = h;
  const cropCtx = cropCanvas.getContext('2d')!;
  cropCtx.drawImage(fullCanvas, x, y, w, h, 0, 0, w, h);

  return {
    fullSpriteUrl: fullCanvas.toDataURL('image/png'),
    croppedSpriteUrl: cropCanvas.toDataURL('image/png'),
    maskUrl: maskCanvas.toDataURL('image/png'),
  };
}

export async function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode uploaded image asset.'));
    img.src = src;
  });
}

export async function segmentImageFromUrl(
  src: string,
  options: SegmentationOptions = DEFAULT_SEGMENTATION_OPTIONS
): Promise<{
  normalizedUrl: string;
  layers: SegmentedLayer[];
  processingMs: number;
}> {
  const t0 = performance.now();
  const img = await loadImageElement(src);

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const pad = 8;
  const avail = CANVAS_SIZE - pad * 2;
  const scale = Math.min(
    avail / Math.max(1, img.naturalWidth || 256),
    avail / Math.max(1, img.naturalHeight || 256)
  );
  const drawW = Math.round((img.naturalWidth || 256) * scale);
  const drawH = Math.round((img.naturalHeight || 256) * scale);
  const drawX = Math.round((CANVAS_SIZE - drawW) / 2);
  const drawY = Math.round((CANVAS_SIZE - drawH) / 2);

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const normalizedUrl = canvas.toDataURL('image/png');

  const clusters = segmentImageData(imageData.data, CANVAS_SIZE, CANVAS_SIZE, options);
  const roleCounters: Record<LayerRole, number> = {
    gear: 0,
    screen: 0,
    gauge: 0,
    circuit: 0,
    chassis: 0,
  };

  const layers: SegmentedLayer[] = clusters.map((cluster, index) => {
    const { role, animationMode, namePrefix } = classifyComponent(cluster, CANVAS_SIZE);
    roleCounters[role]++;
    const { fullSpriteUrl, croppedSpriteUrl, maskUrl } = renderClusterSprites(
      imageData.data,
      cluster,
      CANVAS_SIZE
    );

    let effectiveMode: AnimationMode =
      role === 'gear' && roleCounters[role] % 2 === 0 ? 'rotate-ccw' : animationMode;
    if (role === 'screen' && roleCounters[role] % 2 === 0) {
      effectiveMode = 'screen-code';
    }

    const pivotPreset: PivotAnchorPreset =
      role === 'gear' ? 'geometric-center' : 'centroid';
    const pivotPercent = computePivotForPreset(
      pivotPreset,
      cluster.bbox,
      cluster.centroid,
      cluster.geometricCenter,
      CANVAS_SIZE
    );

    const interiorSubRegion =
      role === 'screen' || role === 'gauge'
        ? renderInteriorMaskUrl(cluster.interiorCavity, CANVAS_SIZE)
        : null;

    const rpm = role === 'gear' ? (effectiveMode === 'fan-spin' ? 28 : 8) : 6;
    const speed = role === 'gear' ? Number((rpm / 8).toFixed(2)) : role === 'circuit' ? 1.25 : 1.0;

    return {
      id: `layer-${index + 1}-${cluster.id}`,
      name: `${namePrefix} ${String(roleCounters[role]).padStart(2, '0')}`,
      role,
      animationMode: effectiveMode,
      visible: true,
      locked: false,
      zIndex: index + 1,
      fullSpriteUrl,
      croppedSpriteUrl,
      maskUrl,
      bbox: cluster.bbox,
      interiorSubRegion,
      tracePoints: cluster.tracePoints,
      pivotPreset,
      pivotPercent,
      speed,
      rpm,
      amplitude: role === 'gauge' ? 18 : 1.0,
      minAngle: -18,
      maxAngle: 18,
      phaseDelayMs: (index % 4) * 140,
      easing: defaultEasingForMode(effectiveMode),
      glowColor: cluster.dominantColor,
      choreography: createDefaultChoreography(role, effectiveMode),
      metrics: computeMetricsFromCluster(cluster),
    };
  });

  const processingMs = Math.round(performance.now() - t0);
  return { normalizedUrl, layers, processingMs };
}

/**
 * Browser helper to composite two layers into a single unified sprite layer.
 */
export async function mergeTwoLayers(
  layers: SegmentedLayer[],
  primaryId: string,
  secondaryId: string
): Promise<SegmentedLayer[]> {
  const a = layers.find((l) => l.id === primaryId);
  const b = layers.find((l) => l.id === secondaryId);
  if (!a || !b || a.id === b.id) return layers;

  const [imgA, imgB] = await Promise.all([
    loadImageElement(a.fullSpriteUrl),
    loadImageElement(b.fullSpriteUrl),
  ]);

  const fullCanvas = document.createElement('canvas');
  fullCanvas.width = CANVAS_SIZE;
  fullCanvas.height = CANVAS_SIZE;
  const ctx = fullCanvas.getContext('2d')!;
  ctx.drawImage(imgA, 0, 0);
  ctx.drawImage(imgB, 0, 0);

  const mergedData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = CANVAS_SIZE;
  maskCanvas.height = CANVAS_SIZE;
  const maskCtx = maskCanvas.getContext('2d')!;
  const maskImg = maskCtx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
  for (let i = 0; i < CANVAS_SIZE * CANVAS_SIZE; i++) {
    const off = i * 4;
    if (mergedData[off + 3] > 0) {
      maskImg.data[off] = 255;
      maskImg.data[off + 1] = 255;
      maskImg.data[off + 2] = 255;
      maskImg.data[off + 3] = mergedData[off + 3];
    }
  }
  maskCtx.putImageData(maskImg, 0, 0);

  const minX = Math.min(a.bbox.x, b.bbox.x);
  const minY = Math.min(a.bbox.y, b.bbox.y);
  const maxX = Math.max(a.bbox.x + a.bbox.w, b.bbox.x + b.bbox.w);
  const maxY = Math.max(a.bbox.y + a.bbox.h, b.bbox.y + b.bbox.h);
  const bbox: BoundingBox = {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY,
  };

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = bbox.w;
  cropCanvas.height = bbox.h;
  cropCanvas.getContext('2d')!.drawImage(fullCanvas, bbox.x, bbox.y, bbox.w, bbox.h, 0, 0, bbox.w, bbox.h);

  const center = {
    x: Number((((bbox.x + bbox.w / 2) / CANVAS_SIZE) * 100).toFixed(2)),
    y: Number((((bbox.y + bbox.h / 2) / CANVAS_SIZE) * 100).toFixed(2)),
  };

  const merged: SegmentedLayer = {
    ...a,
    name: `${a.name} + Merged`,
    fullSpriteUrl: fullCanvas.toDataURL('image/png'),
    croppedSpriteUrl: cropCanvas.toDataURL('image/png'),
    maskUrl: maskCanvas.toDataURL('image/png'),
    bbox,
    tracePoints: [...a.tracePoints, ...b.tracePoints],
    pivotPercent: center,
    metrics: {
      ...a.metrics,
      area: a.metrics.area + b.metrics.area,
      centroid: { x: bbox.x + bbox.w / 2, y: bbox.y + bbox.h / 2 },
      geometricCenter: { x: bbox.x + bbox.w / 2, y: bbox.y + bbox.h / 2 },
    },
  };

  return layers
    .filter((l) => l.id !== secondaryId)
    .map((l) => (l.id === primaryId ? merged : l));
}
