<!--
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.DOCS.README
TAG: LEEWAY.DOCS.ROOT.CONTRACT

5WH:
WHAT = Official project README.md satisfying all 25 mandatory LeeWay documentation sections.
WHY = Document architecture, commands, interfaces, Formula status, and verification boundaries accurately.
WHO = Leeway Innovations — KineticGlyph Studio
WHERE = README.md
WHEN = 2026-11-27
HOW = Physical Markdown document maintained in the project root.

LICENSE = Apache-2.0
-->

# KineticGlyph Studio

**Powered by Leeway Innovations — A Leeway Industries Product**

---

## 1. Official Project Name

**KineticGlyph Studio** (`kineticglyph-studio` v1.2.0) — Multi-Mode Interactive Button, Logo & Favicon Workbench.

## 2. Project Purpose and Operational Responsibilities

KineticGlyph Studio converts static raster or SVG technical icons (such as mechanical gears, telemetry screens, thermometers, dial gauges, and circuit trace layouts) into living UI assets across three target output modes:

1. **Asset Ingestion**: Accepts user-uploaded `PNG`, `JPG`, `WebP`, and `SVG` files plus clearly labeled Development Reference Fixtures.
2. **Deterministic Pixel Segmentation**: Runs client-side Canvas 2D foreground isolation, Union-Find 8-connectivity color clustering, small-island parent absorption, interior dark cavity detection (`interiorSubRegion`), ordered circuit trace extraction (`tracePoints`), and geometric feature classification (`gear`, `screen`, `gauge`, `circuit`, `chassis`).
3. **Procedural Micro-Animations**: Executes independent Web Animations API (`WAAPI`) and compositor-only CSS transforms per extracted layer (zero-wobble geometric centroid rotation, gear micro-ratchet, masked scrolling code/EKG/radar screens, oscillating gauge needles/fluid fills, and circuit light/spark tracers).
4. **Three Target Modes & Deterministic Exports**:
   - **Interactive Button Mode**: Accessible `<button>` with idle, hover, focus-visible, active/press, and optional `aria-pressed` toggle states.
   - **Logo Mode**: Animated brand/mark container supporting entrance reveals (`none`, `fade-scale`, `radial-unfold`), continuous ambient motion, and active/loading orbital ring state.
   - **Favicon & Web Icon Mode**: Small-size simplification and contrast-boosted legibility preview (`16×16`, `32×32`, `48×48`, `180×180`, `192×192`, `512×512`), simulated browser tab preview, dynamic `<link rel="icon">` Canvas controller snippet, multi-resolution `.ico` builder, static PNG/SVG fallbacks, and `site.webmanifest` generation with explicit browser-support disclosures.

## 3. Creator and Organizational Authority

- **Creator**: Leonard J. Lee
- **Organization**: Leeway Innovations — A Leeway Industries Product
- **Governance Authority**: LeeWay Standards (`https://github.com/4citeB4U/LeeWay-Standards`) and LeeWay Agent Skills (`https://github.com/4citeB4U/LeeWay-Agent-Skills`).

## 4. LeeWay Standards Compliance Requirements

This repository adheres to LeeWay Permanent Engineering Rules (`R01–R25`) and the LeeWay Memory Authority Contract (`MEMORY.md`):
- **R23 Source Headers**: All governed source, test, stylesheet, and documentation files include the canonical `LEEWAY HEADER` with `REGION`, `TAG`, `5WH`, and `LICENSE`.
- **Zero Prohibited Development-Platform Dependencies**: Contains zero `@google/genai`, `@google/generative-ai`, `GEMINI_API_KEY`, `GOOGLE_API_KEY`, or external AI cloud fallback calls.
- **No Fabricated Telemetry or Formula Claims**: Reports unconfigured external integrations honestly as `BLOCKED_NO_VERIFIED_FORMULA_CAPABILITY`.
- **Execution Receipts (R18)**: Computes SHA-256 digests via Web Crypto exclusively for user-triggered actions executed during the session.

## 5. Application Architecture

- **Frontend Framework**: React 19 + TypeScript 7 + Vite 8 + Tailwind CSS v4.
- **Segmentation Engine (`src/engine/segmenter.ts`)**: Normalizes uploaded images onto a `256×256` RGBA grid, removes transparent or solid borders via flood-fill, clusters adjacent pixels by Euclidean RGB tolerance, detects enclosed interior cavities, extracts ordered trace waypoints, and computes geometric metrics.
- **Favicon & Web Icon Compiler (`src/engine/faviconCompiler.ts`)**: Simplifies fine fragments for `<= 48px` tab icons, renders contrast-boosted raster matrices (`16..512px`), builds valid multi-resolution binary `.ico` archives, generates `site.webmanifest` and `<link>` fallback tags, and emits a throttled dynamic `<link rel="icon">` controller snippet.
- **Export Compiler (`src/engine/exporters.ts`)**: Compiles active layers and `ButtonConfig` into Target-Mode-aware HTML/CSS/JS, Bodymovin v5.9.0 Lottie JSON, SMIL Animated SVG, and complete Web Icon / Favicon bundles.
- **LeeWay Adapters (`src/leeway/`)**: Implements `LEEWAY_FORMULA_FABRIC_CLIENT` (`formulaAdapter.ts`) and SHA-256 receipt logging (`receiptLedger.ts`).

## 6. Actual Directory Structure

```text
.
├── .env.example
├── .gitignore
├── ARCHITECTURE.md
├── CHANGELOG.md
├── INTEGRATION.md
├── MEMORY.md
├── README.md
├── SECURITY.md
├── TESTING.md
├── index.html
├── metadata.json
├── package.json
├── bun.lock
├── tsconfig.json
├── vite.config.ts
├── public/
│   └── leeway-standards-logo.png
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── components/
│   │   ├── ButtonStage.tsx
│   │   ├── ExportView.tsx
│   │   ├── GovernanceView.tsx
│   │   ├── LayerInspectorView.tsx
│   │   ├── LayerPanel.tsx
│   │   ├── SourcePanel.tsx
│   │   └── TopBar.tsx
│   ├── engine/
│   │   ├── exporters.ts
│   │   ├── faviconCompiler.ts
│   │   ├── segmenter.ts
│   │   └── starterFixtures.ts
│   ├── leeway/
│   │   ├── formulaAdapter.ts
│   │   └── receiptLedger.ts
│   └── types/
│       └── studio.ts
└── tests/
    └── segmenter.test.ts
```

## 7. Installation Prerequisites

- **Node.js**: `>= 20.0.0` (verified on `v22.23.5`)
- **npm**: `>= 10.0.0`
- **Modern Browser**: Chromium, Firefox, Safari, or Edge supporting HTML5 Canvas 2D, Web Animations API (`element.animate`), and Web Crypto (`crypto.subtle`).

## 8. Complete Installation Instructions

```bash
git clone <repository-url>
cd kineticglyph-studio
npm install
```

## 9. Configuration Instructions

Copy `.env.example` to `.env` if custom runtime configuration is needed:

```bash
cp .env.example .env
```

By default, KineticGlyph Studio operates offline/client-side without requiring any API keys.

## 10. Environment Variable Documentation

| Variable | Required | Default | Purpose |
| :--- | :--- | :--- | :--- |
| `PORT` | No | `3000` | Port used by local Vite development server |
| `APP_URL` | No | `http://localhost:3000` | Public base URL metadata if hosted |
| `VITE_LEEWAY_FORMULA_FABRIC_URL` | No | `""` | Base URL for an authorized live LeeWay Formula Fabric `/formula/v1` service; when unset, adapter fails closed |
| `LEEWAY_MEMORY_CONTRACT_PATH` | No | `./MEMORY.md` | Path to canonical byte-identical `MEMORY.md` contract |

## 11. Local Development Commands

```bash
npm run dev
```

Starts the Vite development server on `http://0.0.0.0:3000`.

## 12. Production Build Commands

```bash
npm run build
npm run preview
```

Outputs compiled static production bundle into `dist/`.

## 13. Deployment Instructions

1. Run `npm run lint`, `npm test`, and `npm run build`.
2. Deploy the generated `dist/` directory to any static web host, CDN, or container nginx/Express static server.
3. Ensure `public/leeway-standards-logo.png` is served at `/leeway-standards-logo.png` (handled automatically by Vite build).

## 14. Supported Operating Systems

- **Desktop**: Windows 10/11, Linux (x86_64/arm64), macOS (Intel/Apple Silicon) via supported browsers.
- **Mobile**: Android and iOS browsers supporting Canvas 2D and Web Animations API (responsive layout collapses sidebars gracefully; desktop `>=1280px` recommended for studio editing).

## 15. Actual API and Interface Contracts

- **Internal Engine Contracts**:
  - `segmentImageData(data, width, height, options)` in `src/engine/segmenter.ts`
  - `segmentImageFromUrl(src, options)` in `src/engine/segmenter.ts`
  - `selectSimplifiedFaviconLayers(layers, minArea)` / `renderFaviconMatrixAssets(layers, config)` / `buildMultiResolutionIcoBytes(frames)` / `generateWebManifestJson(appName)` in `src/engine/faviconCompiler.ts`
  - `generateHtmlButtonExport(layers, config)` / `generateHtmlLogoExport(layers, config)` / `generateLottieJsonExport(layers, config)` / `generateAnimatedSvgExport(layers, config)` / `generateFaviconKitExport(layers, config)` in `src/engine/exporters.ts`
- **External Formula Client Contract (`src/leeway/formulaAdapter.ts`)**:
  - Implements `LEEWAY_FORMULA_FABRIC_CLIENT` (`schemaVersion: "1.0.0"`), probing `GET {VITE_LEEWAY_FORMULA_FABRIC_URL}/authority` when configured.

## 16. LeeWay Formula Integration

The application includes the canonical `LEEWAY_FORMULA_FABRIC_CLIENT` adapter (`src/leeway/formulaAdapter.ts`) aligned with `config/formula-fabric-client-contract-v1.json` and `config/formula-fabric-api-v1.json`. When `VITE_LEEWAY_FORMULA_FABRIC_URL` is unconfigured or unreachable, the adapter fails closed and reports `BLOCKED_NO_VERIFIED_FORMULA_CAPABILITY` without fabricating Formula metrics or receipts.

## 17. Agent Lee and Runtime Integration

KineticGlyph Studio is a standalone studio tool. It does not instantiate a competing Agent Lee brain, Runtime control plane, or Veritas authority. Session actions record local execution receipts in memory (`src/leeway/receiptLedger.ts`) exportable as JSON.

## 18. Data Storage and Continuum Integration

All image processing occurs ephemerally in browser memory (`HTMLCanvasElement` + React state). No user images are uploaded to third-party servers. Persistent Continuum / Content Vault adapters are not provisioned in this standalone build (`NOT_EXECUTED`).

## 19. Authentication and Authorization

No user accounts or Creator privileges are exposed in this client-side studio build. When connected to a live Formula Fabric endpoint, authorization boundaries are enforced by the target Formula Fabric service.

## 20. Security and Privacy Boundaries

- Uploaded user images remain strictly local to the browser process.
- Exported HTML/SVG/Lottie packages contain zero third-party network scripts or trackers.
- See `SECURITY.md` for full details.

## 21. Testing and Validation Instructions

```bash
npm run lint
npm test
npm run build
```

See `TESTING.md` for test coverage details.

## 22. Troubleshooting Procedures

- **Too many tiny fragments after upload**: Increase `Min Region Area` (`180–350 px`) or increase `Color Tolerance` (`40–56`).
- **Opaque square background not removed**: Increase `Backdrop Tolerance` or switch `Backdrop Isolation` to `Solid Border Flood-Fill`.
- **Formula status displays `BLOCKED_NO_VERIFIED_FORMULA_CAPABILITY`**: Expected behavior when `VITE_LEEWAY_FORMULA_FABRIC_URL` is not configured.

## 23. Known Limitations and Incomplete Integrations

- `https://github.com/4citeB4U/LeeWay-Engineering` was inaccessible during environment inspection (private/unauthenticated GitHub error); any rules exclusive to that repository remain unverified.
- Live LeeWay Formula Fabric, Continuum storage, and independent Veritas certification servers are not provisioned in this environment.
- Raster pixel segmentation operates on `256×256` normalized bitmaps; photographic scenes with heavy gradients may require manual layer merging or tolerance tuning.

## 24. Evidence and Verification Status

- TypeScript check (`npm run lint`), unit/integration tests (`npm test`), production build (`npm run build`), and live browser verification are executed and reported accurately in the engineering report and `TESTING.md`.
- Independent Veritas verification is `NOT_EXECUTED` (no independent Veritas service provisioned).

## 25. Applicable Licensing and Ownership Information

- **License**: Apache-2.0
- **Ownership**: Leeway Innovations — A Leeway Industries Product. Official LeeWay Standards mark (`public/leeway-standards-logo.png`) preserved from canonical `LeeWay-Standards`.
