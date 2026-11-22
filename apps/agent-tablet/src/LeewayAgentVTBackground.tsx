import { tabletAssetUrl } from './assetUrl';
import {
  Palette,
  Check,
  Copy,
  Download,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  Settings,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  ChangeEvent,
  KeyboardEvent,
  PointerEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

// ============================================================================
// Types & Presets
// ============================================================================

export type BuiltInSceneId =
  | 'galactic-mesh'
  | 'connected-alloy-mesh'
  | 'harmonic-wave-field'
  | 'liquid-alloy-lattice'
  | 'obsidian-silk-folds'
  | 'medallion-wave-horizon'
  | 'sculpted-metal-ripples';

export type SceneId = BuiltInSceneId | `custom:${string}`;

export interface SceneMeta {
  id: BuiltInSceneId;
  name: string;
  subtitle: string;
}

export interface CustomBackground {
  id: string;
  name: string;
  kind: 'media' | 'preset';
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  baseSceneId?: BuiltInSceneId;
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  bgBaseColor?: string;
  multiColorCycle?: boolean;
  speed?: number;
  objectCount?: number;
  objectSize?: number;
  glowIntensity?: number;
}

export interface ColorPreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  tertiary: string;
  bgBase: string;
}

export interface BackgroundSettings {
  sceneId: SceneId;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  bgBaseColor: string;
  multiColorCycle: boolean;
  speed: number;
  paused: boolean;
  objectCount: number;
  objectSize: number;
  glowIntensity: number;
  scrimOpacity: number;
  autoCycleScenes: boolean;
}

export const SCENES: SceneMeta[] = [
  {
    id: 'galactic-mesh',
    name: 'Galactic Mesh (Tablet Original)',
    subtitle: 'Classic particle shards & floating cosmic orbs',
  },
  {
    id: 'connected-alloy-mesh',
    name: 'Connected Alloy Mesh',
    subtitle: '3D faceted brushed-metal surface',
  },
  {
    id: 'harmonic-wave-field',
    name: 'Harmonic Wave Field',
    subtitle: 'Layered silk-metallic wave ribbons',
  },
  {
    id: 'liquid-alloy-lattice',
    name: 'Liquid Alloy Lattice',
    subtitle: 'Rippling 3D diamond metal plates',
  },
  {
    id: 'obsidian-silk-folds',
    name: 'Obsidian Silk Folds',
    subtitle: 'Sweeping diagonal metallic waves',
  },
  {
    id: 'medallion-wave-horizon',
    name: 'Medallion Silk Waves',
    subtitle: 'Full metallic cloth & centered emblem',
  },
  {
    id: 'sculpted-metal-ripples',
    name: 'Sculpted Metal Ripples',
    subtitle: '3D brushed-metal interference rings',
  },
];

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'black-silver-gold',
    name: 'Black · Silver · Gold',
    primary: '#d4d4d8',
    secondary: '#d4a24c',
    tertiary: '#52525b',
    bgBase: '#040405',
  },
  {
    id: 'presidential-slate',
    name: 'Presidential',
    primary: '#cbd5e1',
    secondary: '#d4a24c',
    tertiary: '#475569',
    bgBase: '#06080c',
  },
  {
    id: 'executive-cyan',
    name: 'Leeway Slate',
    primary: '#22d3ee',
    secondary: '#94a3b8',
    tertiary: '#0e7490',
    bgBase: '#040a10',
  },
  {
    id: 'sovereign-bronze',
    name: 'Sovereign Gold',
    primary: '#d4a24c',
    secondary: '#9a7342',
    tertiary: '#e2d6c1',
    bgBase: '#070605',
  },
  {
    id: 'scientific-cobalt',
    name: 'Cobalt Alloy',
    primary: '#38bdf8',
    secondary: '#818cf8',
    tertiary: '#475569',
    bgBase: '#04070e',
  },
  {
    id: 'monochrome-titanium',
    name: 'Titanium',
    primary: '#e2e8f0',
    secondary: '#94a3b8',
    tertiary: '#3f3f46',
    bgBase: '#050608',
  },
];

export const DEFAULT_SETTINGS: BackgroundSettings = {
  sceneId: 'galactic-mesh',
  primaryColor: '#d4d4d8',
  secondaryColor: '#d4a24c',
  tertiaryColor: '#52525b',
  bgBaseColor: '#040405',
  multiColorCycle: false,
  speed: 0.85,
  paused: false,
  objectCount: 1.0,
  objectSize: 1.0,
  glowIntensity: 0.85,
  scrimOpacity: 0.1,
  autoCycleScenes: false,
};

const BACKDROP_STEPS = [
  { name: 'Pure Black', hex: '#030304' },
  { name: 'Obsidian', hex: '#040405' },
  { name: 'Carbon', hex: '#060709' },
  { name: 'Charcoal', hex: '#0a0b0e' },
  { name: 'Slate', hex: '#06080c' },
  { name: 'Abyss', hex: '#040a10' },
  { name: 'Navy', hex: '#04070e' },
  { name: 'Bronze Dark', hex: '#080705' },
];

const DEFAULT_MEDALLION_SRC = tabletAssetUrl('/leeway-true-logo.png');

// ============================================================================
// Color & Math Utilities
// ============================================================================

interface RGB {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0');
  const n = parseInt(full, 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  };
}

function mixRgb(a: RGB, b: RGB, t: number): RGB {
  const k = Math.max(0, Math.min(1, t));
  return {
    r: Math.round(a.r + (b.r - a.r) * k),
    g: Math.round(a.g + (b.g - a.g) * k),
    b: Math.round(a.b + (b.b - a.b) * k),
  };
}

function rgbStr(rgb: RGB, alpha = 1): string {
  if (alpha >= 0.999) return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.max(0, Math.min(1, alpha))})`;
}

function hslToRgb(h: number, s: number, l: number): RGB {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let r1 = 0,
    g1 = 0,
    b1 = 0;
  if (hue < 60) {
    r1 = c;
    g1 = x;
  } else if (hue < 120) {
    r1 = x;
    g1 = c;
  } else if (hue < 180) {
    g1 = c;
    b1 = x;
  } else if (hue < 240) {
    g1 = x;
    b1 = c;
  } else if (hue < 300) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

function hexToHue(hex: string): number {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0');
  const n = parseInt(full, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return Math.round((h * 60 + 360) % 360);
}

function hueToHex(hue: number, sat = 0.62, light = 0.62): string {
  const h = ((hue % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = light - c / 2;
  let r1 = 0,
    g1 = 0,
    b1 = 0;
  if (h < 60) {
    r1 = c;
    g1 = x;
  } else if (h < 120) {
    r1 = x;
    g1 = c;
  } else if (h < 180) {
    g1 = c;
    b1 = x;
  } else if (h < 240) {
    g1 = x;
    b1 = c;
  } else if (h < 300) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
}

function resolveColors(
  settings: BackgroundSettings,
  t: number
): [RGB, RGB, RGB, RGB] {
  const bg = hexToRgb(settings.bgBaseColor);
  if (settings.multiColorCycle) {
    const baseHue = (t * 14) % 360;
    return [
      hslToRgb(baseHue, 0.52, 0.64),
      hslToRgb(baseHue + 95, 0.5, 0.56),
      hslToRgb(baseHue + 200, 0.34, 0.42),
      bg,
    ];
  }
  return [
    hexToRgb(settings.primaryColor),
    hexToRgb(settings.secondaryColor),
    hexToRgb(settings.tertiaryColor),
    bg,
  ];
}

function hash(i: number, seed = 1): number {
  const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

// ============================================================================
// Media Preload & Cache
// ============================================================================

let logoImage: HTMLImageElement | null = null;
let logoLoaded = false;
let logoCurrentSrc = '';

function ensureLogoPreloaded(src = DEFAULT_MEDALLION_SRC) {
  if (typeof window === 'undefined') return;
  if (logoImage && logoCurrentSrc === src) return;
  logoCurrentSrc = src;
  logoLoaded = false;
  const img = new Image();
  img.src = src;
  img.onload = () => {
    logoLoaded = true;
  };
  logoImage = img;
}

const mediaCache = new Map<
  string,
  | { kind: 'image'; el: HTMLImageElement; ready: boolean }
  | { kind: 'video'; el: HTMLVideoElement; ready: boolean }
>();

function getCustomMediaElement(url: string, mediaType: 'image' | 'video') {
  const cached = mediaCache.get(url);
  if (cached) return cached;

  if (mediaType === 'video') {
    const video = document.createElement('video');
    video.src = url;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    const entry = { kind: 'video' as const, el: video, ready: false };
    video.oncanplay = () => {
      entry.ready = true;
      void video.play().catch(() => {});
    };
    mediaCache.set(url, entry);
    return entry;
  }

  const img = new Image();
  img.src = url;
  const entry = { kind: 'image' as const, el: img, ready: false };
  img.onload = () => {
    entry.ready = true;
  };
  mediaCache.set(url, entry);
  return entry;
}

// ============================================================================
// Canvas Renderers (6 Built-in Scenes + Custom Media)
// ============================================================================

function renderConnectedAlloyMesh(
  ctx: CanvasRenderingContext2D,
  vw: number,
  vh: number,
  t: number,
  settings: BackgroundSettings,
  colors: [RGB, RGB, RGB, RGB]
) {
  const [c1, c2, c3, bg] = colors;
  ctx.fillStyle = rgbStr(bg);
  ctx.fillRect(0, 0, vw, vh);

  const cols = Math.max(6, Math.round(11 * Math.sqrt(settings.objectCount)));
  const rows = Math.max(4, Math.round(7 * Math.sqrt(settings.objectCount)));
  const padX = vw * 0.08;
  const padY = vh * 0.08;
  const cellW = (vw + padX * 2) / (cols - 1);
  const cellH = (vh + padY * 2) / (rows - 1);

  interface V3 {
    x: number;
    y: number;
    z: number;
  }

  const pts: V3[] = new Array(rows * cols);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const jitterX = (hash(idx, 1) - 0.5) * cellW * 0.42;
      const jitterY = (hash(idx, 2) - 0.5) * cellH * 0.42;
      const waveX = Math.sin(t * 0.52 + r * 0.7 + c * 0.45) * cellW * 0.14;
      const waveY = Math.cos(t * 0.46 + c * 0.65 + r * 0.5) * cellH * 0.14;

      const x = -padX + c * cellW + jitterX + waveX;
      const y = -padY + r * cellH + jitterY + waveY;
      const z =
        (Math.sin(t * 0.72 + c * 0.62 - r * 0.44) * 28 +
          Math.cos(t * 0.48 + r * 0.8 + c * 0.31) * 18) *
        settings.objectSize;

      pts[idx] = { x, y, z };
    }
  }

  const lx = Math.cos(t * 0.32) * 0.65;
  const ly = Math.sin(t * 0.27) * 0.55 - 0.25;
  const lz = 0.78;
  const lLen = Math.hypot(lx, ly, lz);
  const L = { x: lx / lLen, y: ly / lLen, z: lz / lLen };

  const hx = L.x;
  const hy = L.y;
  const hz = L.z + 1;
  const hLen = Math.hypot(hx, hy, hz);
  const H = { x: hx / hLen, y: hy / hLen, z: hz / hLen };

  const baseAlloy = mixRgb(bg, c3, 0.3);

  const drawMetallicFacet = (a: V3, b: V3, c: V3) => {
    const ux = b.x - a.x,
      uy = b.y - a.y,
      uz = b.z - a.z;
    const vx = c.x - a.x,
      vy = c.y - a.y,
      vz = c.z - a.z;

    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    if (nz < 0) {
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }
    const nLen = Math.hypot(nx, ny, nz) || 1;
    nx /= nLen;
    ny /= nLen;
    nz /= nLen;

    const diffuse = Math.max(0, nx * L.x + ny * L.y + nz * L.z);
    const ndoth = Math.max(0, nx * H.x + ny * H.y + nz * H.z);
    const specular = Math.pow(ndoth, 16) * 0.56 * settings.glowIntensity;
    const rim = Math.max(0, -nx * 0.5 + ny * 0.35 + nz * 0.4) * 0.36;

    let shaded = mixRgb(bg, baseAlloy, 0.26 + diffuse * 0.74);
    shaded = mixRgb(shaded, c1, Math.min(0.85, specular + diffuse * 0.16));
    shaded = mixRgb(shaded, c2, Math.min(0.48, rim * 0.44));

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.closePath();
    ctx.fillStyle = rgbStr(shaded);
    ctx.fill();

    ctx.strokeStyle = rgbStr(mixRgb(c3, c1, specular), 0.28 + specular * 0.45);
    ctx.lineWidth = 0.85;
    ctx.stroke();
  };

  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const p00 = pts[r * cols + c];
      const p10 = pts[r * cols + (c + 1)];
      const p01 = pts[(r + 1) * cols + c];
      const p11 = pts[(r + 1) * cols + (c + 1)];
      if ((r + c) % 2 === 0) {
        drawMetallicFacet(p00, p10, p11);
        drawMetallicFacet(p00, p11, p01);
      } else {
        drawMetallicFacet(p00, p10, p01);
        drawMetallicFacet(p10, p11, p01);
      }
    }
  }

  if (settings.glowIntensity > 0.05) {
    ctx.save();
    for (let r = 1; r < rows - 1; r++) {
      const u = ((t * (0.14 + (r % 3) * 0.04) + r * 0.23) % 1 + 1) % 1;
      const segF = u * (cols - 1);
      const segIdx = Math.min(cols - 2, Math.floor(segF));
      const frac = segF - segIdx;
      const pa = pts[r * cols + segIdx];
      const pb = pts[r * cols + segIdx + 1];
      const px = pa.x + (pb.x - pa.x) * frac;
      const py = pa.y + (pb.y - pa.y) * frac;

      const g = ctx.createRadialGradient(px, py, 0, px, py, 14 * settings.objectSize);
      g.addColorStop(0, rgbStr(c2, 0.85 * settings.glowIntensity));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, 14 * settings.objectSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      const p = pts[r * cols + c];
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.8 * settings.objectSize, 0, Math.PI * 2);
      ctx.fillStyle = rgbStr(c1, 0.48);
      ctx.fill();
    }
  }
}

function renderHarmonicWaveField(
  ctx: CanvasRenderingContext2D,
  vw: number,
  vh: number,
  t: number,
  settings: BackgroundSettings,
  colors: [RGB, RGB, RGB, RGB]
) {
  const [c1, c2, c3, bg] = colors;

  const sky = ctx.createLinearGradient(0, 0, 0, vh);
  sky.addColorStop(0, rgbStr(bg));
  sky.addColorStop(1, rgbStr(mixRgb(bg, c3, 0.24)));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, vw, vh);

  const layers = Math.max(6, Math.round(14 * settings.objectCount));
  const stepX = Math.max(12, Math.round(vw / 75));

  for (let l = 0; l < layers; l++) {
    const frac = l / Math.max(1, layers - 1);
    const baseY = vh * (0.22 + frac * 0.7);
    const amp = (28 + Math.sin(l * 0.9) * 18) * settings.objectSize;
    const freq1 = 0.0022 + l * 0.00025;
    const freq2 = 0.0041 - l * 0.00014;
    const phase1 = t * (0.42 + frac * 0.35) + l * 0.72;
    const phase2 = -t * (0.28 + (1 - frac) * 0.24) + l * 1.15;

    ctx.beginPath();
    ctx.moveTo(0, vh);
    for (let x = 0; x <= vw + stepX; x += stepX) {
      const y =
        baseY +
        Math.sin(x * freq1 + phase1) * amp +
        Math.cos(x * freq2 + phase2) * (amp * 0.45);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(vw + stepX, vh);
    ctx.closePath();

    const layerColor = l % 3 === 0 ? c1 : l % 3 === 1 ? c2 : c3;
    const ribbonGrad = ctx.createLinearGradient(0, baseY - amp * 1.5, 0, vh);
    ribbonGrad.addColorStop(0, rgbStr(mixRgb(bg, layerColor, 0.26 + frac * 0.14), 0.94));
    ribbonGrad.addColorStop(0.35, rgbStr(mixRgb(bg, c3, 0.12), 0.97));
    ribbonGrad.addColorStop(1, rgbStr(bg, 1));
    ctx.fillStyle = ribbonGrad;
    ctx.fill();

    ctx.beginPath();
    for (let x = 0; x <= vw + stepX; x += stepX) {
      const y =
        baseY +
        Math.sin(x * freq1 + phase1) * amp +
        Math.cos(x * freq2 + phase2) * (amp * 0.45);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = rgbStr(layerColor, (0.34 + frac * 0.44) * settings.glowIntensity);
    ctx.lineWidth = 1.2 + frac * 0.55;
    ctx.stroke();
  }
}

function renderLiquidAlloyLattice(
  ctx: CanvasRenderingContext2D,
  vw: number,
  vh: number,
  t: number,
  settings: BackgroundSettings,
  colors: [RGB, RGB, RGB, RGB]
) {
  const [c1, c2, c3, bg] = colors;
  ctx.fillStyle = rgbStr(bg);
  ctx.fillRect(0, 0, vw, vh);

  const cols = Math.max(8, Math.round(14 * Math.sqrt(settings.objectCount)));
  const rows = Math.max(5, Math.round(9 * Math.sqrt(settings.objectCount)));
  const padX = vw * 0.1;
  const padY = vh * 0.1;
  const cellW = (vw + padX * 2) / (cols - 1);
  const cellH = (vh + padY * 2) / (rows - 1);

  interface V3 {
    x: number;
    y: number;
    z: number;
  }

  const pts: V3[] = new Array(rows * cols);
  for (let r = 0; r < rows; r++) {
    const rowShift = r % 2 === 0 ? 0 : cellW * 0.5;
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const baseX = -padX + c * cellW + rowShift;
      const baseY = -padY + r * cellH;
      const distWave = Math.sin(baseX * 0.0055 - t * 0.9 + baseY * 0.004);
      const crossWave = Math.cos(baseY * 0.0065 + t * 0.65 - baseX * 0.003);
      const z = (distWave * 24 + crossWave * 16) * settings.objectSize;

      pts[idx] = {
        x: baseX + distWave * 6,
        y: baseY + crossWave * 5,
        z,
      };
    }
  }

  const lx = Math.sin(t * 0.35) * 0.6;
  const ly = Math.cos(t * 0.25) * 0.45 - 0.3;
  const lz = 0.8;
  const lLen = Math.hypot(lx, ly, lz);
  const L = { x: lx / lLen, y: ly / lLen, z: lz / lLen };

  const hx = L.x;
  const hy = L.y;
  const hz = L.z + 1;
  const hLen = Math.hypot(hx, hy, hz);
  const H = { x: hx / hLen, y: hy / hLen, z: hz / hLen };

  const baseMetal = mixRgb(bg, c3, 0.32);

  const shadeDiamondTri = (a: V3, b: V3, c: V3, parity: number) => {
    const ux = b.x - a.x,
      uy = b.y - a.y,
      uz = b.z - a.z;
    const vx = c.x - a.x,
      vy = c.y - a.y,
      vz = c.z - a.z;
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    if (nz < 0) {
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }
    const nLen = Math.hypot(nx, ny, nz) || 1;
    nx /= nLen;
    ny /= nLen;
    nz /= nLen;

    const diff = Math.max(0, nx * L.x + ny * L.y + nz * L.z);
    const spec =
      Math.pow(Math.max(0, nx * H.x + ny * H.y + nz * H.z), 20) *
      0.62 *
      settings.glowIntensity;
    const toneColor = parity === 0 ? c1 : c2;

    let col = mixRgb(bg, baseMetal, 0.24 + diff * 0.72);
    col = mixRgb(col, toneColor, Math.min(0.85, spec + diff * 0.14));

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.closePath();
    ctx.fillStyle = rgbStr(col);
    ctx.fill();

    ctx.strokeStyle = rgbStr(mixRgb(c3, toneColor, spec), 0.24 + spec * 0.5);
    ctx.lineWidth = 0.8;
    ctx.stroke();
  };

  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const p00 = pts[r * cols + c];
      const p10 = pts[r * cols + (c + 1)];
      const p01 = pts[(r + 1) * cols + c];
      const p11 = pts[(r + 1) * cols + (c + 1)];

      if (r % 2 === 0) {
        shadeDiamondTri(p00, p10, p01, 0);
        shadeDiamondTri(p10, p11, p01, 1);
      } else {
        shadeDiamondTri(p00, p10, p11, 0);
        shadeDiamondTri(p00, p11, p01, 1);
      }
    }
  }
}

function drawFullScreenWavyCloth(
  ctx: CanvasRenderingContext2D,
  vw: number,
  vh: number,
  t: number,
  foldCount: number,
  objectSize: number,
  glowIntensity: number,
  baseCol: RGB,
  accentA: RGB,
  accentB: RGB,
  midTone: RGB
) {
  ctx.fillStyle = rgbStr(mixRgb(baseCol, midTone, 0.2));
  ctx.fillRect(0, 0, vw, vh);

  const diag = Math.hypot(vw, vh);
  ctx.save();
  ctx.translate(vw * 0.5, vh * 0.5);
  ctx.rotate(-0.34);

  const halfW = diag * 0.72;
  const halfH = diag * 0.72;
  const stepX = 22;

  for (let f = 0; f < foldCount; f++) {
    const frac = f / Math.max(1, foldCount - 1);
    const yCenter = -halfH * 1.02 + frac * (halfH * 1.95);
    const amp = (34 + (f % 3) * 14) * objectSize;
    const freq = 0.0023 + (f % 4) * 0.00035;
    const phase = t * (0.4 + frac * 0.25) + f * 0.85;

    ctx.beginPath();
    ctx.moveTo(-halfW, halfH * 1.2);
    for (let x = -halfW; x <= halfW; x += stepX) {
      const y =
        yCenter +
        Math.sin(x * freq + phase) * amp +
        Math.cos(x * freq * 1.65 - phase * 0.7) * (amp * 0.36);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(halfW, halfH * 1.2);
    ctx.closePath();

    const accentCol = f % 2 === 0 ? accentA : accentB;
    const grad = ctx.createLinearGradient(0, yCenter - amp * 1.5, 0, yCenter + halfH * 0.38);
    grad.addColorStop(0, rgbStr(mixRgb(baseCol, accentCol, 0.24 + frac * 0.14), 0.97));
    grad.addColorStop(0.28, rgbStr(mixRgb(baseCol, midTone, 0.18), 0.99));
    grad.addColorStop(1, rgbStr(baseCol, 1));
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    for (let x = -halfW; x <= halfW; x += stepX) {
      const y =
        yCenter +
        Math.sin(x * freq + phase) * amp +
        Math.cos(x * freq * 1.65 - phase * 0.7) * (amp * 0.36);
      if (x === -halfW) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = rgbStr(accentCol, (0.3 + frac * 0.36) * glowIntensity);
    ctx.lineWidth = 1.3;
    ctx.stroke();
  }

  ctx.restore();
}

function renderObsidianSilkFolds(
  ctx: CanvasRenderingContext2D,
  vw: number,
  vh: number,
  t: number,
  settings: BackgroundSettings,
  colors: [RGB, RGB, RGB, RGB]
) {
  const [c1, c2, c3, bg] = colors;
  const foldCount = Math.max(7, Math.round(13 * settings.objectCount));
  drawFullScreenWavyCloth(
    ctx,
    vw,
    vh,
    t,
    foldCount,
    settings.objectSize,
    settings.glowIntensity,
    bg,
    c1,
    c2,
    c3
  );
}

function renderMedallionWaveHorizon(
  ctx: CanvasRenderingContext2D,
  vw: number,
  vh: number,
  t: number,
  settings: BackgroundSettings,
  colors: [RGB, RGB, RGB, RGB],
  medallionSrc: string
) {
  ensureLogoPreloaded(medallionSrc);
  const [c1, c2, c3, bg] = colors;

  const pureBlack = mixRgb({ r: 3, g: 3, b: 4 }, bg, 0.4);
  const silverTone = mixRgb({ r: 214, g: 216, b: 222 }, c1, 0.45);
  const goldTone = mixRgb({ r: 212, g: 162, b: 76 }, c2, 0.45);
  const charcoalTone = mixRgb({ r: 48, g: 50, b: 58 }, c3, 0.4);

  const foldCount = Math.max(7, Math.round(13 * settings.objectCount));
  drawFullScreenWavyCloth(
    ctx,
    vw,
    vh,
    t,
    foldCount,
    settings.objectSize,
    settings.glowIntensity,
    pureBlack,
    silverTone,
    goldTone,
    charcoalTone
  );

  const cx = vw * 0.5;
  const cy = vh * 0.5;
  const baseRadius = Math.min(vw, vh) * 0.31 * settings.objectSize;
  const floatY = Math.sin(t * 0.65) * 5;
  const breath = 1 + Math.sin(t * 0.5) * 0.014;

  const shadow = ctx.createRadialGradient(
    cx,
    cy + floatY,
    baseRadius * 0.72,
    cx,
    cy + floatY,
    baseRadius * 1.48
  );
  shadow.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  shadow.addColorStop(0.55, rgbStr(goldTone, 0.18 * settings.glowIntensity));
  shadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.arc(cx, cy + floatY, baseRadius * 1.48, 0, Math.PI * 2);
  ctx.fill();

  if (logoImage && logoLoaded) {
    const imgW = baseRadius * 1.9 * breath;
    const imgH = imgW * (logoImage.naturalHeight / (logoImage.naturalWidth || 1));

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(
      cx,
      cy + floatY,
      baseRadius * 0.89 * breath,
      baseRadius * 1.02 * breath,
      0,
      0,
      Math.PI * 2
    );
    ctx.clip();

    ctx.drawImage(logoImage, cx - imgW / 2, cy + floatY - imgH / 2, imgW, imgH);

    const sweepGold = (((t * 0.22) % 2.4) - 0.7) * imgW + cx;
    const gSheen = ctx.createLinearGradient(
      sweepGold - 95,
      cy - imgH * 0.45,
      sweepGold + 95,
      cy + imgH * 0.45
    );
    gSheen.addColorStop(0, 'rgba(0,0,0,0)');
    gSheen.addColorStop(0.5, rgbStr(goldTone, 0.22 * settings.glowIntensity));
    gSheen.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gSheen;
    ctx.fillRect(cx - imgW / 2, cy + floatY - imgH / 2, imgW, imgH);

    const sweepSilver = (((t * 0.22 + 1.2) % 2.4) - 0.7) * imgW + cx;
    const sSheen = ctx.createLinearGradient(
      sweepSilver - 85,
      cy + imgH * 0.45,
      sweepSilver + 85,
      cy - imgH * 0.45
    );
    sSheen.addColorStop(0, 'rgba(0,0,0,0)');
    sSheen.addColorStop(0.5, rgbStr(silverTone, 0.18 * settings.glowIntensity));
    sSheen.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sSheen;
    ctx.fillRect(cx - imgW / 2, cy + floatY - imgH / 2, imgW, imgH);

    const edgeFade = ctx.createRadialGradient(
      cx,
      cy + floatY,
      baseRadius * 0.7 * breath,
      cx,
      cy + floatY,
      baseRadius * 1.03 * breath
    );
    edgeFade.addColorStop(0, 'rgba(0,0,0,0)');
    edgeFade.addColorStop(1, rgbStr(pureBlack, 0.94));
    ctx.fillStyle = edgeFade;
    ctx.fillRect(cx - imgW, cy + floatY - imgH, imgW * 2, imgH * 2);
    ctx.restore();

    ctx.beginPath();
    ctx.ellipse(
      cx,
      cy + floatY,
      baseRadius * 0.89 * breath,
      baseRadius * 1.02 * breath,
      0,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = rgbStr(goldTone, 0.56 * settings.glowIntensity);
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(
      cx,
      cy + floatY,
      baseRadius * 0.94 * breath,
      baseRadius * 1.07 * breath,
      0,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = rgbStr(silverTone, 0.28 * settings.glowIntensity);
    ctx.lineWidth = 1.0;
    ctx.stroke();
  }
}

function renderSculptedMetalRipples(
  ctx: CanvasRenderingContext2D,
  vw: number,
  vh: number,
  t: number,
  settings: BackgroundSettings,
  colors: [RGB, RGB, RGB, RGB]
) {
  const [c1, c2, c3, bg] = colors;
  ctx.fillStyle = rgbStr(bg);
  ctx.fillRect(0, 0, vw, vh);

  const cols = Math.max(10, Math.round(16 * Math.sqrt(settings.objectCount)));
  const rows = Math.max(7, Math.round(10 * Math.sqrt(settings.objectCount)));
  const padX = vw * 0.06;
  const padY = vh * 0.06;
  const cellW = (vw + padX * 2) / (cols - 1);
  const cellH = (vh + padY * 2) / (rows - 1);

  const e1x = vw * (0.36 + 0.14 * Math.cos(t * 0.35));
  const e1y = vh * (0.45 + 0.15 * Math.sin(t * 0.42));
  const e2x = vw * (0.66 + 0.14 * Math.sin(t * 0.31));
  const e2y = vh * (0.55 + 0.15 * Math.cos(t * 0.38));

  interface V3 {
    x: number;
    y: number;
    z: number;
  }

  const pts: V3[] = new Array(rows * cols);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = -padX + c * cellW;
      const y = -padY + r * cellH;
      const d1 = Math.hypot(x - e1x, y - e1y);
      const d2 = Math.hypot(x - e2x, y - e2y);
      const w1 = Math.sin(d1 * 0.018 - t * 1.45);
      const w2 = Math.sin(d2 * 0.018 - t * 1.25);
      const z = (w1 + w2) * 18 * settings.objectSize;
      pts[r * cols + c] = { x, y, z };
    }
  }

  const lx = Math.cos(t * 0.28) * 0.55;
  const ly = Math.sin(t * 0.22) * 0.45 - 0.3;
  const lz = 0.82;
  const lLen = Math.hypot(lx, ly, lz);
  const L = { x: lx / lLen, y: ly / lLen, z: lz / lLen };

  const hx = L.x;
  const hy = L.y;
  const hz = L.z + 1;
  const hLen = Math.hypot(hx, hy, hz);
  const H = { x: hx / hLen, y: hy / hLen, z: hz / hLen };

  const baseAlloy = mixRgb(bg, c3, 0.28);

  const shadeFacet = (a: V3, b: V3, c: V3, parity: number) => {
    const ux = b.x - a.x,
      uy = b.y - a.y,
      uz = b.z - a.z;
    const vx = c.x - a.x,
      vy = c.y - a.y,
      vz = c.z - a.z;
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    if (nz < 0) {
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }
    const nLen = Math.hypot(nx, ny, nz) || 1;
    nx /= nLen;
    ny /= nLen;
    nz /= nLen;

    const diff = Math.max(0, nx * L.x + ny * L.y + nz * L.z);
    const spec =
      Math.pow(Math.max(0, nx * H.x + ny * H.y + nz * H.z), 18) *
      0.6 *
      settings.glowIntensity;
    const tone = parity === 0 ? c1 : c2;

    let col = mixRgb(bg, baseAlloy, 0.24 + diff * 0.72);
    col = mixRgb(col, tone, Math.min(0.84, spec + diff * 0.14));

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.closePath();
    ctx.fillStyle = rgbStr(col);
    ctx.fill();

    ctx.strokeStyle = rgbStr(mixRgb(c3, tone, spec), 0.2 + spec * 0.45);
    ctx.lineWidth = 0.75;
    ctx.stroke();
  };

  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const p00 = pts[r * cols + c];
      const p10 = pts[r * cols + (c + 1)];
      const p01 = pts[(r + 1) * cols + c];
      const p11 = pts[(r + 1) * cols + (c + 1)];
      shadeFacet(p00, p10, p11, (r + c) % 2);
      shadeFacet(p00, p11, p01, (r + c + 1) % 2);
    }
  }
}

function renderCustomMediaBackground(
  ctx: CanvasRenderingContext2D,
  vw: number,
  vh: number,
  t: number,
  settings: BackgroundSettings,
  colors: [RGB, RGB, RGB, RGB],
  custom: CustomBackground
) {
  const [c1, c2, , bg] = colors;
  ctx.fillStyle = rgbStr(bg);
  ctx.fillRect(0, 0, vw, vh);

  if (!custom.mediaUrl || !custom.mediaType) return;
  const media = getCustomMediaElement(custom.mediaUrl, custom.mediaType);
  if (!media.ready) return;

  const mw = media.kind === 'video' ? media.el.videoWidth : media.el.naturalWidth;
  const mh = media.kind === 'video' ? media.el.videoHeight : media.el.naturalHeight;
  if (!mw || !mh) return;

  const zoom =
    (1.04 + Math.sin(t * 0.35) * 0.03) *
    Math.max(0.85, Math.min(1.3, settings.objectSize));
  const panX = Math.sin(t * 0.22) * vw * 0.018;
  const panY = Math.cos(t * 0.19) * vh * 0.018;

  const scale = Math.max(vw / mw, vh / mh) * zoom;
  const dw = mw * scale;
  const dh = mh * scale;
  const dx = (vw - dw) * 0.5 + panX;
  const dy = (vh - dh) * 0.5 + panY;

  ctx.drawImage(media.el, dx, dy, dw, dh);

  if (settings.glowIntensity > 0.05) {
    const sweep = (((t * 0.18) % 2.4) - 0.7) * vw;
    const sheen = ctx.createLinearGradient(sweep - 180, 0, sweep + 180, vh);
    sheen.addColorStop(0, 'rgba(0,0,0,0)');
    sheen.addColorStop(0.5, rgbStr(c1, 0.14 * settings.glowIntensity));
    sheen.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, vw, vh);

    const baseY = vh * 0.84;
    ctx.beginPath();
    for (let x = 0; x <= vw; x += 18) {
      const y = baseY + Math.sin(x * 0.003 + t * 0.6) * 14;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = rgbStr(c2, 0.28 * settings.glowIntensity);
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}


// ============================================================================
// Galactic Mesh Scene (LeeWay Tablet Original)
// ============================================================================

interface GalacticShape {
  x: number;
  y: number;
  size: number;
  parallax: number;
  type: number;
  rotSpeed: number;
  rotation: number;
  opacity: number;
}

let cachedGalacticShapes: GalacticShape[] | null = null;

function renderGalacticMesh(
  ctx: CanvasRenderingContext2D,
  vw: number,
  vh: number,
  elapsedSeconds: number,
  settings: BackgroundSettings,
  colors: ResolvedColors
) {
  if (!cachedGalacticShapes) {
    cachedGalacticShapes = Array.from({ length: 700 }, () => ({
      x: Math.random() * 2400,
      y: Math.random() * 1600,
      size: Math.random() * 3 + 1,
      parallax: Math.random() * 0.7 + 0.2,
      type: Math.random(),
      rotSpeed: (Math.random() - 0.5) * 0.02,
      rotation: Math.random() * Math.PI,
      opacity: Math.random() * 0.6 + 0.2,
    }));
  }

  ctx.fillStyle = colors.bgBase;
  ctx.fillRect(0, 0, vw, vh);

  const speed = (settings.speed || 0.8) * 0.35;
  const offsetX = elapsedSeconds * 60 * speed;
  const p = colors.primaryRgb;
  const rgb = `${p.r},${p.g},${p.b}`;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for (const shape of cachedGalacticShapes) {
    const x = (shape.x + offsetX * shape.parallax) % vw;
    const y = (shape.y) % vh;
    const pulse = Math.sin(elapsedSeconds * 2.5 + shape.x * 0.005) * 0.3 + 0.7;
    const glow = settings.glowIntensity || 0.85;
    ctx.fillStyle = `rgba(${rgb},${shape.opacity * pulse * glow})`;
    ctx.strokeStyle = `rgba(${rgb},${shape.opacity * 0.4 * glow})`;

    const mode = shape.type > 0.5 ? 'shards' : 'orbs';
    const sz = shape.size * (settings.objectSize || 1.0);
    if (mode === 'orbs') {
      ctx.beginPath();
      ctx.arc(x, y, sz * 6 * pulse, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(shape.rotation + elapsedSeconds * shape.rotSpeed * 60);
      ctx.beginPath();
      ctx.moveTo(-sz * 3, -sz * 2);
      ctx.lineTo(sz * 4, 0);
      ctx.lineTo(0, sz * 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.restore();
}


function renderBackgroundFrame(
  ctx: CanvasRenderingContext2D,
  vw: number,
  vh: number,
  elapsedSeconds: number,
  settings: BackgroundSettings,
  customBackgrounds: CustomBackground[],
  medallionSrc: string
) {
  let activeBuiltIn: BuiltInSceneId = 'connected-alloy-mesh';
  let customMedia: CustomBackground | undefined;

  if (settings.sceneId.startsWith('custom:')) {
    const found = customBackgrounds.find((c) => c.id === settings.sceneId);
    if (found) {
      if (found.kind === 'media') customMedia = found;
      else if (found.baseSceneId) activeBuiltIn = found.baseSceneId;
    }
  } else {
    activeBuiltIn = settings.sceneId as BuiltInSceneId;
  }

  const colors = resolveColors(settings, elapsedSeconds);

  if (customMedia) {
    renderCustomMediaBackground(ctx, vw, vh, elapsedSeconds, settings, colors, customMedia);
  } else {
        switch (activeBuiltIn) {
      case 'galactic-mesh':
        renderGalacticMesh(ctx, vw, vh, elapsedSeconds, settings, colors);
        break;
      case 'connected-alloy-mesh':
        renderConnectedAlloyMesh(ctx, vw, vh, elapsedSeconds, settings, colors);
        break;
      case 'harmonic-wave-field':
        renderHarmonicWaveField(ctx, vw, vh, elapsedSeconds, settings, colors);
        break;
      case 'liquid-alloy-lattice':
        renderLiquidAlloyLattice(ctx, vw, vh, elapsedSeconds, settings, colors);
        break;
      case 'obsidian-silk-folds':
        renderObsidianSilkFolds(ctx, vw, vh, elapsedSeconds, settings, colors);
        break;
      case 'medallion-wave-horizon':
        renderMedallionWaveHorizon(
          ctx,
          vw,
          vh,
          elapsedSeconds,
          settings,
          colors,
          medallionSrc
        );
        break;
      case 'sculpted-metal-ripples':
        renderSculptedMetalRipples(ctx, vw, vh, elapsedSeconds, settings, colors);
        break;
    }
  }

  if (settings.scrimOpacity > 0.005) {
    ctx.fillStyle = `rgba(2, 3, 5, ${Math.min(0.85, settings.scrimOpacity)})`;
    ctx.fillRect(0, 0, vw, vh);
  }
}

// ============================================================================
// Rotary Dial Component
// ============================================================================

interface RotaryDialProps {
  label: string;
  valueText: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (nextValue: number) => void;
  mode?: 'arc' | 'hue' | 'detent';
  accentColor?: string;
  detentCount?: number;
  size?: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function snap(v: number, min: number, max: number, step: number) {
  const stepped = Math.round((v - min) / step) * step + min;
  const decimals = (step.toString().split('.')[1] || '').length;
  return clamp(Number(stepped.toFixed(decimals)), min, max);
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  if (Math.abs(endAngle - startAngle) < 0.01) return '';
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function RotaryDial({
  label,
  valueText,
  min,
  max,
  step = 0.01,
  value,
  onChange,
  mode = 'arc',
  accentColor = '#22d3ee',
  detentCount = 6,
  size = 66,
}: RotaryDialProps) {
  const uid = useId().replace(/:/g, '');
  const dialRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const latestRef = useRef({ value, min, max, step, mode, onChange });
  latestRef.current = { value, min, max, step, mode, onChange };

  const dragRef = useRef<{
    startX: number;
    startY: number;
    startVal: number;
    moved: boolean;
    hueMode: boolean;
  } | null>(null);

  const isFullCircle = mode === 'hue';
  const startDeg = isFullCircle ? 0 : -135;
  const sweepDeg = isFullCircle ? 360 : 270;
  const norm = max === min ? 0 : clamp((value - min) / (max - min), 0, 1);
  const currentDeg = startDeg + norm * sweepDeg;

  useEffect(() => {
    const el = dialRef.current;
    if (!el) return;

    const onNativeWheel = (e: globalThis.WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const { value: v, min: mn, max: mx, step: st, mode: m, onChange: cb } =
        latestRef.current;
      const dir = e.deltaY < 0 || e.deltaX > 0 ? 1 : -1;
      const mult = m === 'hue' ? 6 : 1;
      let next = v + dir * st * mult;
      if (m === 'hue') {
        if (next >= mx) next = mn + (next - mx);
        if (next < mn) next = mx - (mn - next);
      }
      cb(snap(next, mn, mx, st));
    };

    el.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => el.removeEventListener('wheel', onNativeWheel);
  }, []);

  const getPointerInfo = (clientX: number, clientY: number) => {
    const el = dialRef.current;
    if (!el) return { angle: 0, dist: 0 };
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    return { angle: deg, dist: Math.hypot(dx, dy) };
  };

  const angleToArcNorm = (deg: number) => {
    const signed = deg > 180 ? deg - 360 : deg;
    const clamped = clamp(signed, -135, 135);
    return (clamped + 135) / 270;
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    const { angle, dist } = getPointerInfo(e.clientX, e.clientY);

    if (isFullCircle) {
      let nextVal = value;
      if (dist > 8) {
        nextVal = snap(min + (angle / 360) * (max - min), min, max, step);
        onChange(nextVal);
      }
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startVal: nextVal,
        moved: false,
        hueMode: true,
      };
    } else {
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startVal: value,
        moved: false,
        hueMode: false,
      };
    }
    setDragging(true);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const state = dragRef.current;
    if (!state) return;

    const dx = e.clientX - state.startX;
    const dy = state.startY - e.clientY;
    if (Math.hypot(dx, dy) > 3) {
      state.moved = true;
    }

    if (state.hueMode) {
      const { angle, dist } = getPointerInfo(e.clientX, e.clientY);
      if (dist > 8) {
        const nextVal = snap(min + (angle / 360) * (max - min), min, max, step);
        onChange(nextVal);
      } else {
        const linearDelta = dx + dy;
        let next = state.startVal + (linearDelta / 90) * (max - min);
        next = (((next - min) % (max - min)) + (max - min)) % (max - min) + min;
        onChange(snap(next, min, max, step));
      }
      return;
    }

    const combinedDelta = dx * 0.75 + dy;
    const fullSweepPx = mode === 'detent' ? Math.max(70, detentCount * 22) : 92;
    const raw = state.startVal + (combinedDelta / fullSweepPx) * (max - min);
    onChange(snap(raw, min, max, step));
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const state = dragRef.current;
    if (!state) return;

    if (!state.moved && !state.hueMode) {
      const { angle, dist } = getPointerInfo(e.clientX, e.clientY);
      if (dist > size * 0.28) {
        const targetNorm = angleToArcNorm(angle);
        const nextVal = snap(min + targetNorm * (max - min), min, max, step);
        onChange(nextVal);
      } else if (mode === 'detent') {
        const next = value + step > max ? min : value + step;
        onChange(snap(next, min, max, step));
      }
    }

    dragRef.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      let next = value + step;
      if (isFullCircle && next >= max) next = min;
      onChange(snap(next, min, max, step));
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      let next = value - step;
      if (isFullCircle && next < min) next = max - step;
      onChange(snap(next, min, max, step));
    }
  };

  const cx = size / 2;
  const cy = size / 2;
  const trackR = size * 0.4;
  const knobR = size * 0.28;
  const ticks = mode === 'detent' ? Math.max(2, detentCount) : 13;

  const indicatorStart = polarToCartesian(cx, cy, knobR * 0.28, currentDeg);
  const indicatorEnd = polarToCartesian(cx, cy, knobR * 0.86, currentDeg);

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div
        ref={dialRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        style={{ width: size, height: size }}
        className={`relative touch-none rounded-full cursor-grab active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-cyan-400 transition-transform duration-100 ${
          dragging ? 'scale-105' : 'hover:scale-[1.03]'
        }`}
      >
        {isFullCircle && (
          <div
            aria-hidden="true"
            className="absolute inset-[3px] rounded-full opacity-90"
            style={{
              background:
                'conic-gradient(from 0deg, #ef4444, #eab308, #22c55e, #06b6d4, #3b82f6, #a855f7, #ef4444)',
              WebkitMask:
                'radial-gradient(farthest-side, transparent calc(100% - 5.5px), #000 calc(100% - 4.5px))',
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 5.5px), #000 calc(100% - 4.5px))',
            }}
          />
        )}

        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
          {Array.from({ length: ticks }).map((_, i) => {
            const frac = ticks === 1 ? 0 : i / (isFullCircle ? ticks : ticks - 1);
            const deg = startDeg + frac * sweepDeg;
            const p1 = polarToCartesian(cx, cy, trackR + 3.5, deg);
            const p2 = polarToCartesian(cx, cy, trackR + 6.5, deg);
            const isHighlighted =
              mode === 'detent' ? i === Math.round(value) : frac <= norm + 0.01;
            return (
              <line
                key={i}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={
                  isHighlighted && !isFullCircle
                    ? accentColor
                    : 'rgba(148,163,184,0.38)'
                }
                strokeWidth={mode === 'detent' && isHighlighted ? 2 : 1.1}
                strokeLinecap="round"
              />
            );
          })}

          {!isFullCircle && (
            <>
              <path
                d={describeArc(cx, cy, trackR, startDeg, startDeg + sweepDeg)}
                fill="none"
                stroke="rgba(148, 163, 184, 0.22)"
                strokeWidth={3.2}
                strokeLinecap="round"
              />
              {norm > 0.005 && (
                <path
                  d={describeArc(cx, cy, trackR, startDeg, currentDeg)}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth={3.2}
                  strokeLinecap="round"
                />
              )}
            </>
          )}

          <defs>
            <radialGradient id={`cap-${uid}`} cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="55%" stopColor="#111827" />
              <stop offset="100%" stopColor="#030712" />
            </radialGradient>
          </defs>
          <circle
            cx={cx}
            cy={cy}
            r={knobR}
            fill={`url(#cap-${uid})`}
            stroke={dragging ? accentColor : 'rgba(203, 213, 225, 0.32)'}
            strokeWidth={dragging ? 1.7 : 1.25}
          />

          {isFullCircle && (
            <circle cx={cx} cy={cy} r={knobR * 0.36} fill={accentColor} opacity={0.94} />
          )}

          <line
            x1={indicatorStart.x}
            y1={indicatorStart.y}
            x2={indicatorEnd.x}
            y2={indicatorEnd.y}
            stroke={isFullCircle ? '#ffffff' : accentColor}
            strokeWidth={2.3}
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="text-center leading-tight max-w-[88px]">
        <div className="text-[11px] font-medium text-slate-300 truncate">{label}</div>
        <div className="text-[10px] font-mono tabular-nums text-slate-400 truncate">
          {valueText}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Single-File Main Component: LeewayAgentVTBackground
// ============================================================================

const SETTINGS_STORAGE_KEY = 'leeway-bg-settings-v5';
const CUSTOM_STORAGE_KEY = 'leeway-bg-custom-v1';

function isValidHex(val: string | null): val is string {
  return Boolean(val && /^#[0-9a-fA-F]{6}$/.test(val));
}

function readCustomBackgrounds(): CustomBackground[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CustomBackground[]) : [];
  } catch {
    return [];
  }
}

function readInitialState(customBackgrounds: CustomBackground[]): {
  settings: BackgroundSettings;
  isEmbed: boolean;
} {
  if (typeof window === 'undefined') {
    return { settings: DEFAULT_SETTINGS, isEmbed: false };
  }

  let base = { ...DEFAULT_SETTINGS };
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<BackgroundSettings>;
      base = { ...base, ...parsed };
      const isBuiltIn = SCENES.some((s) => s.id === base.sceneId);
      const isCustom = customBackgrounds.some((c) => c.id === base.sceneId);
      if (!isBuiltIn && !isCustom) {
        base.sceneId = DEFAULT_SETTINGS.sceneId;
      }
    }
  } catch {
    // Ignore storage errors
  }

  const params = new URLSearchParams(window.location.search);
  const sceneParam = params.get('scene') as SceneId | null;
  const validScene = SCENES.find((s) => s.id === sceneParam);

  const num = (key: string, fallback: number, min: number, max: number) => {
    const raw = params.get(key);
    if (!raw) return fallback;
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
  };

  const c1 = params.get('c1');
  const c2 = params.get('c2');
  const c3 = params.get('c3');
  const bg = params.get('bg');

  return {
    settings: {
      ...base,
      sceneId: validScene ? validScene.id : base.sceneId,
      primaryColor: isValidHex(c1) ? c1 : base.primaryColor,
      secondaryColor: isValidHex(c2) ? c2 : base.secondaryColor,
      tertiaryColor: isValidHex(c3) ? c3 : base.tertiaryColor,
      bgBaseColor: isValidHex(bg) ? bg : base.bgBaseColor,
      multiColorCycle: params.has('cycle')
        ? params.get('cycle') === '1'
        : base.multiColorCycle,
      speed: num('speed', base.speed, 0.1, 3.0),
      objectCount: num('count', base.objectCount, 0.25, 2.0),
      objectSize: num('size', base.objectSize, 0.5, 1.8),
      glowIntensity: num('glow', base.glowIntensity, 0.1, 1.5),
      scrimOpacity: num('dim', base.scrimOpacity, 0, 0.8),
    },
    isEmbed: params.get('embed') === '1',
  };
}

export interface LeewayAgentVTBackgroundProps {
  /** Override medallion image path or base64 data URI */
  medallionSrc?: string;
  /** Hide floating settings button completely */
  hideControls?: boolean;
}

export function LeewayAgentVTBackground({
  medallionSrc = DEFAULT_MEDALLION_SRC,
  hideControls = false,
}: LeewayAgentVTBackgroundProps) {
  const [customBackgrounds, setCustomBackgrounds] = useState<CustomBackground[]>(
    readCustomBackgrounds
  );
  const [initial] = useState(() => readInitialState(customBackgrounds));
  const [settings, setSettings] = useState<BackgroundSettings>(initial.settings);

  const [open, setOpen] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [newName, setNewName] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const settingsRef = useRef<BackgroundSettings>(settings);
  const customRef = useRef<CustomBackground[]>(customBackgrounds);
  const medallionSrcRef = useRef<string>(medallionSrc);
  const elapsedRef = useRef<number>(0);

  settingsRef.current = settings;
  customRef.current = customBackgrounds;
  medallionSrcRef.current = medallionSrc;

  useEffect(() => {
    if (initial.isEmbed) return;
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }, [settings, initial.isEmbed]);

  useEffect(() => {
    if (initial.isEmbed) return;
    try {
      const persistable = customBackgrounds.filter(
        (c) => !c.mediaUrl || !c.mediaUrl.startsWith('blob:')
      );
      localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(persistable));
    } catch {
      // Ignore quota errors
    }
  }, [customBackgrounds, initial.isEmbed]);

  useEffect(() => {
    if (!settings.autoCycleScenes || settings.paused) return;
    const allIds: SceneId[] = [
      ...SCENES.map((s) => s.id),
      ...customBackgrounds.map((c) => c.id as SceneId),
    ];
    const timer = window.setInterval(() => {
      setSettings((prev) => {
        const idx = allIds.indexOf(prev.sceneId);
        const next = allIds[(idx + 1 + allIds.length) % allIds.length];
        return { ...prev, sceneId: next };
      });
    }, 12000);
    return () => window.clearInterval(timer);
  }, [settings.autoCycleScenes, settings.paused, customBackgrounds]);

  useEffect(() => {
    ensureLogoPreloaded(medallionSrc);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let vw = window.innerWidth;
    let vh = window.innerHeight;

    const handleResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = window.innerWidth;
      vh = window.innerHeight;
      canvas.width = Math.floor(vw * dpr);
      canvas.height = Math.floor(vh * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let rafId = 0;
    let lastNow = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - lastNow) / 1000));
      lastNow = now;

      const current = settingsRef.current;
      const effectiveSpeed = current.paused
        ? 0
        : motionQuery.matches
        ? current.speed * 0.15
        : current.speed;
      elapsedRef.current += dt * effectiveSpeed;

      renderBackgroundFrame(
        ctx,
        vw,
        vh,
        elapsedRef.current,
        current,
        customRef.current,
        medallionSrcRef.current
      );
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [medallionSrc]);

  const update = <K extends keyof BackgroundSettings>(
    key: K,
    value: BackgroundSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const allScenes = [
    ...SCENES.map((s) => ({
      id: s.id as SceneId,
      name: s.name,
      subtitle: s.subtitle,
      isCustom: false,
      customItem: undefined as CustomBackground | undefined,
    })),
    ...customBackgrounds.map((c) => ({
      id: c.id as SceneId,
      name: c.name,
      subtitle:
        c.kind === 'media'
          ? c.mediaType === 'video'
            ? 'Custom Video'
            : 'Custom Image'
          : 'Saved Preset',
      isCustom: true,
      customItem: c,
    })),
  ];

  const activeSceneIdx = Math.max(
    0,
    allScenes.findIndex((s) => s.id === settings.sceneId)
  );
  const activeSceneMeta = allScenes[activeSceneIdx] ?? allScenes[0];

  const activePresetIdx = Math.max(
    0,
    COLOR_PRESETS.findIndex(
      (p) =>
        p.primary.toLowerCase() === settings.primaryColor.toLowerCase() &&
        p.secondary.toLowerCase() === settings.secondaryColor.toLowerCase()
    )
  );

  const activeBackdropIdx = Math.max(
    0,
    BACKDROP_STEPS.findIndex(
      (b) => b.hex.toLowerCase() === settings.bgBaseColor.toLowerCase()
    )
  );

  const handleSceneDialChange = (idxFloat: number) => {
    const idx = Math.min(allScenes.length - 1, Math.max(0, Math.round(idxFloat)));
    const target = allScenes[idx];
    if (!target) return;

    if (target.customItem && target.customItem.kind === 'preset') {
      const item = target.customItem;
      setSettings((prev) => ({
        ...prev,
        sceneId: target.id,
        primaryColor: item.primaryColor ?? prev.primaryColor,
        secondaryColor: item.secondaryColor ?? prev.secondaryColor,
        tertiaryColor: item.tertiaryColor ?? prev.tertiaryColor,
        bgBaseColor: item.bgBaseColor ?? prev.bgBaseColor,
        multiColorCycle: item.multiColorCycle ?? prev.multiColorCycle,
        speed: item.speed ?? prev.speed,
        objectCount: item.objectCount ?? prev.objectCount,
        objectSize: item.objectSize ?? prev.objectSize,
        glowIntensity: item.glowIntensity ?? prev.glowIntensity,
      }));
    } else {
      update('sceneId', target.id);
    }
  };

  const handlePresetDialChange = (idxFloat: number) => {
    const idx = Math.min(
      COLOR_PRESETS.length - 1,
      Math.max(0, Math.round(idxFloat))
    );
    const preset = COLOR_PRESETS[idx];
    if (!preset) return;
    setSettings((prev) => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      tertiaryColor: preset.tertiary,
      bgBaseColor: preset.bgBase,
      multiColorCycle: false,
    }));
  };

  const handleSaveCurrentAsCustom = () => {
    const activeBuiltIn: BuiltInSceneId = settings.sceneId.startsWith('custom:')
      ? customBackgrounds.find((c) => c.id === settings.sceneId)?.baseSceneId ??
        'connected-alloy-mesh'
      : (settings.sceneId as BuiltInSceneId);

    const id = `custom:${Date.now()}`;
    const trimmed = newName.trim();
    const item: CustomBackground = {
      id,
      name: trimmed || `Custom ${customBackgrounds.length + 1}`,
      kind: 'preset',
      baseSceneId: activeBuiltIn,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      tertiaryColor: settings.tertiaryColor,
      bgBaseColor: settings.bgBaseColor,
      multiColorCycle: settings.multiColorCycle,
      speed: settings.speed,
      objectCount: settings.objectCount,
      objectSize: settings.objectSize,
      glowIntensity: settings.glowIntensity,
    };

    setCustomBackgrounds((prev) => [...prev, item]);
    update('sceneId', id as SceneId);
    setNewName('');
    setShowAddPanel(false);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const label = newName.trim() || file.name.replace(/\.[^.]+$/, '').slice(0, 22);
    const id = `custom:${Date.now()}`;

    const finishAdd = (url: string) => {
      const item: CustomBackground = {
        id,
        name: label,
        kind: 'media',
        mediaUrl: url,
        mediaType: isVideo ? 'video' : 'image',
      };
      setCustomBackgrounds((prev) => [...prev, item]);
      update('sceneId', id as SceneId);
      setNewName('');
      setShowAddPanel(false);
    };

    if (!isVideo && file.size < 2.5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          finishAdd(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      finishAdd(URL.createObjectURL(file));
    }

    e.target.value = '';
  };

  const handleRemoveCustom = (id: string) => {
    setCustomBackgrounds((prev) => prev.filter((c) => c.id !== id));
    setSettings((prev) =>
      prev.sceneId === id ? { ...prev, sceneId: DEFAULT_SETTINGS.sceneId } : prev
    );
  };

  const copyEmbedUrl = async () => {
    const resolvedScene = settings.sceneId.startsWith('custom:')
      ? customBackgrounds.find((c) => c.id === settings.sceneId)?.baseSceneId ??
        'connected-alloy-mesh'
      : settings.sceneId;

    const params = new URLSearchParams({
      scene: resolvedScene,
      c1: settings.primaryColor,
      c2: settings.secondaryColor,
      c3: settings.tertiaryColor,
      bg: settings.bgBaseColor,
      cycle: settings.multiColorCycle ? '1' : '0',
      speed: settings.speed.toFixed(2),
      count: settings.objectCount.toFixed(2),
      size: settings.objectSize.toFixed(2),
      glow: settings.glowIntensity.toFixed(2),
      dim: settings.scrimOpacity.toFixed(2),
      embed: '1',
    });
    const url = `${window.location.origin}/?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1800);
    } catch {
      // Clipboard fallback
    }
  };

  const showControls = !initial.isEmbed && !hideControls;

  return (
    <div className="absolute inset-0 overflow-hidden select-none pointer-events-none">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full block pointer-events-none select-none"
      />

      {showControls && (
        <>
          {open && (
            <aside
              aria-label="Background rotary console"
              className="absolute bottom-20 right-4 z-40 w-88 sm:w-[404px] max-w-[calc(100vw-2.5rem)] max-h-[calc(100vh-9rem)] overflow-y-auto rounded-xl border border-cyan-700/60 bg-[#06090f]/95 backdrop-blur-2xl p-4 shadow-2xl text-slate-200 pointer-events-auto"
            >
              <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-slate-800/80">
                <div>
                  <h2 className="text-sm font-semibold text-white">Rotary Console</h2>
                  <p className="text-[11px] text-slate-400">Turn or scroll any dial</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => update('paused', !settings.paused)}
                    aria-label={settings.paused ? 'Resume background' : 'Pause background'}
                    className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 hover:bg-slate-800 text-xs text-slate-200 transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400"
                  >
                    {settings.paused ? (
                      <Play className="w-3.5 h-3.5" />
                    ) : (
                      <Pause className="w-3.5 h-3.5" />
                    )}
                    <span>{settings.paused ? 'Play' : 'Pause'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close settings"
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium text-slate-400">
                      {activeSceneMeta.name} · {activeSceneMeta.subtitle}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {activeSceneMeta.isCustom && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCustom(activeSceneMeta.id)}
                          aria-label={`Delete ${activeSceneMeta.name}`}
                          className="h-6 w-6 inline-flex items-center justify-center rounded border border-slate-800 text-slate-400 hover:text-rose-300 hover:border-rose-500/40 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowAddPanel((prev) => !prev)}
                        className={`h-6 px-2 inline-flex items-center gap-1 rounded border text-[11px] transition-colors ${
                          showAddPanel
                            ? 'border-cyan-400/70 bg-cyan-500/20 text-cyan-100'
                            : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {showAddPanel && (
                    <div className="mb-3 p-2.5 rounded-lg border border-slate-700/80 bg-slate-900/85 space-y-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Background name (optional)"
                        maxLength={32}
                        className="w-full h-8 px-2.5 rounded-md border border-slate-700 bg-slate-950 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-8 px-2 inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-700 bg-slate-950 hover:bg-slate-800 text-[11px] font-medium text-slate-200 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Media</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveCurrentAsCustom}
                          className="h-8 px-2 inline-flex items-center justify-center gap-1.5 rounded-md bg-cyan-500/20 border border-cyan-400/50 hover:bg-cyan-500/30 text-[11px] font-medium text-cyan-100 transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Current</span>
                        </button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 justify-items-center pt-1">
                    <RotaryDial
                      label="Background"
                      valueText={`${activeSceneIdx + 1} / ${allScenes.length}`}
                      min={0}
                      max={Math.max(1, allScenes.length - 1)}
                      step={1}
                      value={activeSceneIdx}
                      onChange={handleSceneDialChange}
                      mode="detent"
                      detentCount={allScenes.length}
                      accentColor={settings.primaryColor}
                      size={80}
                    />
                    <RotaryDial
                      label="Palette"
                      valueText={COLOR_PRESETS[activePresetIdx]?.name ?? 'Custom'}
                      min={0}
                      max={COLOR_PRESETS.length - 1}
                      step={1}
                      value={activePresetIdx}
                      onChange={handlePresetDialChange}
                      mode="detent"
                      detentCount={COLOR_PRESETS.length}
                      accentColor={settings.secondaryColor}
                      size={80}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-800/70">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings.autoCycleScenes}
                      onClick={() => update('autoCycleScenes', !settings.autoCycleScenes)}
                      className={`flex-1 h-7 rounded-md border text-[11px] font-medium transition-colors ${
                        settings.autoCycleScenes
                          ? 'border-cyan-400/70 bg-cyan-500/15 text-cyan-200'
                          : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Auto-Cycle {settings.autoCycleScenes ? 'On' : 'Off'}
                    </button>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings.multiColorCycle}
                      onClick={() => update('multiColorCycle', !settings.multiColorCycle)}
                      className={`flex-1 h-7 rounded-md border text-[11px] font-medium transition-colors ${
                        settings.multiColorCycle
                          ? 'border-cyan-400/70 bg-cyan-500/15 text-cyan-200'
                          : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Color Shift {settings.multiColorCycle ? 'On' : 'Off'}
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="text-[11px] font-medium text-slate-400 mb-2.5">
                    Color Dials
                  </div>
                  <div className="grid grid-cols-4 gap-2 justify-items-center">
                    <RotaryDial
                      label="Color 1"
                      valueText={settings.primaryColor.toUpperCase()}
                      min={0}
                      max={360}
                      step={1}
                      value={hexToHue(settings.primaryColor)}
                      onChange={(hue) =>
                        setSettings((prev) => ({
                          ...prev,
                          primaryColor: hueToHex(hue, 0.65, 0.66),
                          multiColorCycle: false,
                        }))
                      }
                      mode="hue"
                      accentColor={settings.primaryColor}
                      size={64}
                    />
                    <RotaryDial
                      label="Color 2"
                      valueText={settings.secondaryColor.toUpperCase()}
                      min={0}
                      max={360}
                      step={1}
                      value={hexToHue(settings.secondaryColor)}
                      onChange={(hue) =>
                        setSettings((prev) => ({
                          ...prev,
                          secondaryColor: hueToHex(hue, 0.68, 0.58),
                          multiColorCycle: false,
                        }))
                      }
                      mode="hue"
                      accentColor={settings.secondaryColor}
                      size={64}
                    />
                    <RotaryDial
                      label="Color 3"
                      valueText={settings.tertiaryColor.toUpperCase()}
                      min={0}
                      max={360}
                      step={1}
                      value={hexToHue(settings.tertiaryColor)}
                      onChange={(hue) =>
                        setSettings((prev) => ({
                          ...prev,
                          tertiaryColor: hueToHex(hue, 0.36, 0.42),
                          multiColorCycle: false,
                        }))
                      }
                      mode="hue"
                      accentColor={settings.tertiaryColor}
                      size={64}
                    />
                    <RotaryDial
                      label="Backdrop"
                      valueText={BACKDROP_STEPS[activeBackdropIdx]?.name ?? 'Custom'}
                      min={0}
                      max={BACKDROP_STEPS.length - 1}
                      step={1}
                      value={activeBackdropIdx}
                      onChange={(idxFloat) => {
                        const idx = Math.min(
                          BACKDROP_STEPS.length - 1,
                          Math.max(0, Math.round(idxFloat))
                        );
                        update('bgBaseColor', BACKDROP_STEPS[idx].hex);
                      }}
                      mode="detent"
                      detentCount={BACKDROP_STEPS.length}
                      accentColor="#94a3b8"
                      size={64}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80">
                  <div className="text-[11px] font-medium text-slate-400 mb-2.5">
                    Motion & Surface Dials
                  </div>
                  <div className="grid grid-cols-3 gap-y-3 gap-x-2 justify-items-center">
                    <RotaryDial
                      label="Speed"
                      valueText={`${settings.speed.toFixed(2)}x`}
                      min={0.1}
                      max={3.0}
                      step={0.05}
                      value={settings.speed}
                      onChange={(v) => update('speed', v)}
                      accentColor="#22d3ee"
                      size={66}
                    />
                    <RotaryDial
                      label="Density"
                      valueText={`${Math.round(settings.objectCount * 100)}%`}
                      min={0.25}
                      max={2.0}
                      step={0.05}
                      value={settings.objectCount}
                      onChange={(v) => update('objectCount', v)}
                      accentColor="#22d3ee"
                      size={66}
                    />
                    <RotaryDial
                      label="Scale"
                      valueText={`${settings.objectSize.toFixed(2)}x`}
                      min={0.5}
                      max={1.8}
                      step={0.05}
                      value={settings.objectSize}
                      onChange={(v) => update('objectSize', v)}
                      accentColor="#22d3ee"
                      size={66}
                    />
                    <RotaryDial
                      label="Sheen"
                      valueText={`${Math.round(settings.glowIntensity * 100)}%`}
                      min={0.1}
                      max={1.5}
                      step={0.05}
                      value={settings.glowIntensity}
                      onChange={(v) => update('glowIntensity', v)}
                      accentColor="#d4a24c"
                      size={66}
                    />
                    <RotaryDial
                      label="Dimmer"
                      valueText={`${Math.round(settings.scrimOpacity * 100)}%`}
                      min={0}
                      max={0.8}
                      step={0.02}
                      value={settings.scrimOpacity}
                      onChange={(v) => update('scrimOpacity', v)}
                      accentColor="#94a3b8"
                      size={66}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <a
                    href="/Leeway Agent VT Background.html"
                    download="Leeway Agent VT Background.html"
                    className="flex-1 h-9 px-2.5 inline-flex items-center justify-center gap-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/50 hover:bg-cyan-500/30 text-xs font-medium text-cyan-100 transition-colors whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download HTML</span>
                  </a>

                  <button
                    type="button"
                    onClick={copyEmbedUrl}
                    className="h-9 px-2.5 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-colors whitespace-nowrap"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Copied' : 'URL'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings(DEFAULT_SETTINGS)}
                    aria-label="Reset settings"
                    className="h-9 px-2.5 inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-colors whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </aside>
          )}

          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Change Background"
            title="Change Background"
            aria-expanded={open}
            className="absolute bottom-4 right-4 z-40 pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-400/50 bg-[#07131f]/90 hover:bg-[#0c2238] hover:border-cyan-300 text-cyan-300 hover:text-white shadow-[0_4px_16px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all text-xs font-semibold select-none group"
          >
            <Palette size={14} className="group-hover:rotate-12 transition-transform" />
            <span>Background</span>
          </button>
        </>
      )}
    </div>
  );
}

export default LeewayAgentVTBackground;
