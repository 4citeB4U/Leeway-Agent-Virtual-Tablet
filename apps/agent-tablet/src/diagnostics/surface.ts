/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT.TABLET.DIAGNOSTICS.SURFACE
TAG: LEEWAY.TABLET.ORIGINAL.DIAGNOSTICS.SURFACE.RESOLUTION.V1
5WH:
WHAT = Resolve the original Diagnostics Matrix surface through existing Runtime application-surface decisions.
WHY = Remove universal loopback/body assumptions while keeping the local preview adapter authorized.
WHO = Creator-authorized Tablet surface maintainer; Runtime Fabric retains surface authority.
WHERE = apps/agent-tablet/src/diagnostics/surface.ts.
WHEN = 2026-11-26.
HOW = Consume resolvePublishedAppSurface decisions, validate local adapter configuration and return a same-origin proxy path.
LICENSE = Repository terms; no new license asserted.
*/

import { resolvePublishedAppSurface, type PublishedAppSurfaceDecision } from '../mobileSurfacePolicy.mjs';

export type DiagnosticsSurfaceState = 'AUTHORIZED' | 'UNAVAILABLE' | 'DENIED';

export interface DiagnosticsSurfaceConfig {
  state: 'LOCAL_ADAPTER_AUTHORIZED' | 'UNAVAILABLE';
  origin: string | null;
  bodyId: string | null;
  matrixPath: string | null;
  observationVersion: string | null;
  reason?: string | null;
}

export interface DiagnosticsSurfaceResolution {
  state: DiagnosticsSurfaceState;
  iframeSrc: string | null;
  bodyId: string | null;
  observationVersion: string | null;
  reason: string | null;
  source: 'RUNTIME_DECISION' | 'LOCAL_ADAPTER_CONFIG' | 'NONE';
  decisionState?: string;
}

export const BODY_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

const isLoopbackOrigin = (origin: string): boolean => {
  try {
    const parsed = new URL(origin);
    return parsed.protocol === 'http:' &&
      ['127.0.0.1', 'localhost', '::1'].includes(parsed.hostname.toLowerCase()) &&
      parsed.username === '' && parsed.password === '';
  } catch {
    return false;
  }
};

const isHttpsOrigin = (origin: string): boolean => {
  try {
    const parsed = new URL(origin);
    return parsed.protocol === 'https:' && parsed.username === '' && parsed.password === '';
  } catch {
    return false;
  }
};

function validBodyId(value: unknown): string | null {
  return typeof value === 'string' && BODY_ID_PATTERN.test(value) ? value : null;
}

/**
 * Resolve the original Diagnostics surface. A Runtime decision takes precedence.
 * A local adapter config is accepted only when it is explicitly marked authorized
 * by the host; no 127.0.0.1 address or pc-primary identity is universal here.
 */
export function resolveDiagnosticsSurface({
  decision,
  config,
  queryBodyId,
  app,
  sameOrigin
}: {
  decision?: PublishedAppSurfaceDecision | null;
  config?: DiagnosticsSurfaceConfig | null;
  queryBodyId?: string | null;
  app?: unknown;
  sameOrigin?: string | null;
} = {}): DiagnosticsSurfaceResolution {
  if (queryBodyId !== undefined && queryBodyId !== null && queryBodyId !== '' && !validBodyId(queryBodyId)) {
    return {
      state: 'UNAVAILABLE', iframeSrc: null, bodyId: null,
      observationVersion: validObservationVersion(config?.observationVersion),
      reason: 'AUTHORIZED_BODY_ID_REQUIRED', source: 'NONE'
    };
  }
  const requestedBody = validBodyId(queryBodyId) ?? validBodyId(config?.bodyId);

  if (decision && app) {
    const resolved = resolvePublishedAppSurface(app as never, 'tablet', false, decision);
    if (!resolved.url) {
      return {
        state: decision.state === 'DENIED' ? 'DENIED' : 'UNAVAILABLE',
        iframeSrc: null,
        bodyId: requestedBody,
        observationVersion: validObservationVersion(config?.observationVersion),
        reason: resolved.reason || 'DIAGNOSTICS_SURFACE_NOT_AUTHORIZED',
        source: 'RUNTIME_DECISION',
        decisionState: decision.state
      };
    }
    // Hosted decisions may name an HTTPS surface. Local decisions must stay on loopback.
    const decisionOrigin = new URL(resolved.url).origin;
    if (!isHttpsOrigin(decisionOrigin) && !isLoopbackOrigin(decisionOrigin)) {
      return {
        state: 'UNAVAILABLE', iframeSrc: null, bodyId: requestedBody,
        observationVersion: null, reason: 'DIAGNOSTICS_SURFACE_ORIGIN_INVALID',
        source: 'RUNTIME_DECISION', decisionState: decision.state
      };
    }
    if (!requestedBody) {
      return {
        state: 'UNAVAILABLE', iframeSrc: null, bodyId: null, observationVersion: null,
        reason: 'AUTHORIZED_BODY_ID_REQUIRED', source: 'RUNTIME_DECISION', decisionState: decision.state
      };
    }
    const url = new URL('/diagnostics/matrix/matrix.html', decisionOrigin);
    url.searchParams.set('bodyId', requestedBody);
    return {
      state: 'AUTHORIZED', iframeSrc: url.toString(), bodyId: requestedBody,
      observationVersion: validObservationVersion(config?.observationVersion), reason: null,
      source: 'RUNTIME_DECISION', decisionState: decision.state
    };
  }

  if (config?.state !== 'LOCAL_ADAPTER_AUTHORIZED') {
    return {
      state: 'UNAVAILABLE', iframeSrc: null, bodyId: requestedBody,
      observationVersion: validObservationVersion(config?.observationVersion),
      reason: config?.reason || 'DIAGNOSTICS_SURFACE_CONFIG_UNAUTHORIZED', source: 'NONE'
    };
  }
  if (config.matrixPath == null ||
      !config.matrixPath.startsWith('/') || config.matrixPath.includes('..')) {
    return {
      state: 'UNAVAILABLE', iframeSrc: null, bodyId: requestedBody,
      observationVersion: validObservationVersion(config.observationVersion),
      reason: 'LOCAL_ADAPTER_BINDING_INVALID', source: 'LOCAL_ADAPTER_CONFIG'
    };
  }
  if (config.origin !== null) {
    if (!isLoopbackOrigin(config.origin)) {
      return {
        state: 'UNAVAILABLE', iframeSrc: null, bodyId: requestedBody,
        observationVersion: validObservationVersion(config.observationVersion),
        reason: 'LOCAL_ADAPTER_BINDING_INVALID', source: 'LOCAL_ADAPTER_CONFIG'
      };
    }
  } else if (!sameOrigin) {
    return {
      state: 'UNAVAILABLE', iframeSrc: null, bodyId: requestedBody,
      observationVersion: validObservationVersion(config.observationVersion),
      reason: 'LOCAL_ADAPTER_BINDING_INVALID', source: 'LOCAL_ADAPTER_CONFIG'
    };
  }
  if (!requestedBody) {
    return {
      state: 'UNAVAILABLE', iframeSrc: null, bodyId: null,
      observationVersion: validObservationVersion(config.observationVersion),
      reason: 'AUTHORIZED_BODY_ID_REQUIRED', source: 'LOCAL_ADAPTER_CONFIG'
    };
  }
  const proxyOrigin = config.origin || sameOrigin;
  if (!proxyOrigin || (!isLoopbackOrigin(proxyOrigin) && !isHttpsOrigin(proxyOrigin))) {
    return {
      state: 'UNAVAILABLE', iframeSrc: null, bodyId: requestedBody,
      observationVersion: validObservationVersion(config.observationVersion),
      reason: 'LOCAL_ADAPTER_BINDING_INVALID', source: 'LOCAL_ADAPTER_CONFIG'
    };
  }
  const url = new URL(config.matrixPath, proxyOrigin);
  url.searchParams.set('bodyId', requestedBody);
  return {
    state: 'AUTHORIZED', iframeSrc: url.toString(), bodyId: requestedBody,
    observationVersion: validObservationVersion(config.observationVersion), reason: null,
    source: 'LOCAL_ADAPTER_CONFIG'
  };
}

function validObservationVersion(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 && value.length <= 160 && !/[\x00-\x1f]/.test(value)
    ? value : null;
}
