<!--
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.DOCS.CHANGELOG
TAG: LEEWAY.DOCS.RELEASE.HISTORY

5WH:
WHAT = Chronological changelog for KineticGlyph Studio.
WHY = Record initial release and animation engine / layer synthesis upgrades accurately.
WHO = Leeway Innovations — KineticGlyph Studio
WHERE = CHANGELOG.md
WHEN = 2026-11-27
HOW = Standard Keep-a-Changelog Markdown format.

LICENSE = Apache-2.0
-->

# Changelog

## [1.2.0] - 2026-11-27

### Added
- **Multi-Mode Target Output (`src/types/studio.ts`, `src/components/ButtonStage.tsx`)**: Added Target Mode selector supporting **Interactive Button Mode** (idle, hover, focus-visible, active/press, and optional `aria-pressed` toggle state), **Logo Mode** (entrance reveals `fade-scale` / `radial-unfold`, continuous ambient motion, and loading orbital ring state), and **Favicon & Web Icon Mode**.
- **Favicon & Web Icon Compiler (`src/engine/faviconCompiler.ts`, `src/components/ExportView.tsx`)**: Added small-size layer simplification (`selectSimplifiedFaviconLayers`), contrast-boosted legibility preview across `16×16`, `32×32`, `48×48`, `180×180`, `192×192`, and `512×512`px, simulated browser tab preview, binary multi-resolution `.ico` archive packing (`buildMultiResolutionIcoBytes`), `site.webmanifest` & `<link>` static fallback tags, and throttled Canvas `<link rel="icon">` dynamic controller export with explicit browser-support disclosures.
- **Collapsible Workbench Sidebars (`src/components/SourcePanel.tsx`, `src/components/LayerPanel.tsx`)**: Added desktop edge-rail collapse/expand toggles for both source and layer hierarchy sidebars.

## [1.1.0] - 2026-11-27

### Added
- **True Pivot & Sub-Element Detection (`src/engine/segmenter.ts`)**: Added octant-extrema geometric circle centering for wobble-free rotor/gear spins, interior high-contrast/enclosed cavity detection (`interiorSubRegion`) for masked screens and fluid gauges, and ordered trace skeleton waypoint extraction (`tracePoints`) for circuitry.
- **Expanded Procedural Animation Library (`src/types/studio.ts`, `src/components/ButtonStage.tsx`, `src/index.css`)**: Added RPM-calibrated rotation, gear micro-ratchet (`steps(12, end)`), high-RPM fan spin with hover motion blur, masked scrolling code, live EKG/oscilloscope waveforms, radar sweeps, min/max angle needle sweeps, rising/falling fluid column fills, and SVG `stroke-dashoffset` + `<animateMotion>` spark tracers.
- **Granular Choreography Controls (`src/components/LayerInspectorView.tsx`, `src/components/LayerPanel.tsx`)**: Added independent controls for Animation Type, RPM, Speed Scale, Min/Max Angle, Phase Delay, Easing Curve, Transform Origin Anchor presets, and multi-state Idle / Hover / Active Click choreography.
- **Full Export Parity (`src/engine/exporters.ts`)**: Upgraded HTML/CSS/JS, Lottie v5.9.0 JSON (including `ty: 4` tracer spark layers), and Animated SVG (`<clipPath>`, `<animateMotion>`, `stroke-dashoffset`) to match live stage behavior.

## [1.0.0] - 2026-11-27

### Added
- Initial KineticGlyph Studio segmentation workbench, WAAPI preview stage, HTML/Lottie/SVG exporters, `LEEWAY_FORMULA_FABRIC_CLIENT` fail-closed adapter, SHA-256 execution receipts, and LeeWay compliance documentation.

### Removed
- Removed unauthorized `@google/genai` dependency, `GEMINI_API_KEY` `.env.example` entry, and development-platform metadata/branding.
