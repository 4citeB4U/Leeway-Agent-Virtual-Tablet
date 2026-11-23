/*
LEEWAY HEADER — DO NOT REMOVE
REGION: RUNTIME.AGENT_TABLET
TAG: RUNTIME.DIGITAL_WORKFORCE.AGENT_TABLET.SERVER
5WH:
WHAT = Truth-preserving backend for the actual LeeWay Agent Workstation / Open Notebook tablet UI.
WHY = Keep the Creator-approved tablet functional without fabricated search, notebook, data, or telemetry claims.
WHO = Creator/Human Authority through LeeWay Digital Workforce.
WHERE = apps/agent-tablet/server.ts.
WHEN = 2026.
HOW = Real HTTP extraction, deterministic source retrieval, optional grounded model enhancement, real host telemetry, and explicit UNBOUND states.
AUTHORIZED ROLES: Tablet service only; no Formula or deployment authority.
LICENSE: LeeWay-authored source.
*/
import 'dotenv/config';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { invokeTabletBridgeExecution, validateTabletExecutionRequest } from '../../integration/runtime-fabric/tablet-device-execution.mjs';
import {
  probeLocalWorkforceRuntime,
  probeWorkforceRuntimeMcp,
  resolveLocalWorkforceRuntimeConfig,
  scopedBearerFromAuthorization,
} from '../../integration/runtime-fabric/workforce-runtime-mcp.mjs';
import express from 'express';
import path from 'path';
import fs from 'node:fs';
import os from 'os';
import { createServer as createViteServer } from 'vite';
import { exec as execCb, execFile as execFileCb, spawn } from 'child_process';
import { promisify } from 'util';
import { CANONICAL_LIFECYCLE_PLAYBOOK } from './src/data/canonicalLifecyclePlaybook';

const app = express();
const PORT = Number(process.env.PORT || 3200);
const VT_ACCESS_COOKIE = 'leeway_vt_access';
const VT_OIDC_STATE_COOKIE = 'leeway_vt_oidc_state';
const VT_OIDC_VERIFIER_COOKIE = 'leeway_vt_oidc_verifier';
const execAsync = promisify(execCb);
const execFileAsync = promisify(execFileCb);
const digitalBrainRoot = process.env.LEEWAY_DIGITAL_BRAIN_ROOT;
const allowedOrigins = new Set(
  (process.env.LEEWAY_EMPLOYMENT_CENTER_ORIGINS || 'http://127.0.0.1:3100,http://localhost:3100')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '10mb' }));

type LeeWayModelRequest = {
  task: 'grounded-notebook-answer';
  message: string;
  notebookTitle: string;
  sources: Array<{ title?: string; content?: string }>;
};

async function callLeeWayModelProvider(payload: LeeWayModelRequest): Promise<string | null> {
  const endpoint = String(process.env.LEEWAY_TABLET_MODEL_ENDPOINT || '').trim();
  if (!endpoint) return null;
  let parsed: URL;
  try { parsed = new URL(endpoint); } catch { throw new Error('LEEWAY_MODEL_PROVIDER_INVALID_URL'); }
  const allowed = new Set(['localhost', '127.0.0.1', '::1']);
  if (!allowed.has(parsed.hostname)) throw new Error('LEEWAY_MODEL_PROVIDER_NOT_AUTHORIZED');
  const response = await fetch(parsed, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('LEEWAY_MODEL_PROVIDER_HTTP_' + response.status);
  const data = await response.json();
  return typeof data?.answer === 'string' && data.answer.trim() ? data.answer.trim() : null;
}

type OidcDiscovery = { issuer?: string; authorization_endpoint?: string; token_endpoint?: string };

function cookieValue(header: string | undefined, name: string): string | null {
  const prefix = name + '=';
  for (const part of String(header || '').split(';')) {
    const item = part.trim();
    if (!item.startsWith(prefix)) continue;
    try { return decodeURIComponent(item.slice(prefix.length)); } catch { return null; }
  }
  return null;
}

function cookieFlags(maxAge: number): string {
  const secure = process.env.LEEWAY_AGENT_VT_COOKIE_SECURE === 'true';
  return [`Path=/`, `Max-Age=${Math.max(0, Math.floor(maxAge))}`, 'SameSite=Lax', 'HttpOnly', secure ? 'Secure' : ''].filter(Boolean).join('; ');
}

function setSessionCookie(res: any, name: string, value: string, maxAge: number): void {
  res.append('Set-Cookie', `${name}=${encodeURIComponent(value)}; ${cookieFlags(maxAge)}`);
}

function clearSessionCookie(res: any, name: string): void {
  res.append('Set-Cookie', `${name}=; ${cookieFlags(0)}`);
}

function oidcSettings(): { ok: true; issuer: URL; clientId: string; redirectUri: string; scope: string; audience: string } | { ok: false; reason: string } {
  const issuerText = String(process.env.LEEWAY_MCP_AUTH_ISSUER || '').trim().replace(/\/$/, '');
  const clientId = String(process.env.LEEWAY_AGENT_VT_OIDC_CLIENT_ID || '').trim();
  if (!issuerText) return { ok: false, reason: 'ZITADEL_OIDC_ISSUER_NOT_CONFIGURED' };
  if (!clientId) return { ok: false, reason: 'ZITADEL_OIDC_CLIENT_NOT_CONFIGURED' };
  let issuer: URL;
  try { issuer = new URL(issuerText); } catch { return { ok: false, reason: 'ZITADEL_OIDC_ISSUER_INVALID' }; }
  if (issuer.protocol !== 'https:' && !['localhost', '127.0.0.1', '::1'].includes(issuer.hostname)) return { ok: false, reason: 'ZITADEL_OIDC_ISSUER_MUST_USE_HTTPS' };
  const redirectUri = String(process.env.LEEWAY_AGENT_VT_OIDC_REDIRECT_URI || `http://127.0.0.1:${PORT}/api/auth/callback`).trim();
  let redirect: URL;
  try { redirect = new URL(redirectUri); } catch { return { ok: false, reason: 'ZITADEL_OIDC_REDIRECT_URI_INVALID' }; }
  if (!['http:', 'https:'].includes(redirect.protocol) || !['localhost', '127.0.0.1', '::1'].includes(redirect.hostname)) return { ok: false, reason: 'ZITADEL_OIDC_REDIRECT_URI_NOT_LOOPBACK' };
  return { ok: true, issuer, clientId, redirectUri: redirect.toString(), scope: String(process.env.LEEWAY_AGENT_VT_OIDC_SCOPE || 'openid profile read:runtime').trim(), audience: String(process.env.LEEWAY_MCP_AUDIENCE || '').trim() };
}

function oidcReason(settings: ReturnType<typeof oidcSettings>): string | null {
  return 'reason' in settings ? settings.reason : null;
}

async function oidcDiscovery(settings: Extract<ReturnType<typeof oidcSettings>, { ok: true }>): Promise<OidcDiscovery> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(new URL('/.well-known/openid-configuration', settings.issuer), { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('ZITADEL_OIDC_DISCOVERY_HTTP_' + response.status);
    const body = await response.json() as OidcDiscovery;
    if (body.issuer && body.issuer.replace(/\/$/, '') !== settings.issuer.toString().replace(/\/$/, '')) throw new Error('ZITADEL_OIDC_DISCOVERY_ISSUER_MISMATCH');
    if (!body.authorization_endpoint || !body.token_endpoint) throw new Error('ZITADEL_OIDC_DISCOVERY_ENDPOINTS_MISSING');
    for (const endpoint of [body.authorization_endpoint, body.token_endpoint]) {
      const parsed = new URL(endpoint);
      if (parsed.protocol !== 'https:' && !['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) throw new Error('ZITADEL_OIDC_ENDPOINT_MUST_USE_HTTPS');
    }
    return body;
  } finally { clearTimeout(timer); }
}

function callerBearer(req: express.Request): string | null {
  const headerToken = scopedBearerFromAuthorization(req.headers.authorization);
  if (headerToken) return headerToken;
  const cookieToken = cookieValue(req.headers.cookie, VT_ACCESS_COOKIE);
  return cookieToken ? scopedBearerFromAuthorization(`Bearer ${cookieToken}`) : null;
}

app.get('/api/auth/status', (req, res) => {
  const settings = oidcSettings();
  res.setHeader('Cache-Control', 'no-store');
  res.json({ state: cookieValue(req.headers.cookie, VT_ACCESS_COOKIE) ? 'OWNER_SESSION_PRESENT' : 'OWNER_SESSION_REQUIRED', configured: settings.ok, reason: oidcReason(settings) });
});

app.get('/api/auth/start', async (_req, res) => {
  const settings = oidcSettings();
  if (!settings.ok) return res.status(503).json({ state: 'BLOCKED', reason: oidcReason(settings) });
  try {
    const discovery = await oidcDiscovery(settings);
    const state = randomBytes(32).toString('base64url');
    const verifier = randomBytes(48).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    setSessionCookie(res, VT_OIDC_STATE_COOKIE, state, 600);
    setSessionCookie(res, VT_OIDC_VERIFIER_COOKIE, verifier, 600);
    const authorization = new URL(discovery.authorization_endpoint!);
    authorization.searchParams.set('response_type', 'code');
    authorization.searchParams.set('client_id', settings.clientId);
    authorization.searchParams.set('redirect_uri', settings.redirectUri);
    // Request native device execution only when the user explicitly enters execute mode.
    // The existing identity provider must still grant device.bridge.execute; this UI cannot grant it.
    const executeRequested = _req.query.mode === 'execute';
    const requestedScope = new Set(settings.scope.split(/\s+/).filter(Boolean));
    if (executeRequested) requestedScope.add('device.bridge.execute');
    authorization.searchParams.set('scope', [...requestedScope].join(' '));
    authorization.searchParams.set('state', state);
    authorization.searchParams.set('code_challenge', challenge);
    authorization.searchParams.set('code_challenge_method', 'S256');
    if (settings.audience) authorization.searchParams.set('resource', settings.audience);
    return res.redirect(302, authorization.toString());
  } catch (error) { return res.status(503).json({ state: 'BLOCKED', reason: error instanceof Error ? error.message : String(error) }); }
});

app.get('/api/auth/callback', async (req, res) => {
  const settings = oidcSettings();
  if (!settings.ok) return res.status(503).json({ state: 'BLOCKED', reason: oidcReason(settings) });
  const code = String(req.query.code || '').trim();
  const returnedState = String(req.query.state || '').trim();
  const state = cookieValue(req.headers.cookie, VT_OIDC_STATE_COOKIE);
  const verifier = cookieValue(req.headers.cookie, VT_OIDC_VERIFIER_COOKIE);
  if (req.query.error) return res.status(401).json({ state: 'BLOCKED', reason: 'ZITADEL_OIDC_AUTHORIZATION_DENIED' });
  if (!code || !returnedState || !state || !verifier) return res.status(400).json({ state: 'BLOCKED', reason: 'ZITADEL_OIDC_CALLBACK_STATE_MISSING' });
  const left = Buffer.from(returnedState); const right = Buffer.from(state);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return res.status(400).json({ state: 'BLOCKED', reason: 'ZITADEL_OIDC_CALLBACK_STATE_MISMATCH' });
  try {
    const discovery = await oidcDiscovery(settings);
    const response = await fetch(discovery.token_endpoint!, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: settings.redirectUri, client_id: settings.clientId, code_verifier: verifier }) });
    const body = await response.json() as { access_token?: string; expires_in?: number };
    if (!response.ok || typeof body.access_token !== 'string' || !scopedBearerFromAuthorization(`Bearer ${body.access_token}`)) return res.status(502).json({ state: 'BLOCKED', reason: 'ZITADEL_OIDC_TOKEN_EXCHANGE_FAILED' });
    const maxAge = Math.min(3600, Math.max(60, Number(body.expires_in || 900)));
    setSessionCookie(res, VT_ACCESS_COOKIE, body.access_token, maxAge);
    clearSessionCookie(res, VT_OIDC_STATE_COOKIE); clearSessionCookie(res, VT_OIDC_VERIFIER_COOKIE);
    return res.redirect(302, '/');
  } catch (error) { return res.status(503).json({ state: 'BLOCKED', reason: error instanceof Error ? error.message : String(error) }); }
});


// Read-only scoped Runtime Fabric discovery; no employee task/Veritas/ledger authority.
app.get('/api/workforce/runtime-fabric', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Authorization, Cookie');
  const scopedToken = callerBearer(req);
  if (!scopedToken) {
    res.setHeader('WWW-Authenticate', 'Bearer realm="LeeWay-Workforce-ReadOnly", scope="read:runtime"');
    return res.status(401).json({
      state: 'BLOCKED', reason: 'ZITADEL_BEARER_REQUIRED',
      productionExecutionAuthorized: false, veritasAccepted: false, learningAdmitted: false
    });
  }
  const local = resolveLocalWorkforceRuntimeConfig(process.env);
  const result = local.ok
    ? await probeLocalWorkforceRuntime({ env: process.env, authorizationToken: scopedToken })
    : await probeWorkforceRuntimeMcp({
        env: {
          LEEWAY_WORKFORCE_MCP_RESOURCE_URL: process.env.LEEWAY_WORKFORCE_MCP_RESOURCE_URL,
          LEEWAY_WORKFORCE_MCP_ACCESS_TOKEN: scopedToken
        }
      });
  return res.status([
    'AUTHENTICATED_READ_ONLY_OBSERVED',
    'AUTHENTICATED_LOCAL_RUNTIME_OBSERVED'
  ].includes(result.state) ? 200 : 503).json(result);
});

// Interactive, owner-initiated Tablet control. Every effect stays with Runtime Fabric / Device Bridge.
// No token, grant, device identity, permission or Veritas decision originates here.
function tabletExecutionOriginMatches(req: express.Request): boolean {
  const expectedText = String(process.env.LEEWAY_AGENT_VT_TRUSTED_ORIGIN || '').trim();
  let expected: URL;
  try { expected = new URL(expectedText); } catch { return false; }
  const permitted = expected.protocol === 'https:' ||
    (expected.protocol === 'http:' && ['127.0.0.1','localhost','[::1]'].includes(expected.hostname));
  if (!permitted || expected.username || expected.password ||
      expected.search || expected.hash || expected.pathname !== '/' ) return false;
  if (req.headers.origin !== expected.origin) return false;
  if (req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin') return false;
  if (req.headers['x-leeway-user-intent'] !== 'execute-click') return false;
  return /^application\/json(?:\s*;|$)/i.test(String(req.headers['content-type'] || ''));
}

app.post('/api/device-bridge/execute', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!tabletExecutionOriginMatches(req)) {
    return res.status(403).json({state:'BLOCKED',reason:'TABLET_EXPLICIT_SAME_ORIGIN_INTENT_REQUIRED'});
  }
  const bearer = callerBearer(req);
  if (!bearer) {
    res.setHeader('WWW-Authenticate', 'Bearer realm="LeeWay-Device-Bridge", scope="device.bridge.execute"');
    return res.status(401).json({state:'BLOCKED',reason:'OWNER_EXECUTE_SESSION_REQUIRED'});
  }
  if (!validateTabletExecutionRequest(req.body)) {
    return res.status(400).json({state:'BLOCKED',reason:'EXECUTION_REQUEST_INVALID'});
  }
  const result = await invokeTabletBridgeExecution({
    env:process.env, bearer, body:req.body
  });
  // A denied Runtime request cannot be upgraded into an optimistic Tablet success.
  return res.status(result.state === 'UPSTREAM_OPERATION_REPORTED' ? 200 : 503).json(result);
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    state: 'AGENT_TABLET_ONLINE',
    port: PORT,
    modelProviderBound: Boolean(process.env.LEEWAY_TABLET_MODEL_ENDPOINT),
    searchProviderBound: false,
    dataFabricBound: false,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/runtime/probe', async (req, res) => {
  const target = String(req.query.url || '').trim();
  if (!target) return res.status(400).json({ state: 'INVALID_REQUEST', error: 'url is required' });

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return res.status(400).json({ state: 'INVALID_URL', target });
  }

  if (!['http:', 'https:'].includes(parsed.protocol) || !['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) {
    return res.status(403).json({ state: 'BLOCKED_TARGET', target: parsed.origin });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1800);
  try {
    const response = await fetch(parsed.toString(), { signal: controller.signal });
    return res.status(response.ok ? 200 : 503).json({
      state: response.ok ? 'UP' : 'DOWN',
      status: response.status,
      target: parsed.origin,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      state: 'DOWN',
      target: parsed.origin,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  } finally {
    clearTimeout(timer);
  }
});

app.get('/api/agents', (_req, res) => {
  res.json({
    status: 'ok',
    agents: [
      { id: 'agent-lee', name: 'Agent Lee', role: 'Orchestrator / Coordinator' },
      { id: 'research-agent', name: 'Dr. Rachel (Research)', role: 'Evidence & Benchmarking' },
      { id: 'planner-agent', name: 'Devon (Planner)', role: 'Architecture & Task Breakdown' },
      { id: 'coder-agent', name: 'Alex (Coder)', role: 'Implementation & Artifacts' },
      { id: 'reviewer-agent', name: 'Marcus (Reviewer)', role: 'Verification & Safety Audit' }
    ]
  });
});

app.get('/standalone.html', (_req, res) => {
  res.redirect(302, '/?view=preview');
});

// Read-only host composition projection. This reports locally observable
// client/config signals; it is not an execution or admission authority.
app.get('/api/agent-roster', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const configured = {
    codex: fs.existsSync(path.join(os.homedir(), '.codex', 'config.toml')),
    copilot: fs.existsSync(path.join(os.homedir(), '.copilot', 'mcp-config.json')),
    gemini: fs.existsSync(path.join(os.homedir(), '.gemini', 'settings.json')),
    claude: fs.existsSync(path.join(os.homedir(), 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json')),
  };
  let processNames: string[] = [];
  let processObservation = 'OBSERVED';
  try {
    const { stdout } = await execAsync('tasklist /fo csv /nh', { windowsHide: true, timeout: 2500 });
    processNames = stdout.split(/\r?\n/).map((line) => line.match(/^"([^"]+)"/)?.[1]?.toLowerCase()).filter(Boolean) as string[];
  } catch (error) {
    processObservation = 'UNAVAILABLE';
    console.error('[Agent Roster] Host process observation failed:', error);
  }
  const observed = (patterns: string[]) => processNames.some((name) => patterns.some((pattern) => name.includes(pattern)));
  const clients = [
    { id: 'codex', provider: 'OpenAI', agent: 'Codex', configured: configured.codex, observed: observed(['codex', 'openai']) },
    { id: 'gemini', provider: 'Google', agent: 'Gemini / Antigravity', configured: configured.gemini, observed: observed(['antigravity', 'gemini']) },
    { id: 'copilot', provider: 'GitHub', agent: 'Copilot', configured: configured.copilot, observed: observed(['copilot', 'github']) },
    { id: 'claude', provider: 'Anthropic', agent: 'Claude Desktop', configured: configured.claude, observed: observed(['claude']) },
  ].map((client) => ({
    ...client,
    state: processObservation === 'UNAVAILABLE'
      ? 'PROCESS_STATE_UNAVAILABLE'
      : client.observed ? 'HOST_PROCESS_OBSERVED' : client.configured ? 'CONFIGURED_NOT_RUNNING' : 'NOT_CONFIGURED',
    evidenceState: processObservation === 'UNAVAILABLE' ? 'UNVERIFIED' : client.observed ? 'OBSERVED' : 'UNVERIFIED',
    execution: 'NOT_ADMITTED'
  }));
  let voiceState = 'UNVERIFIED';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1200);
  try {
    const response = await fetch('http://127.0.0.1:8890', { signal: controller.signal }); clearTimeout(timer);
    voiceState = response.status < 500 ? 'CARRIER_REACHABLE_BINDING_UNVERIFIED' : 'CARRIER_ERROR';
  } catch { voiceState = 'CARRIER_UNREACHABLE'; }
  finally { clearTimeout(timer); }
  return res.json({
    state: processObservation === 'OBSERVED' ? 'READ_ONLY_HOST_COMPOSITION' : 'READ_ONLY_HOST_COMPOSITION_PARTIAL',
    processObservation,
    authority: 'OBSERVATION_ONLY',
    fetchedAt: new Date().toISOString(),
    clients,
    voice: { name: 'LeeWay Voice Fabric', state: voiceState, playback: 'NOT_VERIFIED' },
    governance: { runtime: 'EXISTING_RUNTIME_FABRIC', dispatch: 'NOT_EXPOSED', mutation: 'NOT_EXPOSED', receipts: 'NOT_ADMITTED' }
  });
});

// The tablet exposes the approved lifecycle as a retrievable policy for Agent
// Lee surfaces. It does not claim that an external model has been trained or
// that a runtime has accepted the policy without an authorized acknowledgement.
app.get('/api/agent-lee/operating-playbook', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  return res.json({
    ...CANONICAL_LIFECYCLE_PLAYBOOK,
    servedAt: new Date().toISOString(),
    runtimeAcknowledgement: 'NOT_OBSERVED',
    executionAuthority: 'NOT_GRANTED_BY_PLAYBOOK'
  });
});

app.get('/api/search', (req, res) => {
  const query = String(req.query.q || '').trim();
  const agentId = String(req.query.agent_id || 'agent-lee');
  if (!query) return res.status(400).json({ state: 'INVALID_REQUEST', error: 'Query parameter q is required' });

  return res.status(503).json({
    state: 'UNBOUND_SEARCH_PROVIDER',
    query,
    agentId,
    results: [],
    enginesQueried: [],
    consensusScore: null,
    agentBriefing: '',
    evidence: 'No authorized live search provider is bound to this Agent Tablet runtime.',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/web/extract', async (req, res) => {
  const url = req.body?.url;
  const agentId = req.body?.agent_id || 'research-agent';
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ state: 'INVALID_REQUEST', error: 'URL is required' });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('Unsupported protocol');
  } catch {
    return res.status(400).json({ state: 'INVALID_URL', error: 'Only valid HTTP/HTTPS URLs are supported' });
  }

  try {
    const response = await fetch(parsed, {
      redirect: 'follow',
      headers: { 'User-Agent': 'LeeWay-Agent-Tablet/1.0' }
    });
    if (!response.ok) {
      return res.status(502).json({ state: 'SOURCE_FETCH_FAILED', status: response.status, url: parsed.toString() });
    }

    const contentType = response.headers.get('content-type') || '';
    const raw = await response.text();
    const titleMatch = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : parsed.hostname;
    let extracted = raw;

    if (contentType.includes('text/html') || /<html/i.test(raw)) {
      extracted = raw
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, ' ')
        .trim();
    }

    const bounded = extracted.slice(0, 100000);
    return res.json({
      state: 'SOURCE_EXTRACTED',
      url: response.url || parsed.toString(),
      title,
      text: bounded,
      markdown: bounded,
      truncated: extracted.length > bounded.length,
      bytesReceived: Buffer.byteLength(raw, 'utf8'),
      extractedBy: agentId,
      extractedAt: new Date().toISOString()
    });
  } catch (error) {
    return res.status(502).json({
      state: 'SOURCE_FETCH_FAILED',
      url: parsed.toString(),
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

function sourceSentences(sources: any[]) {
  const output: Array<{ sourceIndex: number; title: string; sentence: string }> = [];
  sources.forEach((source, sourceIndex) => {
    const content = String(source.content || '').replace(/\s+/g, ' ').trim();
    const sentences = content.split(/(?<=[.!?])\s+/).filter((sentence) => sentence.length >= 24);
    for (const sentence of sentences) {
      output.push({
        sourceIndex,
        title: String(source.title || 'Source ' + (sourceIndex + 1)),
        sentence: sentence.slice(0, 700)
      });
    }
  });
  return output;
}

app.post('/api/notebook/chat', async (req, res) => {
  const message = req.body?.message;
  const sources = Array.isArray(req.body?.sources) ? req.body.sources : [];
  const notebookTitle = String(req.body?.notebookTitle || 'Research Notebook');

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ state: 'INVALID_REQUEST', error: 'Message is required' });
  }
  if (sources.length === 0) {
    return res.status(422).json({
      state: 'INSUFFICIENT_EVIDENCE',
      answer: 'No notebook sources are selected. Add or select source material before asking a grounded question.',
      suggestedQuestions: [],
      citedSources: []
    });
  }

  try {
    const answer = await callLeeWayModelProvider({
      task: 'grounded-notebook-answer',
      message,
      notebookTitle,
      sources
    });
    if (answer) {
      const cited = Array.from(new Set((answer.match(/\[(\d+)\]/g) || []).map((citation) =>
        Number(citation.replace(/\D/g, '')) - 1
      ))).filter((idx) => idx >= 0 && idx < sources.length);
      return res.json({
        state: 'GROUNDED_MODEL_RESPONSE',
        answer,
        suggestedQuestions: [],
        citedSources: cited.map((idx) => ({
          index: idx + 1,
          title: sources[idx].title,
          snippet: String(sources[idx].content || '').slice(0, 180)
        }))
      });
    }
  } catch (error) {
    console.warn('LeeWay model provider unavailable; deterministic retrieval remains active:', error);
  }

  const tokens = Array.from(new Set(
    message.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((token) => token.length > 2)
  ));
  const candidates = sourceSentences(sources)
    .map((item) => {
      const lower = item.sentence.toLowerCase();
      const overlap = tokens.reduce((sum, token) => sum + (lower.includes(token) ? 1 : 0), 0);
      return { ...item, score: overlap / Math.max(tokens.length, 1) };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.sourceIndex - b.sourceIndex)
    .slice(0, 5);

  if (candidates.length === 0) {
    return res.status(422).json({
      state: 'INSUFFICIENT_EVIDENCE',
      answer: 'The selected sources in "' + notebookTitle + '" do not contain enough matching evidence to answer that question deterministically.',
      suggestedQuestions: [],
      citedSources: []
    });
  }

  const answer = candidates.map((item) => item.sentence + ' [' + (item.sourceIndex + 1) + ']').join('\n\n');
  const used = Array.from(new Set(candidates.map((item) => item.sourceIndex)));
  return res.json({
    state: 'DETERMINISTIC_EXTRACTIVE_RESPONSE',
    answer,
    suggestedQuestions: [],
    citedSources: used.map((idx) => ({
      index: idx + 1,
      title: sources[idx].title,
      snippet: String(sources[idx].content || '').slice(0, 180)
    }))
  });
});

app.post('/api/notebook/generate-artifact', async (req, res) => {
  const artifactType = String(req.body?.artifactType || '');
  const sources = Array.isArray(req.body?.sources) ? req.body.sources : [];
  const notebookTitle = String(req.body?.notebookTitle || 'Research Notebook');

  if (!artifactType) return res.status(400).json({ state: 'INVALID_REQUEST', error: 'artifactType is required' });
  if (sources.length === 0) {
    return res.status(422).json({
      state: 'INSUFFICIENT_EVIDENCE',
      artifactType,
      content: '',
      error: 'At least one source is required.'
    });
  }

  const excerpts = sources.map((source: any, idx: number) => ({
    index: idx + 1,
    title: String(source.title || 'Source ' + (idx + 1)),
    excerpt: String(source.content || '').replace(/\s+/g, ' ').trim().slice(0, 850)
  }));

  let content = '';
  if (artifactType === 'audio_overview') {
    const turns: string[] = [];
    excerpts.forEach((item) => {
      turns.push('Morgan: Source ' + item.index + ', "' + item.title + '", states: ' + item.excerpt + ' [' + item.index + ']');
      turns.push('Alex: That observation is grounded in Source ' + item.index + '. [' + item.index + ']');
    });
    content = '# Audio Overview: ' + notebookTitle + '\n\n' + turns.join('\n\n');
  } else if (artifactType === 'study_guide') {
    content = '# Study Guide: ' + notebookTitle + '\n\n' + excerpts.map((item) =>
      '## Source ' + item.index + ': ' + item.title + '\n' + item.excerpt + ' [' + item.index + ']'
    ).join('\n\n');
  } else if (artifactType === 'briefing_doc') {
    content = '# Executive Briefing: ' + notebookTitle + '\n\n## Source-grounded findings\n\n' + excerpts.map((item) =>
      '- **' + item.title + ':** ' + item.excerpt + ' [' + item.index + ']'
    ).join('\n\n');
  } else if (artifactType === 'faq') {
    content = '# Source FAQ: ' + notebookTitle + '\n\n' + excerpts.map((item) =>
      '## What does Source ' + item.index + ' establish?\n' + item.excerpt + ' [' + item.index + ']'
    ).join('\n\n');
  } else if (artifactType === 'timeline') {
    return res.status(422).json({
      state: 'INSUFFICIENT_STRUCTURED_EVIDENCE',
      artifactType,
      content: '',
      error: 'Timeline generation requires structured dates/events or an authorized grounded model.'
    });
  } else {
    return res.status(400).json({ state: 'UNSUPPORTED_ARTIFACT_TYPE', artifactType, content: '' });
  }

  return res.json({
    state: 'DETERMINISTIC_SOURCE_ARTIFACT',
    artifactType,
    content,
    generatedAt: new Date().toISOString()
  });
});

app.post('/api/data/query', (req, res) => {
  return res.status(503).json({
    state: 'UNBOUND_DATA_SOURCE',
    source: req.body?.source || 'evidence-vault',
    query: req.body?.query || '',
    rows: [],
    evidence: 'No authorized Data Fabric adapter is configured for this Agent Tablet runtime.',
    queriedAt: new Date().toISOString()
  });
});

async function readHostDeviceTelemetry() {
  if (process.platform === 'win32') {
    // This process runs on the enrolled Windows device. Query Windows itself;
    // do not turn an unavailable metric into a made-up zero.
    const script = "$cpu=(Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor -Filter \"Name='_Total'\").PercentProcessorTime;$os=Get-CimInstance Win32_OperatingSystem;$disks=Get-CimInstance Win32_LogicalDisk -Filter \"DriveType=3\";$total=($disks|Measure-Object -Property Size -Sum).Sum;$free=($disks|Measure-Object -Property FreeSpace -Sum).Sum;[pscustomobject]@{cpu=$cpu;ram=[math]::Round((($os.TotalVisibleMemorySize-$os.FreePhysicalMemory)/$os.TotalVisibleMemorySize)*100,2);disk=if($total){[math]::Round((($total-$free)/$total)*100,2)}else{$null}}|ConvertTo-Json -Compress";
    try {
      const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { timeout: 1800, windowsHide: true });
      const raw = JSON.parse(String(stdout).trim());
      return { cpu: Number.isFinite(raw.cpu) ? raw.cpu : null, ram: Number.isFinite(raw.ram) ? raw.ram : null, disk: Number.isFinite(raw.disk) ? raw.disk : null, temperature: null, source: 'WINDOWS_DEVICE_CIM' };
    } catch {
      return { cpu: null, ram: null, disk: null, temperature: null, source: 'WINDOWS_DEVICE_CIM_UNAVAILABLE' };
    }
  }
  const mem = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const load = os.loadavg();
  const cpuCount = Math.max(os.cpus().length, 1);
  return {
    cpu: Number(((load[0] / cpuCount) * 100).toFixed(2)),
    ram: Number((((totalMem - freeMem) / totalMem) * 100).toFixed(2)),
    disk: null,
    temperature: null,
    source: 'NODE_HOST_OS'
  };
}

app.get('/api/diagnostics/snapshot', async (_req, res) => {
  const device = await readHostDeviceTelemetry();
  const mem = process.memoryUsage();
  res.json({
    state: 'OBSERVED_HOST_TELEMETRY',
    telemetry: {
      cpu: device.cpu,
      ram: device.ram,
      disk: device.disk,
      temp: device.temperature,
      processRssBytes: mem.rss,
      processHeapUsedBytes: mem.heapUsed,
      uptimeSeconds: Math.floor(process.uptime()),
      source: device.source
    },
    unsupported: { deviceTemperature: 'UNBOUND', gpuUtilization: 'UNBOUND' },
    flowNodes: [],
    flowEdges: [],
    charge: [],
    systemCharge: [],
    progress: [],
    gantt: [],
    tools: [],
    signals: [],
    timestamp: new Date().toISOString()
  });
});

/*
 * Digital Brain is an owner-local catalogue, not a second filesystem or a
 * browser data service.  The index intentionally keeps only metadata in
 * memory and only observes user-approved library folders.  In particular it
 * never indexes browser profiles, AppData, Codex state, or this workspace.
 */
type BrainNode = {
  id: string;
  parentId: string | null;
  path: string | null;
  label: string;
  type: 'directory' | 'file';
  size: number | null;
  modifiedAt: string | null;
};

const brainOwnerKey = createHash('sha256')
  .update(`${os.userInfo().username}\u0000${os.homedir()}`)
  .digest('hex')
  .slice(0, 24);
const brainBodyId = `owner-${brainOwnerKey}`;
const brainRootId = `brain:${brainBodyId}`;
const brainWorkspaceRoot = path.resolve(process.env.LEEWAY_WORKSPACE_ROOT || path.resolve(process.cwd(), '../../..')).toLowerCase();
const brainExcludedNames = new Set(['.codex', 'appdata', 'node_modules', '.git', '$recycle.bin', 'system volume information']);
const brainMaxNodes = Math.max(1000, Math.min(Number(process.env.LEEWAY_DIGITAL_BRAIN_MAX_NODES || 20000), 50000));
const brainRoots = (() => {
  const requested = String(process.env.LEEWAY_DIGITAL_BRAIN_ROOTS || '').split(';').map((value) => value.trim()).filter(Boolean);
  const defaults = ['Desktop', 'Documents', 'Downloads', 'Pictures', 'Videos', 'Music', 'OneDrive'].map((name) => path.join(os.homedir(), name));
  return [...new Set((requested.length ? requested : defaults).map((value) => path.resolve(value)))].filter((value) => {
    const normalized = value.toLowerCase();
    return fs.existsSync(value) && normalized !== brainWorkspaceRoot && !normalized.startsWith(`${brainWorkspaceRoot}${path.sep}`);
  });
})();
let brainNodes = new Map<string, BrainNode>();
let brainChildren = new Map<string, string[]>();
let brainIndexBuiltAt: string | null = null;
let brainIndexBusy: Promise<void> | null = null;

function brainNodeId(filePath: string): string {
  return `${brainRootId}:node:${createHash('sha256').update(path.resolve(filePath).toLowerCase()).digest('base64url').slice(0, 22)}`;
}

function isAllowedBrainPath(filePath: string): boolean {
  const normalized = path.resolve(filePath).toLowerCase();
  return brainRoots.some((root) => normalized === root.toLowerCase() || normalized.startsWith(`${root.toLowerCase()}${path.sep}`));
}

function addBrainNode(node: BrainNode): void {
  brainNodes.set(node.id, node);
  if (node.parentId) {
    const children = brainChildren.get(node.parentId) || [];
    children.push(node.id);
    brainChildren.set(node.parentId, children);
  }
}

async function rebuildOwnerLocalBrainIndex(): Promise<void> {
  if (brainIndexBusy) return brainIndexBusy;
  brainIndexBusy = (async () => {
    const nodes = new Map<string, BrainNode>();
    const children = new Map<string, string[]>();
    const add = (node: BrainNode) => {
      nodes.set(node.id, node);
      if (node.parentId) {
        const list = children.get(node.parentId) || [];
        list.push(node.id);
        children.set(node.parentId, list);
      }
    };
    const root: BrainNode = { id: brainRootId, parentId: null, path: null, label: 'Your device files', type: 'directory', size: null, modifiedAt: null };
    add(root);
    const visit = async (directory: string, parentId: string): Promise<void> => {
      if (nodes.size >= brainMaxNodes) return;
      let entries: fs.Dirent[];
      try { entries = await fs.promises.readdir(directory, { withFileTypes: true }); } catch { return; }
      entries.sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: 'base' }));
      for (const entry of entries) {
        if (nodes.size >= brainMaxNodes || brainExcludedNames.has(entry.name.toLowerCase()) || entry.isSymbolicLink()) continue;
        const entryPath = path.join(directory, entry.name);
        if (!isAllowedBrainPath(entryPath)) continue;
        let stat: fs.Stats;
        try { stat = await fs.promises.stat(entryPath); } catch { continue; }
        const isDirectory = stat.isDirectory();
        if (!isDirectory && !stat.isFile()) continue;
        const id = brainNodeId(entryPath);
        add({ id, parentId, path: entryPath, label: entry.name, type: isDirectory ? 'directory' : 'file', size: isDirectory ? null : stat.size, modifiedAt: stat.mtime.toISOString() });
        if (isDirectory) await visit(entryPath, id);
      }
    };
    for (const rootPath of brainRoots) {
      if (nodes.size >= brainMaxNodes) break;
      let stat: fs.Stats;
      try { stat = await fs.promises.stat(rootPath); } catch { continue; }
      const id = brainNodeId(rootPath);
      add({ id, parentId: brainRootId, path: rootPath, label: path.basename(rootPath), type: 'directory', size: null, modifiedAt: stat.mtime.toISOString() });
      await visit(rootPath, id);
    }
    for (const list of children.values()) list.sort((left, right) => (nodes.get(left)?.label || '').localeCompare(nodes.get(right)?.label || '', undefined, { numeric: true, sensitivity: 'base' }));
    brainNodes = nodes;
    brainChildren = children;
    brainIndexBuiltAt = new Date().toISOString();
  })().finally(() => { brainIndexBusy = null; });
  return brainIndexBusy;
}

async function ensureOwnerLocalBrainIndex(): Promise<void> {
  if (!brainIndexBuiltAt) await rebuildOwnerLocalBrainIndex();
}

function serializeBrainNode(node: BrainNode) {
  const childCount = brainChildren.get(node.id)?.length || 0;
  return {
    id: node.id,
    parent_id: node.parentId,
    label: node.label,
    type: node.type,
    status: 'OBSERVED_LOCAL_METADATA',
    child_count: childCount,
    expandable: node.type === 'directory',
    content_url: node.type === 'file' ? `/api/digital-brain/file/${encodeURIComponent(node.id)}` : null,
    metadata: {
      owner_scope: 'CURRENT_WINDOWS_USER_ONLY',
      content_access: node.type === 'file' ? 'EXPLICIT_LOCAL_OPEN_ONLY' : 'NOT_APPLICABLE',
      size_bytes: node.size,
      modified_at: node.modifiedAt
    }
  };
}

function brainEnvelope(result: unknown) {
  return { ok: true, bodyId: brainBodyId, source: 'OWNER_LOCAL_BRAIN_INDEX', result };
}

app.post('/api/digital-brain/query', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const operation = String(req.body?.operation || '').trim();
  const args = req.body?.args && typeof req.body.args === 'object' ? req.body.args as Record<string, unknown> : {};
  try {
    await ensureOwnerLocalBrainIndex();
    if (operation === 'root') return res.json(brainEnvelope({ node: serializeBrainNode(brainNodes.get(brainRootId)!) }));
    if (operation === 'children') {
      const id = String(args.id || '');
      const parent = brainNodes.get(id);
      const offset = Number(args.offset || 0);
      const limit = Math.min(128, Math.max(1, Number(args.limit || 128)));
      if (!parent || parent.type !== 'directory' || !Number.isSafeInteger(offset) || offset < 0) return res.status(404).json({ ok: false, error: 'BRAIN_NODE_NOT_FOUND' });
      const children = brainChildren.get(id) || [];
      const page = children.slice(offset, offset + limit).map((childId) => serializeBrainNode(brainNodes.get(childId)!));
      return res.json(brainEnvelope({ node: serializeBrainNode(parent), nodes: page, offset, total: children.length, hasMore: offset + page.length < children.length }));
    }
    if (operation === 'node') {
      const node = brainNodes.get(String(args.id || ''));
      if (!node) return res.status(404).json({ ok: false, error: 'BRAIN_NODE_NOT_FOUND' });
      const ancestors: ReturnType<typeof serializeBrainNode>[] = [];
      let current = node.parentId ? brainNodes.get(node.parentId) : undefined;
      while (current && ancestors.length < 128) { ancestors.unshift(serializeBrainNode(current)); current = current.parentId ? brainNodes.get(current.parentId) : undefined; }
      const siblings = node.parentId ? brainChildren.get(node.parentId) || [] : [];
      const pageOffset = Math.max(0, Math.floor(Math.max(0, siblings.indexOf(node.id)) / 128) * 128);
      return res.json(brainEnvelope({ node: serializeBrainNode(node), ancestors, pageOffset, links: [], provenance: [{ kind: 'OWNER_LOCAL_METADATA', description: 'Current Windows user, approved library scope, no cloud transfer.' }] }));
    }
    if (operation === 'search') {
      const query = String(args.query || '').trim().toLocaleLowerCase();
      const nodes = query.length < 2 ? [] : [...brainNodes.values()].filter((node) => node.id !== brainRootId && node.label.toLocaleLowerCase().includes(query)).slice(0, 32).map(serializeBrainNode);
      return res.json(brainEnvelope({ nodes }));
    }
    return res.status(400).json({ ok: false, error: 'BRAIN_OPERATION_NOT_SUPPORTED' });
  } catch (error) {
    return res.status(503).json({ ok: false, error: error instanceof Error ? error.message : 'BRAIN_INDEX_UNAVAILABLE' });
  }
});

app.post('/api/digital-brain/refresh', async (_req, res) => {
  try { await rebuildOwnerLocalBrainIndex(); return res.json({ state: 'OWNER_LOCAL_INDEX_REFRESHED', indexedAt: brainIndexBuiltAt, roots: brainRoots.map((root) => path.basename(root)), count: brainNodes.size }); }
  catch (error) { return res.status(503).json({ state: 'BLOCKED', reason: error instanceof Error ? error.message : 'BRAIN_INDEX_UNAVAILABLE' }); }
});

app.get('/api/digital-brain/file/:nodeId', async (req, res) => {
  await ensureOwnerLocalBrainIndex();
  const node = brainNodes.get(String(req.params.nodeId || ''));
  if (!node?.path || node.type !== 'file' || !isAllowedBrainPath(node.path)) return res.sendStatus(404);
  let stat: fs.Stats;
  try { stat = await fs.promises.stat(node.path); } catch { return res.sendStatus(404); }
  if (!stat.isFile() || stat.size > 50 * 1024 * 1024) return res.status(413).json({ state: 'BLOCKED', reason: 'LOCAL_FILE_PREVIEW_SIZE_LIMIT' });
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const extension = path.extname(node.label).toLowerCase();
  if (['.txt', '.md', '.json', '.csv', '.log', '.js', '.ts', '.tsx', '.css', '.html', '.ps1', '.py', '.yml', '.yaml', '.xml'].includes(extension)) res.type('text/plain; charset=utf-8');
  return res.sendFile(node.path, { headers: { 'Content-Disposition': 'inline' } });
});

app.get('/brain/organization', async (_req, res) => {
  await ensureOwnerLocalBrainIndex();
  res.setHeader('Cache-Control', 'no-store');
  res.json({ state: 'OWNER_LOCAL_APPROVED_LIBRARY_SCOPE', owner: 'CURRENT_WINDOWS_USER_ONLY', roots: brainRoots.map((root) => ({ label: path.basename(root), index: 'METADATA_ONLY' })), excluded: ['AppData', '.codex', 'browser profiles', 'LeeWay workspace'] });
});
app.get('/brain/inventory', async (_req, res) => { await ensureOwnerLocalBrainIndex(); res.setHeader('Cache-Control', 'no-store'); res.json({ state: 'OBSERVED_OWNER_LOCAL_INDEX', indexedAt: brainIndexBuiltAt, nodeCount: brainNodes.size, maximumNodes: brainMaxNodes }); });
app.get('/brain/files', async (_req, res) => { await ensureOwnerLocalBrainIndex(); res.setHeader('Cache-Control', 'no-store'); res.json({ files: [...brainNodes.values()].filter((node) => node.type === 'file').length, directories: [...brainNodes.values()].filter((node) => node.type === 'directory').length, source: 'OWNER_LOCAL_BRAIN_INDEX' }); });
// Raw filesystem paths are never accepted from a web view.  File delivery is
// only by an opaque node ID issued from the owner-local approved-library index.
app.all('/brain/files/content', (_req, res) => res.status(410).json({ state: 'BLOCKED', reason: 'OPAQUE_LOCAL_FILE_NODE_REQUIRED' }));

if (digitalBrainRoot && fs.existsSync(path.join(digitalBrainRoot, 'brain.html'))) {
  app.use('/brain-ui', express.static(digitalBrainRoot));
}

app.get('/standalone.html', (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'standalone.html'));
});
app.get('/standalone', (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'standalone.html'));
});
app.get('/api/download/standalone', (_req, res) => {
  res.download(path.join(process.cwd(), 'public', 'standalone.html'), 'leeway_agent_workstation_standalone.html');
});

app.get('/api/github/status', async (_req, res) => {
  try {
    const branch = (await execAsync('git branch --show-current')).stdout.trim() || 'main';
    const lastCommit = (await execAsync('git log -1 --pretty=format:"%h - %s (%ci)"')).stdout.trim();
    const statusText = (await execAsync('git status --short')).stdout.trim();
    return res.json({
      status: 'ok',
      branch,
      lastCommit: lastCommit || 'No commits yet',
      dirty: Boolean(statusText),
      changedFiles: statusText ? statusText.split('\n').map((line) => line.trim()) : [],
      defaultRepoName: 'LeeWay-Digital-Workforce'
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/github/push', async (req, res) => {
  const token = String(req.body?.token || '').trim();
  const username = String(req.body?.username || '').trim();
  const repoName = String(req.body?.repoName || 'LeeWay-Digital-Workforce').trim().replace(/[^a-zA-Z0-9._-]/g, '-');
  const isPrivate = Boolean(req.body?.isPrivate);
  const commitMessage = String(req.body?.commitMessage || 'Update from LeeWay Agent Tablet').replace(/"/g, '\"');
  if (!token || !username) {
    return res.status(400).json({ status: 'error', message: 'GitHub token and username are required.' });
  }

  const logs: string[] = [];
  const cleanRemote = 'https://github.com/' + username + '/' + repoName + '.git';
  const authRemote = 'https://' + encodeURIComponent(username) + ':' + encodeURIComponent(token) + '@github.com/' + username + '/' + repoName + '.git';

  try {
    const check = await fetch('https://api.github.com/repos/' + username + '/' + repoName, {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'User-Agent': 'LeeWay-Agent-Tablet' }
    });
    if (check.status === 404) {
      const create = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'LeeWay-Agent-Tablet'
        },
        body: JSON.stringify({ name: repoName, private: isPrivate, auto_init: false })
      });
      if (!create.ok && create.status !== 422) throw new Error('Repository creation failed: HTTP ' + create.status);
      logs.push('Repository created or already exists.');
    } else if (!check.ok) {
      throw new Error('Repository lookup failed: HTTP ' + check.status);
    }

    await execAsync('git add -A');
    try { await execAsync('git commit -m "' + commitMessage + '"'); } catch {}
    await execAsync('git branch -M main');
    try { await execAsync('git remote remove origin'); } catch {}
    await execAsync('git remote add origin "' + authRemote + '"');
    await execAsync('git push -u origin main');
    await execAsync('git remote set-url origin "' + cleanRemote + '"');

    logs.push('Push completed and credential removed from remote URL.');
    return res.json({ status: 'ok', repoUrl: 'https://github.com/' + username + '/' + repoName, logs });
  } catch (error) {
    try { await execAsync('git remote set-url origin "' + cleanRemote + '"'); } catch {}
    return res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
      logs
    });
  }
});

// Continuum is owned by the Agent Lee carrier, not the Formula-only service.
// Keep the environment override portable, but bind the local default to the
// canonical carrier that exposes owner-admitted shared-memory operations.
const CONTINUUM_RUNTIME_API = String(process.env.LEEWAY_CONTINUUM_API || 'http://127.0.0.1:8890').replace(/\/$/, '');
const CONTINUUM_CONTROL_TOKEN = String(process.env.LEEWAY_WORKPLANE_CONTROL_TOKEN || '');

const NOTEPAD_CHILDREN = {
  USER_NOTES: { payloadKey: 'userNotes', class: 'SANDBOX', trustState: 'CANDIDATE' },
  AGENT_SCRATCHPAD: { payloadKey: 'agentScratchpads', class: 'SANDBOX', trustState: 'CANDIDATE' },
  SHARED_BLACKBOARD: { payloadKey: 'sharedBlackboard', class: 'GOVERNED_PROJECTION', trustState: 'OBSERVED' },
  TASKS: { payloadKey: 'tasks', class: 'RUNTIME_STATE', trustState: 'OBSERVED' },
  DECISIONS: { payloadKey: 'decisions', class: 'GOVERNED_PROJECTION', trustState: 'CANDIDATE' },
  EVIDENCE_LINKS: { payloadKey: 'evidenceLinks', class: 'EVIDENCE', trustState: 'OBSERVED' },
  PROMOTED_MEMORY: { payloadKey: 'promotedMemoryCandidates', class: 'MEMORY', trustState: 'UNVERIFIED' },
  SANDBOX_ARTIFACTS: { payloadKey: 'sandboxArtifacts', class: 'SANDBOX', trustState: 'CANDIDATE' }
} as const;

function continuumNotepadKey(body: any) {
  const employer = String(body?.employerId || 'local').replace(/[^a-zA-Z0-9._-]/g, '_');
  const workspace = String(body?.workspaceId || 'default').replace(/[^a-zA-Z0-9._-]/g, '_');
  const agent = String(body?.agentId || 'agent-lee').replace(/[^a-zA-Z0-9._-]/g, '_');
  return employer + '/' + workspace + '/' + agent;
}
function continuumHeaders(contentType = 'application/json', requestKind?: string) {
  if (!CONTINUUM_CONTROL_TOKEN) throw new Error('LEEWAY_WORKPLANE_CONTROL_TOKEN_NOT_CONFIGURED');
  return {
    'content-type': contentType,
    origin: CONTINUUM_RUNTIME_API,
    'x-leeway-control-token': CONTINUUM_CONTROL_TOKEN,
    'x-leeway-doorway': 'DIGITAL_WORKFORCE_AGENT_VT',
    ...(requestKind ? { 'x-continuum-request': requestKind } : {})
  };
}
function continuumNotepadTitle(key: string) { return 'agent-notepad/' + key; }
function continuumSearchUrl(key: string) {
  const query = new URLSearchParams({ query: continuumNotepadTitle(key), limit: '10' });
  return CONTINUUM_RUNTIME_API + '/api/continuum/search?' + query.toString();
}

app.get('/api/continuum/notepad', async (req, res) => {
  const key=continuumNotepadKey(req.query);
  try{
    const search=await fetch(continuumSearchUrl(key),{headers:continuumHeaders()});
    const searchBody=await search.json();
    if(!search.ok) return res.status(search.status).json({state:'CONTINUUM_RUNTIME_READ_FAILED',key,upstream:searchBody});
    const hits=Array.isArray(searchBody?.result?.hits)?searchBody.result.hits:[];
    const hit=hits.find((candidate:any)=>candidate?.title===continuumNotepadTitle(key)||candidate?.label===continuumNotepadTitle(key))||hits[0];
    const recordId=hit?.recordId||hit?.id;
    if(typeof recordId!=='string'||!recordId) return res.status(404).json({state:'CONTINUUM_NOTEPAD_NOT_FOUND',key,parentCellRef:'leeway://continuum/agent-workspace/notepad/'+key});
    const content=await fetch(CONTINUUM_RUNTIME_API + '/api/continuum/content?recordId='+encodeURIComponent(recordId),{headers:continuumHeaders()});
    if(!content.ok) return res.status(content.status).json({state:'CONTINUUM_RUNTIME_READ_FAILED',key,recordId});
    const raw=Buffer.from(await content.arrayBuffer()).toString('utf8');
    const parsed=JSON.parse(raw);
    return res.json({state:'CONTINUUM_NOTEPAD_RUNTIME_FEDERATED',key,parentCellRef:'leeway://continuum/agent-workspace/notepad/'+key,recordId,payload:parsed?.payload??parsed});
  }catch(error){
    return res.status(503).json({state:'CONTINUUM_RUNTIME_UNAVAILABLE',key,error:error instanceof Error?error.message:String(error)});
  }
});

app.post('/api/continuum/notepad', async (req, res) => {
  const key=continuumNotepadKey(req.body); const payload=req.body?.payload;
  if(!payload||typeof payload!=='object') return res.status(400).json({state:'CONTINUUM_NOTEPAD_INVALID_PAYLOAD'});
  const parentCellRef='leeway://continuum/agent-workspace/notepad/'+key;
  const authorityOwner=String(req.body?.authorityOwner||req.body?.agentId||'agent-lee');
  const records=Object.entries(NOTEPAD_CHILDREN).map(([childId,spec])=>({
    schema:'leeway-continuum-agent-notepad-child-v0.1',key,childId,parentCellRef,cellRef:parentCellRef+'/'+childId.toLowerCase(),
    class:spec.class,authorityOwner,trustState:spec.trustState,promotionState:childId==='EVIDENCE_LINKS'?'REFERENCE_ONLY':'NOT_PROMOTED',
    persistenceProvider:'RUNTIME_FABRIC_CONTINUUM',updatedAt:new Date().toISOString(),value:payload[spec.payloadKey]??null
  }));
  try{
    const requestId='agent-notepad-'+randomBytes(10).toString('hex');
    const document=JSON.stringify({schema:'leeway-continuum-agent-notepad-universe-v0.1',key,parentCellRef,records,payload});
    const query=new URLSearchParams({requestId,title:continuumNotepadTitle(key),mimeType:'application/json',viewId:'knowledge'});
    const upstream=await fetch(CONTINUUM_RUNTIME_API + '/api/continuum/import?'+query.toString(),{
      method:'POST',headers:continuumHeaders('application/octet-stream','owner-import'),body:Buffer.from(document,'utf8')
    });
    const body=await upstream.json();
    if(!upstream.ok) return res.status(upstream.status).json({state:'CONTINUUM_RUNTIME_WRITE_FAILED',key,upstream:body});
    return res.json({state:'CONTINUUM_NOTEPAD_RUNTIME_FEDERATED_DURABLE',key,parentCellRef,records,requestId,recordId:body?.result?.recordId||body?.result?.id||null,upstream:body});
  }catch(error){
    return res.status(503).json({state:'CONTINUUM_RUNTIME_UNAVAILABLE',key,error:error instanceof Error?error.message:String(error)});
  }
});

app.get('/api/download/repo-archive', (_req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="leeway_digital_workforce_source.tar.gz"');
  res.setHeader('Content-Type', 'application/gzip');
  const tarProc = spawn('tar', ['-czf', '-', '--exclude=node_modules', '--exclude=dist', '--exclude=.git', '.']);
  tarProc.stdout.pipe(res);
  res.on('close', () => tarProc.kill());
  tarProc.on('error', () => {
    if (!res.headersSent) res.status(500).send('Archive failed');
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('LeeWay Agent Tablet running on http://0.0.0.0:' + PORT);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
