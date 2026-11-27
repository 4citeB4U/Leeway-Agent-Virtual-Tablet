<!--
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.DOCS.TESTING
TAG: LEEWAY.DOCS.QA.STRATEGY

5WH:
WHAT = Testing and validation guide for KineticGlyph Studio.
WHY = Document unit tests, type checks, production build verification, and negative fail-closed tests.
WHO = Leeway Innovations — KineticGlyph Studio
WHERE = TESTING.md
WHEN = 2026-11-27
HOW = References real npm scripts and tests/segmenter.test.ts assertions.

LICENSE = Apache-2.0
-->

# Testing & Validation

## Automated Test Suite

Run the unit and integration test suite via:

```bash
npm test
```

### Covered Scenarios (`tests/segmenter.test.ts`)
1. **Zero-Wobble Geometric Centering & Circuit Trace Waypoints**: Verifies outer-extrema geometric center resists asymmetrical cutout shift on circular rotors, and verifies `tracePoints` extraction on circuit clusters.
2. **Interior Cavity Sub-Layer Detection**: Verifies dark/high-contrast interior display regions inside device bezels are detected and preserved with inner `bbox` bounds.
3. **Opaque Backdrop Flood-Fill**: Verifies solid dark-slate backdrop removal and accurate `gauge` (`gauge-fluid`) classification for vertical meter bars.
4. **Full Export Parity**: Validates HTML/CSS/JS (ratchet, radar sub-mask, circuit dash/tracers, hover/active choreography attributes, and `aria-pressed` toggleable buttons), Bodymovin `v5.9.0` Lottie JSON (including `ty: 4` tracer spark layers, phase `st`, and easing curves), and SMIL Animated SVG (`<clipPath>`, `<animateMotion>`, `stroke-dashoffset`).
5. **Logo & Favicon Target Modes (`src/engine/faviconCompiler.ts`, `src/engine/exporters.ts`)**: Validates Logo Mode container rendering (`kg-logo-mark`, `kg-logo-ring`, entrance reveals, bezel-free SVG), small-size favicon layer simplification (`selectSimplifiedFaviconLayers`), valid binary Microsoft `.ICO` packing (`buildMultiResolutionIcoBytes`), `site.webmanifest` output, and dynamic tab controller snippet with browser compatibility disclosures.
6. **Fail-Closed Formula Adapter & Receipt Digests**: Confirms `inspectFormulaFabricAuthority()` returns `BLOCKED_NO_VERIFIED_FORMULA_CAPABILITY` when unconfigured, and `createExecutionReceipt()` generates deterministic digests.

## Type Checking & Build Validation

```bash
npm run lint
npm run build
```
