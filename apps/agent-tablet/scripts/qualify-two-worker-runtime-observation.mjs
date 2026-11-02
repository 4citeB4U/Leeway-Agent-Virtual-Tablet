/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.DIGITAL_WORKFORCE.QUALIFICATION
TAG: AGENT_VT.C3.TWO_WORKER.LIVE_OBSERVATION_V1
5WH:
WHAT = Render the original Agent VT Workforce Center against an authenticated local Runtime snapshot.
WHY = Prove actual W00/W08 executor and collaboration evidence reaches the existing UI without a second dashboard.
WHO = Digital Workforce qualification harness using Creator-authorized local evidence.
WHERE = apps/agent-tablet/scripts/qualify-two-worker-runtime-observation.mjs
WHEN = 2026-10-29 Milestone 2 controlled acceptance.
HOW = Existing Runtime adapter loopback bearer, existing Agent Tablet route, browser caller header and Playwright screenshots.
AUTHORIZED_ROLES: Read-only observation only; no dispatch, PRIME identity, Veritas, canonical receipt or Learning Ledger authority.
LICENSE: MIT
*/
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const appRoot = path.resolve(process.cwd());
const repositoryRoot = path.resolve(appRoot, '..', '..');
const runtimeRootInput = String(process.env.LEEWAY_RUNTIME_FABRIC_ROOT || '').trim();
const bindingPathInput = String(process.env.LEEWAY_RUNTIME_BINDING_PATH || '').trim();
assert.ok(runtimeRootInput && path.isAbsolute(runtimeRootInput), 'LEEWAY_RUNTIME_FABRIC_ROOT must be absolute.');
assert.ok(bindingPathInput && path.isAbsolute(bindingPathInput), 'LEEWAY_RUNTIME_BINDING_PATH must be absolute.');
const runtimeRoot = path.resolve(runtimeRootInput);
const bindingPath = path.resolve(bindingPathInput);
assert.ok(path.isAbsolute(runtimeRoot) && fs.statSync(runtimeRoot).isDirectory(), 'LEEWAY_RUNTIME_FABRIC_ROOT must identify the Runtime source checkout.');
assert.ok(path.isAbsolute(bindingPath) && fs.statSync(bindingPath).isFile(), 'LEEWAY_RUNTIME_BINDING_PATH must identify observed Runtime state.');
const adapterPath = path.join(runtimeRoot, 'automation-runtime', 'providers', 'codex-local-thread-adapter.mjs');
assert.ok(fs.statSync(adapterPath).isFile(), 'Runtime Codex adapter source is unavailable.');
const serverBundle = path.join(appRoot, 'dist', 'server.cjs');
assert.ok(fs.statSync(serverBundle).isFile(), 'Build Agent Tablet before running live observation.');

const outputRoot = path.resolve(process.env.LEEWAY_AGENT_VT_QUALIFICATION_DIR || path.join(repositoryRoot, 'qualification'));
fs.mkdirSync(outputRoot, { recursive: true });
const workerScreenshot = path.join(outputRoot, 'agent-vt-two-worker-observation-20261029.png');
const collaborationScreenshot = path.join(outputRoot, 'agent-vt-two-worker-collaboration-20261029.png');
const evidencePath = path.join(outputRoot, 'agent-vt-two-worker-observation-20261029.json');
const token = `m2-agent-vt-${randomUUID()}-${randomUUID()}`;
const { createCodexLocalThreadServer } = await import(pathToFileURL(adapterPath).href);

async function freePort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => listener.once('error', reject).listen(0, '127.0.0.1', resolve));
  const address = listener.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  await new Promise((resolve) => listener.close(resolve));
  assert.ok(port > 0);
  return port;
}

async function waitForHealth(url, child, diagnostics) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`AGENT_VT_SERVER_EXITED:${child.exitCode}`);
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`AGENT_VT_SERVER_HEALTH_TIMEOUT:${diagnostics.stderr.slice(-2000)}`);
}

const runtimeServer = createCodexLocalThreadServer({ token, statePath: bindingPath, cwd: runtimeRoot });
const runtimeAddress = await runtimeServer.listen();
const tabletPort = await freePort();
const diagnostics = { stdout: '', stderr: '' };
const tablet = spawn(process.execPath, [serverBundle], {
  cwd: appRoot,
  windowsHide: true,
  env: {
    ...process.env,
    PORT: String(tabletPort),
    LEEWAY_WORKFORCE_LOCAL_RUNTIME_URL: `http://127.0.0.1:${runtimeAddress.port}/v1/workforce/snapshot`
  },
  stdio: ['ignore', 'pipe', 'pipe']
});
tablet.stdout.setEncoding('utf8');
tablet.stderr.setEncoding('utf8');
tablet.stdout.on('data', (chunk) => { diagnostics.stdout = (diagnostics.stdout + chunk).slice(-8000); });
tablet.stderr.on('data', (chunk) => { diagnostics.stderr = (diagnostics.stderr + chunk).slice(-8000); });

let browser;
try {
  const health = await waitForHealth(`http://127.0.0.1:${tabletPort}/api/health`, tablet, diagnostics);
  try { browser = await chromium.launch({ headless: true }); }
  catch { browser = await chromium.launch({ channel: 'chrome', headless: true }); }
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    extraHTTPHeaders: { Authorization: `Bearer ${token}` }
  });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${tabletPort}`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Workforce', exact: true }).click();
  await page.getByRole('heading', { name: 'AGENT VT WORKFORCE COMMAND CENTER' }).waitFor();
  await page.getByText('READ-ONLY OBSERVED', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'W00 COMPLETED' }).waitFor();
  await page.getByRole('button', { name: 'W08 COMPLETED' }).waitFor();
  await page.getByRole('button', { name: 'W00 COMPLETED' }).click();
  const w00Panel = await page.locator('body').innerText();
  assert.match(w00Panel, /LEEWAY-CODEX-EXEC-/);
  assert.match(w00Panel, /Codex thread \/ session/);
  await page.screenshot({ path: workerScreenshot, fullPage: true });

  await page.getByRole('button', { name: 'W08 COMPLETED' }).click();
  const w08Panel = await page.locator('body').innerText();
  assert.match(w08Panel, /W08 — Skills & MCP/);
  assert.match(w08Panel, /resumed/);

  await page.getByRole('button', { name: 'Collaboration' }).click();
  await page.getByText('PEER_HELP_REQUEST', { exact: true }).first().waitFor();
  await page.getByText('PEER_HELP_RESPONSE', { exact: true }).first().waitFor();
  const collaborationText = await page.locator('body').innerText();
  assert.match(collaborationText, /W00 → W08/);
  assert.match(collaborationText, /W08 → W00/);
  assert.match(collaborationText, /delivery CONSUMED/);
  await page.screenshot({ path: collaborationScreenshot, fullPage: true });

  await page.getByRole('button', { name: 'PRIME Activity' }).click();
  await page.getByText('No authenticated prime events received.', { exact: true }).waitFor();
  const evidence = {
    schemaVersion: 'leeway.agent-vt.m2.live-observation.v1',
    status: 'CONTROLLED_AGENT_VT_TWO_WORKER_OBSERVATION_PASS_PRIME_UNVERIFIED',
    generatedAt: new Date().toISOString(),
    source: {
      runtimeRoot,
      runtimeBindingPath: bindingPath,
      agentVtRoot: repositoryRoot,
      runtimeTransport: 'EXISTING_CODEX_ADAPTER_LOOPBACK_BEARER',
      callerAuthorization: 'PLAYWRIGHT_CONTEXT_HEADER_NOT_PERSISTED'
    },
    health,
    assertions: {
      originalWorkforceCenterRendered: true,
      W00CompletedExecutorDisplayed: true,
      W08CompletedExecutorDisplayed: true,
      separateThreadSessionIdentityDisplayed: true,
      resumedStateDisplayed: true,
      peerRequestDisplayed: true,
      peerResponseDisplayed: true,
      correlationAndDeliveryDisplayed: true,
      primeEventsDisplayed: false,
      primeIdentityVerified: false,
      canonicalAcceptance: false
    },
    screenshots: { workers: workerScreenshot, collaboration: collaborationScreenshot },
    authorityBoundary: {
      browserRenderingIsNotVeritas: true,
      canonicalReceiptIssued: false,
      learningLedgerAdmitted: false
    }
  };
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  process.stdout.write(`${JSON.stringify({ status: evidence.status, evidencePath, screenshots: evidence.screenshots }, null, 2)}\n`);
  await context.close();
} finally {
  if (browser) await browser.close();
  if (tablet.exitCode === null) tablet.kill();
  await runtimeServer.close();
}
