<!--
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.DOCS.ARCHITECTURE
TAG: LEEWAY.DOCS.SYSTEM.DESIGN

5WH:
WHAT = System architecture specification for KineticGlyph Studio.
WHY = Document module boundaries, pixel segmentation pipeline, WAAPI animation model, and LeeWay authority separation.
WHO = Leeway Innovations — KineticGlyph Studio
WHERE = ARCHITECTURE.md
WHEN = 2026-11-27
HOW = Markdown architectural reference matching actual source modules.

LICENSE = Apache-2.0
-->

# Architecture — KineticGlyph Studio

## 1. Layer Hierarchy & Authority Separation

KineticGlyph Studio operates strictly as an application-tier studio workbench within the LeeWay architectural hierarchy. It does not duplicate Root of Trust, LeeWay Runtime, Agent Lee, Formula engines, Veritas verification, or Continuum storage.

```text
[User Browser / Workbench UI]
   ├── SourcePanel.tsx          (File/SVG ingestion & segmentation options)
   ├── ButtonStage.tsx          (Live <button> WAAPI micro-animation preview)
   ├── LayerPanel.tsx           (Role override, speed, pivot, merge controls)
   ├── LayerInspectorView.tsx   (Geometric feature telemetry table)
   ├── ExportView.tsx           (HTML/CSS/JS, Lottie JSON, Animated SVG + Sandbox)
   └── GovernanceView.tsx       (MEMORY.md hash, Formula status, R18 Receipts)
          │
          ▼
[Deterministic Engine]
   ├── src/engine/segmenter.ts  (256x256 normalization, flood-fill backdrop, CCL, feature classifier)
   └── src/engine/exporters.ts  (Zero-dependency HTML5, Bodymovin v5.9.0, SMIL SVG compilers)
          │
          ▼
[LeeWay Governance Adapters]
   ├── src/leeway/formulaAdapter.ts  (LEEWAY_FORMULA_FABRIC_CLIENT v1.0.0 fail-closed client)
   └── src/leeway/receiptLedger.ts   (Web Crypto SHA-256 session execution receipts)
```

## 2. Pixel Segmentation Pipeline

1. **Normalization**: Inputs (`PNG`, `JPG`, `WebP`, `SVG`) are drawn aspect-preserved onto an offscreen `256×256` RGBA canvas.
2. **Backdrop Isolation**: If `< 8%` of pixels are transparent, median border color sampling + BFS flood-fill separates solid backdrops within `backdropTolerance`.
3. **8-Connectivity Color Clustering**: Union-Find groups adjacent foreground pixels whose Euclidean RGB distance `<= colorTolerance`.
4. **Small-Island Absorption**: Clusters smaller than `minRegionArea` (e.g., waveforms inside screens, center pins inside gears) are absorbed into their dominant adjacent parent component so sprites remain visually intact.
5. **Geometric Classification**:
   - `circularity = 4π * area / perimeter²`
   - `radialVariance = σ(edge_radii) / μ(edge_radii)`
   - `fillRatio = area / (bbox.w * bbox.h)`
   - `aspectRatio = max(w, h) / min(w, h)`

## 3. Procedural Animation Model

Instead of animating a flattened image, each extracted layer renders in its own GPU-composited container (`will-change: transform, filter, opacity`) driven by Web Animations API (`element.animate`). Hovering the outer `<button>` updates `animation.playbackRate` dynamically without resetting animation phase.
