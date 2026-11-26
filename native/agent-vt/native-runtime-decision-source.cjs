/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.NATIVE.RUNTIME.DECISION.SOURCE
TAG: LEEWAY.TABLET.NATIVE.RUNTIME.DECISION.TRANSPORT.V1
5WH:
WHAT = Connect native launch authorization to the original Runtime transport-backed application decision source.
WHY = Ensure local app URLs and restored Widgets cannot bypass current Runtime authorization.
WHO = Creator/Human Authority and the original Runtime application-admission authority.
WHERE = native/agent-vt/native-runtime-decision-source.cjs.
WHEN = 2026-11-25.
HOW = Read current host bindings per request and compose O09 transport with the existing Tablet decision source; fail closed when unbound.
LICENSE = Existing repository terms; no new rights declared.
*/
'use strict';

const path = require('node:path');
const { pathToFileURL } = require('node:url');

const decisionSourceUrl = pathToFileURL(path.resolve(
  __dirname, '..', '..', 'apps', 'agent-tablet', 'src',
  'runtimeProductAdmissionDecisionSource.mjs'
)).href;

function unboundError() {
  const error = new Error('ORIGINAL_RUNTIME_SERVICE_TRANSPORT_UNBOUND');
  error.code = 'ORIGINAL_RUNTIME_SERVICE_TRANSPORT_UNBOUND';
  return error;
}

function createAuthenticatedRuntimeSurfaceDecisionSource({
  getBindings = () => globalThis.__LEEWAY_AUTHENTICATED_RUNTIME_DECISION_BINDINGS
} = {}) {
  return async function authenticatedRuntimeSurfaceDecisionSource(app, surface, context) {
    const bindings = getBindings();
    if (!bindings ||
        typeof bindings.admission?.authorize !== 'function' ||
        typeof bindings.featurePolicy?.resolve !== 'function' ||
        !bindings.capabilityActionMap ||
        typeof bindings.capabilityActionMap !== 'object' ||
        Array.isArray(bindings.capabilityActionMap) ||
        typeof bindings.supplySurface !== 'function') {
      throw unboundError();
    }

    const { createRuntimeProductAdmissionDecisionSource } = await import(decisionSourceUrl);
    const source = createRuntimeProductAdmissionDecisionSource({
      admission: bindings.admission,
      featurePolicy: bindings.featurePolicy,
      capabilityActionMap: bindings.capabilityActionMap,
      supplySurface: bindings.supplySurface
    });
    return source(app, surface, context);
  };
}

module.exports = { createAuthenticatedRuntimeSurfaceDecisionSource };
