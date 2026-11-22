/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT.TABLET.INTEGRATION.TEST
TAG: LEEWAY.TABLET.CORE.CONTROL.DOCK.CONTRACT.TEST.V1
5WH:
WHAT = Test that the core service dock is a user-initiated Tablet projection, not a second executor.
WHY = Prevent fabricated runtime readiness, duplicate device command routes, and hidden auto-start.
WHO = LeeWay Tablet reviewers under Creator and Standards.
WHERE = integration/runtime-fabric/tablet-core-control-dock.test.mjs.
WHEN = 2026-11-16.
HOW = Positive and negative static source assertions; no live service or physical device admission claim.
LICENSE = Existing repository terms; no new license asserted.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');
const dock = read('apps/agent-tablet/src/components/CoreServiceDock.tsx');
const app = read('apps/agent-tablet/src/App.tsx');
const home = read('apps/agent-tablet/src/components/AgentCommandCenter.tsx');
const assetUrl = read('apps/agent-tablet/src/assetUrl.ts');
const background = read('apps/agent-tablet/src/LeewayAgentVTBackground.tsx');

test('Tablet owns the visible core-service launcher and persistent popout', () => {
  assert.match(app, /import \{ CoreServiceDock \}/);
  assert.match(app, /<CoreServiceDock onOpenSurface=\{setCurrentApp\}/);
  assert.match(dock, /aria-label="Toggle LeeWay core service widget"/);
  assert.match(dock, /setVisible\(v => !v\)/);
  assert.match(dock, /onOpenSurface\(selected\.relatedTabletView!/);
});

test('source projection includes core authorities, sensory and compute surfaces', () => {
  for (const id of ['agent-lee','device-bridge','agent-skills','runtime','gpu','model-hub','continuum','brain','voice','vision','edge-rtc','seafile']) {
    assert.ok(dock.includes("id: '" + id + "'"), id);
  }
  assert.doesNotMatch(dock, /id: 'federate'/, 'federation is background-only and has no Tablet inspection tile');
  assert.match(dock, /LIVE SERVICE: NOT VERIFIED IN THIS TABLET SESSION/);
  assert.match(dock, /Studios and additional products enter only after core execution is qualified/);
});

test('no fabricated authority, automatic mic or device-command execution in dock', () => {
  assert.doesNotMatch(dock, /bridge\.call\(|getUserMedia\(|getDisplayMedia\(|navigator\.mediaDevices|fetch\(|eval\(|new Function/);
  assert.doesNotMatch(dock, /PRODUCTION_VERIFIED|VERITAS_ACCEPTED|execution: 'PASS'/);
  assert.doesNotMatch(home, /Runtime identity separately verified|System: Runtime observation active/);
});

test('taskbar owns core control, removes federation from the user surface, and supports overflow moves', () => {
  assert.match(app, /<CoreServiceDock onOpenSurface=\{setCurrentApp\} embedded \/>/);
  assert.match(app, /TABLET_APP_CATALOG/);
  assert.match(app, /AGENT TABLET APPLICATIONS/);
  assert.match(app, /text\/leeway-source/);
  assert.match(app, /leeway:move-to-taskbar/);
  assert.match(app, /id: 'modelHub'/);
  assert.match(app, /label: 'Model Hub'/);
  assert.doesNotMatch(app, /label: 'Federated'/);
  assert.doesNotMatch(app, /title: 'LeeWay Federated'/);
  assert.match(home, /Move to Taskbar/);
  assert.match(home, /Pin, Keep on Desktop/);
});

test('public Tablet assets resolve beneath the active deployment base path', () => {
  assert.match(assetUrl, /new URL\(relativeAsset, document\.baseURI\)/);
  assert.match(app, /tabletAssetUrl\(appMeta\.image\)/);
  assert.match(home, /tabletAssetUrl\(app\.image\)/);
});

test('Vault and Background controls occupy separate desktop corners', () => {
  assert.match(app, /className="absolute top-3 right-3[^"]*"[\s\S]{0,220}aria-label="Open shared Content Vault"/);
  assert.match(background, /aria-label="Change Background"[\s\S]{0,180}className="absolute bottom-4 right-4[^"]*"/);
});
