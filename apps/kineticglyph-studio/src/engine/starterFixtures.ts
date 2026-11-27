/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.STUDIO.FIXTURES
TAG: LEEWAY.STUDIO.STARTER.ASSETS

5WH:
WHAT = Generates crisp starter technical icon fixtures (gear, telemetry screen, thermometer gauge, circuit paths) as SVG data URLs.
WHY = Provide immediate, clearly labeled development/demonstration fixtures before a user uploads custom raster or SVG icons.
WHO = Leeway Innovations — KineticGlyph Studio Fixtures
WHERE = src/engine/starterFixtures.ts
WHEN = 2026-11-27
HOW = Builds deterministic self-contained SVG strings encoded as data URLs for the segmentation pipeline.

LICENSE = Apache-2.0
*/

export interface StarterFixture {
  id: string;
  name: string;
  kind: 'Development Fixture';
  subtitle: string;
  dataUrl: string;
}

function encodeSvgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

function buildGearPath(cx: number, cy: number, outerR: number, innerR: number, teeth: number): string {
  const pts: string[] = [];
  const step = (Math.PI * 2) / (teeth * 2);
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.55;
    const r = i % 2 === 0 ? outerR : innerR;
    const x0 = cx + Math.cos(a0) * r;
    const y0 = cy + Math.sin(a0) * r;
    const x1 = cx + Math.cos(a1) * r;
    const y1 = cy + Math.sin(a1) * r;
    pts.push(`${i === 0 ? 'M' : 'L'}${x0.toFixed(1)},${y0.toFixed(1)}`);
    pts.push(`L${x1.toFixed(1)},${y1.toFixed(1)}`);
  }
  pts.push('Z');
  return pts.join(' ');
}

const REACTOR_CORE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <!-- Outer Circuit Traces -->
  <path d="M24 64 H68 L84 80 M24 192 H68 L84 176 M232 64 H188 L172 80 M232 192 H188 L172 176" fill="none" stroke="#38BDF8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="24" cy="64" r="6" fill="#38BDF8"/>
  <circle cx="24" cy="192" r="6" fill="#38BDF8"/>
  <circle cx="232" cy="64" r="6" fill="#38BDF8"/>
  <circle cx="232" cy="192" r="6" fill="#38BDF8"/>

  <!-- Central Mechanical Gear -->
  <path d="${buildGearPath(128, 128, 44, 34, 10)}" fill="#F59E0B" stroke="#78350F" stroke-width="2"/>
  <circle cx="128" cy="128" r="16" fill="#1E293B"/>
  <circle cx="128" cy="128" r="7" fill="#FBBF24"/>

  <!-- Top Telemetry Screen -->
  <rect x="78" y="22" width="100" height="44" rx="8" fill="#0F766E" stroke="#2DD4BF" stroke-width="3"/>
  <path d="M88 46 L102 46 L110 34 L120 56 L130 38 L138 46 L168 46" fill="none" stroke="#99F6E4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Right Thermometer / Gauge -->
  <rect x="196" y="88" width="24" height="80" rx="12" fill="#991B1B" stroke="#F87171" stroke-width="3"/>
  <circle cx="208" cy="156" r="9" fill="#EF4444"/>
  <rect x="204" y="106" width="8" height="46" rx="4" fill="#FCA5A5"/>

  <!-- Left Dial Gauge -->
  <circle cx="48" cy="128" r="24" fill="#312E81" stroke="#818CF8" stroke-width="3"/>
  <path d="M48 128 L61 114" stroke="#E0E7FF" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="48" cy="128" r="4" fill="#C7D2FE"/>

  <!-- Bottom Status Readout Bar -->
  <rect x="82" y="194" width="92" height="32" rx="6" fill="#1D4ED8" stroke="#60A5FA" stroke-width="2.5"/>
  <rect x="94" y="205" width="42" height="10" rx="2" fill="#BFDBFE"/>
  <circle cx="156" cy="210" r="5" fill="#34D399"/>
</svg>
`;

const TURBINE_NODE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <!-- Circuit Bus -->
  <path d="M128 18 V50 M128 206 V238 M18 128 H50 M206 128 H238" fill="none" stroke="#22D3EE" stroke-width="6" stroke-linecap="round"/>
  <path d="M44 44 L72 72 M212 44 L184 72 M44 212 L72 184 M212 212 L184 184" fill="none" stroke="#06B6D4" stroke-width="4" stroke-linecap="round"/>

  <!-- Outer Turbine Housing -->
  <circle cx="128" cy="128" r="64" fill="#1E293B" stroke="#475569" stroke-width="5"/>

  <!-- Rotating Turbine Rotor -->
  <path d="${buildGearPath(128, 128, 46, 28, 8)}" fill="#38BDF8"/>
  <circle cx="128" cy="128" r="14" fill="#0F172A"/>

  <!-- Top Left Oscilloscope Screen -->
  <rect x="20" y="20" width="64" height="38" rx="6" fill="#065F46" stroke="#34D399" stroke-width="2.5"/>
  <line x1="30" y1="34" x2="72" y2="34" stroke="#6EE7B7" stroke-width="3" stroke-linecap="round"/>
  <line x1="30" y1="45" x2="58" y2="45" stroke="#A7F3D0" stroke-width="3" stroke-linecap="round"/>

  <!-- Bottom Right Level Gauge -->
  <rect x="184" y="182" width="46" height="46" rx="8" fill="#7C2D12" stroke="#FB923C" stroke-width="2.5"/>
  <path d="M194 216 L207 200 L220 212" fill="none" stroke="#FED7AA" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const NEURAL_RELAY_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <!-- PCB Trace Network -->
  <path d="M26 96 H64 L78 110 M26 160 H64 L78 146 M230 96 H192 L178 110 M230 160 H192 L178 146" fill="none" stroke="#10B981" stroke-width="5" stroke-linecap="round"/>
  <circle cx="26" cy="96" r="5" fill="#34D399"/>
  <circle cx="26" cy="160" r="5" fill="#34D399"/>
  <circle cx="230" cy="96" r="5" fill="#34D399"/>
  <circle cx="230" cy="160" r="5" fill="#34D399"/>

  <!-- Center Display Screen -->
  <rect x="78" y="82" width="100" height="92" rx="12" fill="#1E3A8A" stroke="#60A5FA" stroke-width="3.5"/>
  <path d="M92 128 H108 L118 106 L130 148 L142 120 L150 128 H164" fill="none" stroke="#93C5FD" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Top Left Cog -->
  <path d="${buildGearPath(64, 48, 28, 20, 8)}" fill="#F59E0B"/>
  <circle cx="64" cy="48" r="8" fill="#0F172A"/>

  <!-- Top Right Cog -->
  <path d="${buildGearPath(192, 48, 28, 20, 8)}" fill="#EC4899"/>
  <circle cx="192" cy="48" r="8" fill="#0F172A"/>

  <!-- Bottom Analog Speedometer Gauge -->
  <rect x="86" y="196" width="84" height="36" rx="8" fill="#7F1D1D" stroke="#F87171" stroke-width="2.5"/>
  <path d="M128 224 L148 206" stroke="#FECACA" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="128" cy="224" r="4" fill="#FCA5A5"/>
</svg>
`;

export const STARTER_FIXTURES: StarterFixture[] = [
  {
    id: 'reactor-core',
    name: 'Reactor Telemetry Core',
    kind: 'Development Fixture',
    subtitle: 'Gear · Screen · Gauges · Circuits',
    dataUrl: encodeSvgDataUrl(REACTOR_CORE_SVG),
  },
  {
    id: 'turbine-node',
    name: 'Turbine Chronometer',
    kind: 'Development Fixture',
    subtitle: 'Rotor · Scope · Dial · Bus Lines',
    dataUrl: encodeSvgDataUrl(TURBINE_NODE_SVG),
  },
  {
    id: 'neural-relay',
    name: 'Signal Relay Matrix',
    kind: 'Development Fixture',
    subtitle: 'Dual Cogs · Screen · Meter · PCB',
    dataUrl: encodeSvgDataUrl(NEURAL_RELAY_SVG),
  },
];
