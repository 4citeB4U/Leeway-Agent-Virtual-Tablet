/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.DIGITAL_WORKFORCE.INTEGRATION
TAG: WORKFORCE.RUNTIME_FABRIC.READONLY_MCP_CLIENT_V1
5WH: WHAT=Consume canonical Runtime Fabric MCP runtime_health without claiming production execution;
WHY=Replace source-only binding with real scoped authenticated discovery; WHO=LeeWay Digital Workforce;
WHERE=integration/runtime-fabric/workforce-runtime-mcp.mjs; WHEN=2026-10-27;
HOW=Server-only Pocket ID bearer, fixed MCP lifecycle, bounded response and fail-closed verification.
AUTHORITY: Read-only consumer; does not issue tokens, dispatch tasks, sign Veritas or write ledgers.
LICENSE: MIT.
*/
const MAX_RESPONSE_BYTES = 65536;
const VALID_SESSION = /^[A-Za-z0-9._-]{1,160}$/;
const PROTOCOL = '2025-06-18';
const blocked = (reason) => ({
  state: 'BLOCKED', reason, runtimeDiscovery: 'UNVERIFIED',
  productionExecutionAuthorized: false, formulaExecuted: false,
  veritasAccepted: false, receiptAdmitted: false, learningAdmitted: false
});

// Token is supplied by the authenticated caller, never taken from an unauthenticated
// browser call or a shared server impersonation credential.
export function scopedBearerFromAuthorization(header) {
  if (typeof header !== 'string' || header.length < 10 || header.length > 8200) return null;
  const match = /^Bearer ([A-Za-z0-9._~-]+)$/.exec(header);
  return match && match[1].length <= 8192 ? match[1] : null;
}

export function resolveWorkforceMcpConfig(env = {}) {
  const input = env.LEEWAY_WORKFORCE_MCP_RESOURCE_URL;
  if (typeof input !== 'string' || !input) return { ok: false, reason: 'CANONICAL_MCP_RESOURCE_UNCONFIGURED' };
  let url;
  try { url = new URL(input); }
  catch { return { ok: false, reason: 'INVALID_MCP_RESOURCE' }; }
  if (url.protocol !== 'https:' || url.pathname !== '/mcp' ||
      url.search || url.hash || url.username || url.password ||
      url.href !== url.origin + '/mcp' ||
      url.hostname === 'localhost' || url.hostname.endsWith('.local') ||
      url.hostname.endsWith('.internal') || url.hostname === '[::1]' ||
      /^\d{1,3}(\.\d{1,3}){3}$/.test(url.hostname) ||
      !url.hostname.includes('.')) {
    return { ok: false, reason: 'UNSAFE_MCP_RESOURCE' };
  }
  const token = env.LEEWAY_WORKFORCE_MCP_ACCESS_TOKEN;
  if (typeof token !== 'string' || !token || token.length > 8192 || /[\s]/.test(token)) {
    return { ok: false, reason: 'SCOPED_ACCESS_TOKEN_UNAVAILABLE' };
  }
  return { ok: true, resource: url.href, token };
}

export function resolveLocalWorkforceRuntimeConfig(env = {}) {
  const input = env.LEEWAY_WORKFORCE_LOCAL_RUNTIME_URL;
  if (typeof input !== 'string' || !input) return { ok: false, reason: 'LOCAL_RUNTIME_RESOURCE_UNCONFIGURED' };
  let url;
  try { url = new URL(input); }
  catch { return { ok: false, reason: 'INVALID_LOCAL_RUNTIME_RESOURCE' }; }
  if (url.protocol !== 'http:' || !['127.0.0.1', '[::1]'].includes(url.hostname) ||
      url.pathname !== '/v1/workforce/snapshot' || !url.port ||
      url.search || url.hash || url.username || url.password ||
      url.href !== `${url.origin}/v1/workforce/snapshot`) {
    return { ok: false, reason: 'UNSAFE_LOCAL_RUNTIME_RESOURCE' };
  }
  return { ok: true, resource: url.href };
}

async function parseResponse(response) {
  if (!response || !Number.isInteger(response.status) || response.status < 200 || response.status > 299) {
    throw new Error('MCP_HTTP_REJECTED');
  }
  const type = String(response.headers?.get('content-type') || '');
  const raw = await response.text();
  if (Buffer.byteLength(raw, 'utf8') > MAX_RESPONSE_BYTES) throw new Error('MCP_RESPONSE_OVERSIZE');
  if (type.includes('application/json')) {
    try { return JSON.parse(raw); }
    catch { throw new Error('MCP_INVALID_JSON'); }
  }
  if (type.includes('text/event-stream')) {
    const events = raw.split(/\r?\n\r?\n/);
    for (const event of events) {
      const data = event.split(/\r?\n/).filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim()).join('\n');
      if (!data || data === '[DONE]') continue;
      try { const parsed = JSON.parse(data); if (parsed.jsonrpc === '2.0') return parsed; }
      catch { throw new Error('MCP_INVALID_EVENT'); }
    }
    throw new Error('MCP_EMPTY_EVENT_STREAM');
  }
  throw new Error('MCP_UNSUPPORTED_MEDIA_TYPE');
}

function boundedReport(data) {
  if (!data || data.runtimeFabric?.status !== 'AVAILABLE' ||
      data.runtimeFabric?.authentication !== 'POCKET_ID_ACCESS_TOKEN_VERIFIED' ||
      typeof data.providerComposition !== 'object' || data.providerComposition === null ||
      data.mutation !== 'NOT_ATTEMPTED' || data.authenticatedDeviceCommand !== 'NOT_PROBED') {
    return blocked('MCP_HEALTH_CONTRACT_MISMATCH');
  }
  const known = ['deviceBridge', 'continuum', 'formula', 'independentVeritas', 'receiptAdmission'];
  const providerComposition = Object.fromEntries(known.map((key) =>
    [key, data.providerComposition[key] === 'NOT_PROBED' ? 'NOT_PROBED' : 'UNVERIFIED']
  ));
  return {
    state: 'AUTHENTICATED_READ_ONLY_OBSERVED',
    runtimeDiscovery: 'OBSERVED',
    transport: 'MCP_STREAMABLE_HTTP', tool: 'runtime_health',
    providerComposition,
    productionExecutionAuthorized: false, formulaExecuted: false,
    veritasAccepted: false, receiptAdmitted: false, learningAdmitted: false
  };
}

function boundedEvent(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  const allowed = [
    'type', 'title', 'description', 'detail', 'workerId', 'workId', 'parentObjectiveId',
    'executionIdentity', 'threadId', 'sessionId', 'turnId', 'resumed', 'engineeringStage',
    'observedAt', 'failure', 'verified', 'canonicalAcceptance', 'messageId', 'correlationId',
    'senderWorkerId', 'senderWorkId', 'senderExecutionIdentity', 'recipientWorkerId',
    'recipientWorkId', 'recipientThreadId', 'recipientTurnId', 'deliveryStatus',
    'authentication', 'sourceRefs'
  ];
  return Object.fromEntries(allowed.filter((key) => Object.hasOwn(entry, key)).map((key) => [key, entry[key]]));
}

function boundedLocalSnapshot(data) {
  if (!data || data.schemaVersion !== 'leeway.runtime.codex-workforce-snapshot.v1' ||
      data.state !== 'AUTHENTICATED_LOCAL_RUNTIME_OBSERVED' || data.runtimeDiscovery !== 'OBSERVED' ||
      data.transport !== 'CODEX_LOCAL_THREAD_ADAPTER_LOOPBACK' ||
      data.authentication !== 'EXISTING_ADAPTER_BEARER_VERIFIED' ||
      data.productionExecutionAuthorized !== false || data.formulaExecuted !== false ||
      data.veritasAccepted !== false || data.receiptAdmitted !== false || data.learningAdmitted !== false ||
      data.authorityBoundary?.canonicalWorkerIdentityVerified !== false ||
      data.authorityBoundary?.primeIdentityVerified !== false ||
      !Array.isArray(data.workers) || data.workers.length > 18 ||
      !Array.isArray(data.events) || data.events.length > 150 ||
      !Array.isArray(data.collaborationEvents) || data.collaborationEvents.length > 100 ||
      !Array.isArray(data.primeEvents) || data.primeEvents.length !== 0 ||
      !Array.isArray(data.approvalsEvents) || data.approvalsEvents.length > 100) {
    return blocked('LOCAL_RUNTIME_SNAPSHOT_CONTRACT_MISMATCH');
  }
  const seen = new Set();
  const workers = [];
  for (const entry of data.workers) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) ||
        !/^W(?:0[0-9]|1[0-7])$/.test(String(entry.workerId || '')) || seen.has(entry.workerId) ||
        !['COMPLETED', 'FAILED', 'BLOCKED', 'CHECKPOINTED', 'PAUSED', 'RUNNING'].includes(entry.state) ||
        entry.evidenceState !== 'OBSERVED' || entry.executorObserved !== true ||
        entry.source !== 'codex-app-server' || typeof entry.observedAt !== 'string' ||
        typeof entry.workId !== 'string' || typeof entry.executionIdentity !== 'string' ||
        typeof entry.threadId !== 'string' || typeof entry.sessionId !== 'string' ||
        entry.verified !== false || entry.canonicalAcceptance !== false) {
      return blocked('LOCAL_RUNTIME_WORKER_CONTRACT_MISMATCH');
    }
    seen.add(entry.workerId);
    workers.push({
      id: entry.workerId,
      state: entry.state,
      evidenceState: 'OBSERVED',
      observedAt: entry.observedAt,
      heartbeatAt: entry.heartbeatAt,
      source: entry.source,
      executorObserved: true,
      workId: entry.workId,
      stage: entry.engineeringStage || null,
      nextAction: entry.nextAction || null,
      executionIdentity: entry.executionIdentity,
      threadId: entry.threadId,
      sessionId: entry.sessionId,
      turnId: entry.turnId || null,
      resumed: entry.resumed === true,
      verified: false,
      canonicalAcceptance: false
    });
  }
  const events = data.events.map(boundedEvent).filter(Boolean);
  const collaborationEvents = data.collaborationEvents.map(boundedEvent).filter(Boolean);
  const primeEvents = data.primeEvents.map(boundedEvent).filter(Boolean);
  const approvalsEvents = data.approvalsEvents.map(boundedEvent).filter(Boolean);
  return {
    state: 'AUTHENTICATED_LOCAL_RUNTIME_OBSERVED',
    reason: 'LOCAL_RUNTIME_PROVIDER_EVIDENCE_ONLY',
    runtimeDiscovery: 'OBSERVED',
    transport: 'CODEX_LOCAL_THREAD_ADAPTER_LOOPBACK',
    workers,
    events,
    collaborationEvents,
    primeEvents,
    approvalsEvents,
    productionExecutionAuthorized: false,
    formulaExecuted: false,
    veritasAccepted: false,
    receiptAdmitted: false,
    learningAdmitted: false
  };
}

export async function probeLocalWorkforceRuntime({
  env = process.env, authorizationToken = '', fetchImpl = fetch, timeoutMs = 5000
} = {}) {
  const config = resolveLocalWorkforceRuntimeConfig(env);
  if (!config.ok) return blocked(config.reason);
  if (!scopedBearerFromAuthorization(`Bearer ${authorizationToken || ''}`)) return blocked('CALLER_BEARER_UNAVAILABLE');
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), Math.min(Math.max(timeoutMs, 100), 10000));
  try {
    const response = await fetchImpl(config.resource, {
      method: 'GET',
      redirect: 'error',
      headers: { Authorization: `Bearer ${authorizationToken}`, Accept: 'application/json' },
      signal: controller.signal
    });
    const parsed = await parseResponse(response);
    return boundedLocalSnapshot(parsed);
  } catch {
    return blocked('LOCAL_RUNTIME_UNAVAILABLE_OR_REJECTED');
  } finally {
    clearTimeout(deadline);
  }
}

export async function probeWorkforceRuntimeMcp({
  env = process.env, fetchImpl = fetch, timeoutMs = 5000
} = {}) {
  const config = resolveWorkforceMcpConfig(env);
  if (!config.ok) return blocked(config.reason);
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), Math.min(Math.max(timeoutMs, 100), 10000));
  let session;
  try {
    const rpc = async (method, params, id) => {
      const headers = {
        'Authorization': 'Bearer ' + config.token,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'MCP-Protocol-Version': PROTOCOL
      };
      if (session) headers['Mcp-Session-Id'] = session;
      const payload = { jsonrpc: '2.0', method, params };
      if (id !== undefined) payload.id = id;
      const response = await fetchImpl(config.resource, {
        method: 'POST', redirect: 'error', headers,
        body: JSON.stringify(payload), signal: controller.signal
      });
      const received = response.headers?.get('mcp-session-id');
      if (received) {
        if (!VALID_SESSION.test(received) || (session && received !== session)) {
          throw new Error('MCP_SESSION_MISMATCH');
        }
        session = received;
      }
      if (id === undefined) {
        if (response.status !== 202 && response.status !== 200) {
          throw new Error('MCP_INITIALIZED_REJECTED');
        }
        return null;
      }
      const result = await parseResponse(response);
      if (result.jsonrpc !== '2.0' || result.id !== id || result.error ||
          typeof result.result !== 'object' || result.result === null) {
        throw new Error('MCP_RESPONSE_ID_OR_RESULT_MISMATCH');
      }
      return result.result;
    };
    const initialized = await rpc('initialize', {
      protocolVersion: PROTOCOL, capabilities: {},
      clientInfo: { name: 'leeway-digital-workforce-readonly', version: '1.0.0' }
    }, 1);
    if (!initialized.serverInfo || !initialized.capabilities ||
        initialized.protocolVersion !== PROTOCOL) throw new Error('MCP_INITIALIZATION_INVALID');
    await rpc('notifications/initialized', {}, undefined);
    const catalog = await rpc('tools/list', {}, 2);
    const tools = Array.isArray(catalog.tools) ? catalog.tools : [];
    if (!tools.some((item) => item.name === 'runtime_health' &&
          item.annotations?.readOnlyHint === true)) {
      return blocked('READONLY_RUNTIME_HEALTH_NOT_ADVERTISED');
    }
    const result = await rpc('tools/call', { name: 'runtime_health', arguments: {} }, 3);
    if (result.isError || !Array.isArray(result.content)) return blocked('MCP_TOOL_ERROR');
    const body = result.content.find((item) => item?.type === 'text' && typeof item.text === 'string');
    if (!body || Buffer.byteLength(body.text, 'utf8') > MAX_RESPONSE_BYTES) {
      return blocked('MCP_HEALTH_CONTENT_UNAVAILABLE');
    }
    let parsed;
    try { parsed = JSON.parse(body.text); }
    catch { return blocked('MCP_HEALTH_CONTENT_INVALID'); }
    return boundedReport(parsed);
  } catch {
    // No exceptions, tokens, remote errors, or private endpoint details are returned to clients.
    return blocked('MCP_UNAVAILABLE_OR_REJECTED');
  } finally {
    clearTimeout(deadline);
  }
}
