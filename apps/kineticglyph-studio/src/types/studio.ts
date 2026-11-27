/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.STUDIO.TYPES
TAG: LEEWAY.STUDIO.DOMAIN.TYPES

5WH:
WHAT = Canonical TypeScript domain types for pixel segmentation, interior sub-layer detection, composable procedural animations, multi-state choreography, target modes (Button, Logo, Favicon), exports, and LeeWay receipts.
WHY = Enforce strict type contracts across segmentation, multi-mode stage rendering, granular choreography controls, code generation, and Formula integration.
WHO = Leeway Innovations — KineticGlyph Studio Core
WHERE = src/types/studio.ts
WHEN = 2026-11-27
HOW = Imported by segmentation engine, favicon compiler, UI components, exporters, and test suites.

LICENSE = Apache-2.0
*/

export type LayerRole = 'gear' | 'screen' | 'gauge' | 'circuit' | 'chassis';

export type TargetMode = 'button' | 'logo' | 'favicon';

export type LogoRevealStyle = 'none' | 'fade-scale' | 'radial-unfold';

export type AnimationMode =
  | 'rotate-cw'
  | 'rotate-ccw'
  | 'gear-ratchet'
  | 'fan-spin'
  | 'screen-code'
  | 'screen-oscilloscope'
  | 'screen-radar'
  | 'gauge-needle'
  | 'gauge-fluid'
  | 'circuit-pulse'
  | 'ambient-breathe'
  | 'static';

export type EasingCurve =
  | 'linear'
  | 'ease-in-out'
  | 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  | 'steps(12, end)';

export type PivotAnchorPreset =
  | 'geometric-center'
  | 'centroid'
  | 'bottom-center'
  | 'top-center'
  | 'left-center'
  | 'right-center'
  | 'custom';

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface InteriorSubRegion {
  /** Tight bounding box of the detected interior screen/cavity inside a bezel */
  bbox: BoundingBox;
  /** Full 256x256 alpha mask isolating only the interior dark/high-contrast region */
  maskUrl: string;
  /** Fraction of parent area covered by the interior region */
  coverageRatio: number;
}

export interface TracePoint {
  x: number;
  y: number;
}

export interface LayerMetrics {
  area: number;
  perimeter: number;
  circularity: number;
  fillRatio: number;
  aspectRatio: number;
  radialVariance: number;
  dominantColor: string;
  centroid: { x: number; y: number };
  geometricCenter: { x: number; y: number };
}

export interface StateChoreography {
  idle: {
    enabled: boolean;
    speedMultiplier: number;
    glowIntensity: number;
    particleRate: number;
  };
  hover: {
    speedMultiplier: number;
    glowIntensity: number;
    ratchetBoost: boolean;
    fanBlur: boolean;
    energySurge: boolean;
  };
  active: {
    pressScale: number;
    glowBurst: number;
    dischargePulse: boolean;
    reverseOnClick: boolean;
  };
}

export interface SegmentedLayer {
  id: string;
  name: string;
  role: LayerRole;
  animationMode: AnimationMode;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  /** Full 256x256 aligned transparent RGBA sprite data URL */
  fullSpriteUrl: string;
  /** Tightly cropped RGBA sprite data URL (used in Lottie assets and thumbnails) */
  croppedSpriteUrl: string;
  /** Full 256x256 alpha mask data URL for CSS mask-image pulse sweeps */
  maskUrl: string;
  bbox: BoundingBox;
  /** Optional detected interior cavity inside device bezel or thermometer frame */
  interiorSubRegion: InteriorSubRegion | null;
  /** Extracted skeleton waypoints for circuit tracer particles and SVG dash paths */
  tracePoints: TracePoint[];
  /** Selected anchor strategy */
  pivotPreset: PivotAnchorPreset;
  /** Normalized pivot (0..100%) relative to the 256x256 canvas */
  pivotPercent: { x: number; y: number };
  /** Speed multiplier (0.2 to 4.0) */
  speed: number;
  /** Continuous rotation rate in revolutions per minute for mechanical layers */
  rpm: number;
  /** Motion amplitude in degrees (for gauges/ratchet) or intensity (0.1 to 2.0) */
  amplitude: number;
  /** Gauge oscillation minimum angle in degrees */
  minAngle: number;
  /** Gauge oscillation maximum angle in degrees */
  maxAngle: number;
  /** Phase offset delay in milliseconds (0..2000) */
  phaseDelayMs: number;
  /** Animation timing function */
  easing: EasingCurve;
  /** Glow accent hex color derived from layer dominant hue */
  glowColor: string;
  /** Multi-state choreography rules for Idle, Hover, and Active Click */
  choreography: StateChoreography;
  metrics: LayerMetrics;
}

export interface SegmentationOptions {
  /** Color Euclidean threshold for grouping adjacent pixels (12 - 72) */
  colorTolerance: number;
  /** Minimum pixel count for an independent layer (40 - 800) */
  minRegionArea: number;
  /** Backdrop color tolerance when removing non-transparent solid backgrounds (8 - 64) */
  backdropTolerance: number;
  /** Strategy for isolating foreground from background */
  backdropMode: 'auto' | 'alpha-only' | 'flood-border';
}

export type ButtonShape = 'squircle' | 'rounded' | 'circle' | 'bezel';

export interface ButtonConfig {
  targetMode: TargetMode;
  label: string;
  ariaLabel: string;
  shape: ButtonShape;
  sizePx: number;
  hoverSpeedMultiplier: number;
  hoverGlowIntensity: number;
  pressDepthPx: number;
  showCaption: boolean;
  surfaceTint: string;
  accentColor: string;
  reducedMotion: boolean;
  /** Button Mode: supports stateful aria-pressed toggle mode */
  toggleable: boolean;
  /** Logo Mode: entrance reveal animation style */
  logoReveal: LogoRevealStyle;
  /** Logo Mode: active/loading orbital state */
  logoLoading: boolean;
  /** Favicon Mode: contrast boost applied at small tab sizes (1.0 - 1.8) */
  faviconContrastBoost: number;
  /** Favicon Mode: minimum pixel area retained when simplifying for 16x16 / 32x32 legibility */
  faviconSimplifyMinArea: number;
}

export const FAVICON_TARGET_SIZES = [16, 32, 48, 180, 192, 512] as const;
export type FaviconSize = (typeof FAVICON_TARGET_SIZES)[number];

export interface FaviconRenderedAsset {
  size: FaviconSize;
  dataUrl: string;
  roleLabel: string;
}

export type ExportFormat = 'html' | 'lottie' | 'svg' | 'favicon-kit';

export type WorkspaceTab = 'studio' | 'inspector' | 'export' | 'governance';

export type FormulaAuthorityState =
  | 'AVAILABLE'
  | 'VERIFIED'
  | 'BLOCKED_NO_VERIFIED_FORMULA_CAPABILITY';

export interface FormulaBridgeStatus {
  contractId: string;
  schemaVersion: string;
  endpointConfigured: boolean;
  endpointUrl: string | null;
  authorityState: FormulaAuthorityState;
  lastCheckedAt: string | null;
  message: string;
}

export interface ExecutionReceipt {
  id: string;
  timestamp: string;
  action: 'IMAGE_LOADED' | 'SEGMENTATION_RUN' | 'LAYER_UPDATED' | 'EXPORT_GENERATED' | 'FORMULA_CHECK';
  summary: string;
  sha256: string;
  details: Record<string, string | number | boolean>;
}
