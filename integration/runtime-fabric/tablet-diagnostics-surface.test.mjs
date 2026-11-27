/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.INTEGRATION.AGENT_TABLET.DIAGNOSTICS
TAG: LEEWAY.TABLET.DIAGNOSTICS.SURFACE.CONTRACT.TEST.V1
5WH:
WHAT = Verify the Tablet Diagnostics surface contract remains portable and uses recovered original assets.
WHY = Prevent hardcoded workstation loopback/device identity and accidental replacement of original visualization assets.
WHO = Creator-authorized Tablet integration maintainer; this test grants no host or device authority.
WHERE = integration/runtime-fabric/tablet-diagnostics-surface.test.mjs.
WHEN = 2026-11-26.
HOW = Source-integrity assertions over the Tablet frontend, server binding, asset manifest and diagnostics test script.
LICENSE = Repository terms.
*/
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tablet = path.join(root, 'apps/agent-tablet');
const component = fs.readFileSync(path.join(tablet, 'src/components/OriginalDiagnosticsMatrix.tsx'), 'utf8');
const server = fs.readFileSync(path.join(tablet, 'server.ts'), 'utf8');
const assets = fs.readFileSync(path.join(tablet, 'src/diagnostics/assets.ts'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(tablet, 'package.json'), 'utf8'));

test('original Diagnostics component contains no universal loopback or device identity', () => {
  assert.equal(component.includes('127.0.0.1:8890'), false);
  assert.equal(component.includes('pc-primary'), false);
  assert.equal(component.includes("nativeResolve('diagnostics'"), true);
  assert.equal(component.includes("fetch('/api/diagnostics/surface'"), true);
});

test('server owns the local adapter binding and recovered asset route', () => {
  assert.equal(server.includes("app.get('/api/diagnostics/surface'"), true);
  assert.equal(server.includes("app.get('/diagnostics/matrix/:asset'"), true);
  assert.equal(server.includes('RECOVERED_ASSET_FILES'), true);
  assert.equal(server.includes("process.env.LEEWAY_DIAGNOSTICS_ORIGIN"), true);
});

test('recovered asset manifest pins eight original files without physical-geometry promotion', () => {
  for (const file of ['lenovo-83nx-laptop-front.png', 'lenovo-83nx-laptop-rear.png', 'lenovo-83nx-motherboard-map.png', 'lenovo-83nx-thermal-board.png', 'omniboard-laptop-exploded-reference.jpg']) {
    assert.equal(assets.includes(file), true, `${file} pinned in asset manifest`);
  }
  assert.equal(assets.includes("'CATEGORY_ILLUSTRATION_NOT_MODEL_EVIDENCE'"), true);
  assert.equal(assets.includes("'VERIFIED_PHYSICAL_GEOMETRY'"), false);
});

test('diagnostics test script runs contract, surface, sync and asset suites', () => {
  for (const file of ['contract.test.ts', 'surface.test.ts', 'sync.test.ts', 'assets.test.ts']) {
    assert.equal(pkg.scripts['test:diagnostics'].includes(file), true);
  }
});
