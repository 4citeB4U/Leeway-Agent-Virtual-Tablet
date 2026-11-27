/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT.TABLET.DIAGNOSTICS.BROWSER.QUALIFICATION
TAG: LEEWAY.TABLET.DIAGNOSTICS.BROWSER.FUNCTIONAL.V1
5WH:
WHAT = Exercise the running original Diagnostics Matrix and Tablet surface in a real browser.
WHY = Contract tests alone do not prove navigation, synchronization, provider recovery or actual UI behavior.
WHO = Creator-authorized Tablet integration maintainer; this test grants no host or device authority.
WHERE = test/browser/diagnostics-functional.browser.mjs.
WHEN = 2026-11-26.
HOW = Drive the running candidate with Playwright, assert frame state, message exchange and section navigation.
LICENSE = Repository terms.
*/
import assert from 'node:assert/strict';
import { chromium } from '../../apps/agent-tablet/node_modules/playwright/index.mjs';

const BASE = process.env.LEEWAY_TABLET_URL || 'http://127.0.0.1:3218';
const results = [];
const record = (name, detail) => {
  results.push({ name, status: 'PASS', detail });
  console.log(`PASS ${name}: ${detail}`);
};

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const pageErrors = [];
  const runtimeProbeRequests = [];
  page.on('pageerror', error => pageErrors.push(String(error.message || error)));
  page.on('request', request => {
    if (new URL(request.url()).pathname === '/api/runtime/probe') runtimeProbeRequests.push(request.url());
  });

  await page.goto(`${BASE}/?view=diagnostics`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForSelector('iframe[title="LeeWay Original Diagnostics Matrix"]', { state: 'attached', timeout: 20_000 });
  const frame = page.frameLocator('iframe[title="LeeWay Original Diagnostics Matrix"]');
  await frame.locator('body').waitFor({ state: 'attached', timeout: 20_000 });
  await page.waitForFunction(() => {
    const iframe = document.querySelector('iframe[title="LeeWay Original Diagnostics Matrix"]');
    return Boolean(iframe?.contentWindow?.LeeWayDiagnosticsBridge);
  }, { timeout: 20_000 });

  const initial = await frame.locator('body').evaluate(() => {
    const bridge = globalThis.LeeWayDiagnosticsBridge;
    return bridge ? { type: bridge.type, state: bridge.snapshot() } : null;
  });
  assert.ok(initial, 'original bridge must expose its state snapshot');
  assert.equal(initial.type, 'leeway.diagnostics.state.v1');
  assert.match(initial.state.bodyId, /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/);
  record('original bridge contract', `bodyId=${initial.state.bodyId}, section=${initial.state.section}`);
  await page.waitForTimeout(250);
  assert.deepEqual(runtimeProbeRequests, [], 'Diagnostics must not probe an unconfigured Workboard endpoint');
  record('unconfigured Workboard remains idle', 'Diagnostics does not issue a machine-specific Runtime probe');

  await page.evaluate(() => {
    globalThis.__diagnosticsMessages = [];
    window.addEventListener('message', event => {
      if (event.data?.type === 'leeway.diagnostics.state.v1') globalThis.__diagnosticsMessages.push(event.data);
    });
  });

  await page.evaluate(() => {
    const iframe = document.querySelector('iframe[title="LeeWay Original Diagnostics Matrix"]');
    iframe.contentWindow.postMessage({
      type: 'leeway.diagnostics.state.v1', schemaVersion: 1, sourceId: 'browser-test',
      sequence: 9001, emittedAt: Date.now(), bodyId: new URL(iframe.src).searchParams.get('bodyId'),
      section: 'BOARD', componentId: 'motherboard', visualization: 'PCB', inspectorOpen: true,
      topologyPath: ['device'], observationVersion: 'browser-obs-1', observationAt: Date.now()
    }, new URL(iframe.src).origin);
  });
  await page.waitForFunction(() => {
    const iframe = document.querySelector('iframe[title="LeeWay Original Diagnostics Matrix"]');
    const state = iframe?.contentWindow?.LeeWayDiagnosticsBridge?.snapshot?.();
    return state && state.section === 'BOARD' && state.componentId === 'motherboard' && state.visualization === 'PCB';
  }, { timeout: 15_000 });
  record('parent-to-matrix state synchronization', 'BOARD / motherboard / PCB applied inside original Matrix');

  const ecosystemTab = frame.locator('button[data-view="ecosystem"]').first();
  assert.equal(await ecosystemTab.count(), 1, 'original ecosystem tab must exist');
  await ecosystemTab.evaluate(element => element.click());
  await page.waitForFunction(() => (globalThis.__diagnosticsMessages || []).some(
    message => message.sourceId !== 'browser-test' && message.type === 'leeway.diagnostics.state.v1'), { timeout: 15_000 });
  const emitted = await page.evaluate(() => globalThis.__diagnosticsMessages.find(
    message => message.sourceId !== 'browser-test' && message.type === 'leeway.diagnostics.state.v1'));
  record('matrix-to-parent state emission', `sourceId=${emitted.sourceId}, section=${emitted.section}, componentId=${emitted.componentId}`);

  const unavailable = await frame.locator('body').textContent();
  assert.match(unavailable, /UNAVAILABLE/);
  record('unavailable sensors remain explicit', 'original exact dashboard renders UNAVAILABLE, not a fallback profile');

  const standalone = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const originalOrigin = process.env.LEEWAY_DIAGNOSTICS_ORIGIN || 'http://127.0.0.1:8890';
  await standalone.goto(`${originalOrigin}/digital-brain/diagnostics/index.html?bodyId=pc-primary`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await standalone.waitForSelector('nav[aria-label="Diagnostics sections"] button', { timeout: 20_000 });
  const labels = ['Diagnostics', 'Motherboard and ports', 'System agents', 'PCIe bus',
    'Veritas source evidence', 'Hardware map', 'Hardware query terminal', 'Diagnostics settings'];
  for (const label of labels) {
    const button = standalone.locator(`nav[aria-label="Diagnostics sections"] button[aria-label="${label}"]`);
    assert.equal(await button.count(), 1, `missing section button ${label}`);
    await button.click({ timeout: 10_000 });
    assert.equal(await button.getAttribute('aria-current'), 'page', `section ${label} did not activate`);
  }
  record('all eight original sections', labels.join(' | '));

  await page.route('**/*', route => {
    const url = route.request().url();
    if (url.includes('/brain/query') || url.includes('/api/diagnostics/ecosystem')) return route.abort();
    return route.continue();
  });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForSelector('iframe[title="LeeWay Original Diagnostics Matrix"]', { state: 'attached', timeout: 20_000 });
  await page.frameLocator('iframe[title="LeeWay Original Diagnostics Matrix"]').locator('body').waitFor({ state: 'attached', timeout: 20_000 });
  await page.waitForTimeout(3000);
  const disconnectFrame = page.frameLocator('iframe[title="LeeWay Original Diagnostics Matrix"]');
  await disconnectFrame.locator('body').waitFor({ state: 'attached', timeout: 20_000 });
  await page.waitForTimeout(4000);
  const disconnected = await disconnectFrame.locator('.mode').first().textContent();
  assert.match(disconnected, /ERROR|UNAVAILABLE|CONNECTING/i, `unexpected mode: ${disconnected}`);
  record('provider disconnect', `Matrix reports ${disconnected.trim()} when provider requests are blocked`);
  await page.unroute('**/*');
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForSelector('iframe[title="LeeWay Original Diagnostics Matrix"]', { state: 'attached', timeout: 20_000 });
  await page.frameLocator('iframe[title="LeeWay Original Diagnostics Matrix"]').locator('body').waitFor({ state: 'attached', timeout: 20_000 });
  await page.waitForTimeout(3000);
  const recoverFrame = page.frameLocator('iframe[title="LeeWay Original Diagnostics Matrix"]');
  assert.equal(await recoverFrame.locator('.error-banner').count(), 0, 'error banner must clear after provider restore');
  const recovered = await recoverFrame.locator('.mode').first().textContent();
  assert.match(recovered, /PROVIDER OBSERVATION|CURRENT/i);
  record('provider recovery', `Matrix returns to ${recovered.trim()} after provider restore`);

  await page.getByRole('button', { name: 'Home' }).click({ button: 'right' });
  await page.getByRole('button', { name: 'Workboard Runtime', exact: true }).click();
  await page.getByText('The Workboard is the one agent blackboard.').waitFor();
  assert.equal(await page.getByText('UNCONFIGURED', { exact: true }).count(), 1);
  assert.equal(await page.getByText('Current target: not set').count(), 1);
  assert.deepEqual(runtimeProbeRequests, [], 'an unconfigured Workboard must not probe a guessed endpoint');
  record('Workboard launch stays unconfigured', 'Home jump list opens the panel with no default endpoint or background probe');

  await page.getByRole('button', { name: 'Connect' }).click();
  const connectError = await page.getByRole('alert').textContent();
  assert.match(connectError || '', /Enter the approved Workboard loopback URL before connecting/);
  assert.deepEqual(runtimeProbeRequests, [], 'empty Connect must not issue a Runtime probe');
  record('empty Workboard Connect fails explicitly', 'user receives a clear prompt; no request is sent');

  await page.goto(`${BASE}/?view=workboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.getByText('The Workboard is the one agent blackboard.').waitFor();
  assert.equal(await page.getByText('UNCONFIGURED', { exact: true }).count(), 1);
  assert.deepEqual(runtimeProbeRequests, [], 'Workboard deep link must not probe without explicit configuration');
  record('Workboard deep link opens local panel', 'shared view URL restores the explicit unconfigured state');

  assert.deepEqual(pageErrors, [], `unexpected page errors: ${pageErrors.join('; ')}`);
  record('no uncaught page errors', `${results.length} functional checks complete`);
  console.log(JSON.stringify({ status: 'PASS', checks: results.length, base: BASE }, null, 2));
} finally {
  await browser.close();
}
