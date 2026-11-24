/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.USER_APP.MANIFEST
TAG: LEEWAY.TABLET.USER_APP.CANDIDATE_VALIDATION.V1
5WH:
WHAT = Validate portable, provenance-pinned user-authored Tablet application candidates.
WHY = Make app creation/import possible without replacing Runtime authority or accepting arbitrary GitHub code as installed.
WHO = Creator-authorized Tablet source contributors; original Runtime owns actual tenant admission.
WHERE = apps/agent-tablet/src/tabletAppManifest.mjs.
WHEN = 2026-11-23.
HOW = Pure fail-closed schema/URL/hash/platform/permission checks, no network or device execution.
LICENSE = Existing repository terms.
*/
export const TABLET_APP_SCHEMA = 'leeway.tablet-app.v1';
const ID = /^[a-z][a-z0-9-]{1,47}\.[a-z][a-z0-9-]{1,47}$/;
const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]{1,40})?$/;
const HASH40 = /^[a-f0-9]{40}$/i;
const HASH64 = /^[a-f0-9]{64}$/i;
const LICENSE = /^[A-Za-z0-9.+-]{2,64}$/;
const KNOWN_PLATFORMS = new Set(['Windows', 'Linux', 'Android', 'Apple']);
const KNOWN_SURFACES = new Set(['tablet', 'widget']);
const KNOWN_REQUESTS = new Set([
  'network.fetch', 'storage.read', 'storage.write', 'agent.workflow',
  'device.camera', 'device.microphone', 'device.bridge.read', 'device.bridge.execute'
]);
function reject(reason) { throw new Error('LEEWAY_APP_MANIFEST_' + reason); }
function record(value, field, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) reject(field + '_OBJECT_REQUIRED');
  if (Object.keys(value).some(k => !keys.includes(k))) reject(field + '_FIELD_NOT_ALLOWED');
  return value;
}
function string(value, field, max = 256) {
  if (typeof value !== 'string' || value.trim() !== value ||
      value.length === 0 || value.length > max || /[\u0000-\u001f]/.test(value)) reject(field + '_INVALID');
  return value;
}
function choices(values, field, allowed, max) {
  if (!Array.isArray(values) || values.length < 1 || values.length > max ||
      values.some(value => !allowed.has(value)) || new Set(values).size !== values.length)
    reject(field + '_INVALID');
  return [...values];
}
function publicHttps(value, field) {
  const input = string(value, field, 2048);
  let url;
  try { url = new URL(input); } catch { reject(field + '_URL_INVALID'); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || url.port ||
      !host.includes('.') || host === 'localhost' || host.endsWith('.localhost') ||
      host.endsWith('.local') || /^(127|10|192\.168|169\.254)\./.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[01])\./.test(host) ||
      /^\[/.test(host)) reject(field + '_PUBLIC_HTTPS_REQUIRED');
  return url.toString();
}

// A valid candidate is NOT an installed or authorized app. The original
// authenticated Runtime/Continuum publisher service must separately verify
// the bytes, signer, owner entitlement, provider origin and granted permissions.
export function validateTabletAppCandidate(input) {
  const data = record(input, 'ROOT', [
    'schema', 'appId', 'publisherId', 'title', 'version', 'source',
    'artifact', 'launch', 'platforms', 'surfaces', 'requestedPermissions'
  ]);
  if (data.schema !== TABLET_APP_SCHEMA) reject('SCHEMA_UNSUPPORTED');
  const appId = string(data.appId, 'APP_ID', 100);
  if (!ID.test(appId)) reject('APP_ID_INVALID');
  const publisherId = string(data.publisherId, 'PUBLISHER_ID', 48);
  if (!/^[a-z][a-z0-9-]{1,47}$/.test(publisherId) ||
      !appId.startsWith(publisherId + '.')) reject('PUBLISHER_ID_MISMATCH');
  const title = string(data.title, 'TITLE', 120);
  const version = string(data.version, 'VERSION', 80);
  if (!VERSION.test(version)) reject('VERSION_INVALID');
  const source = record(data.source, 'SOURCE', ['repositoryUrl', 'commitSha', 'license']);
  const repositoryUrl = publicHttps(source.repositoryUrl, 'SOURCE');
  const repository = new URL(repositoryUrl);
  if (repository.hostname.toLowerCase() !== 'github.com' || repository.search ||
      repository.hash || !/^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(repository.pathname))
    reject('SOURCE_GITHUB_REPOSITORY_REQUIRED');
  const commitSha = string(source.commitSha, 'COMMIT_SHA', 40);
  if (!HASH40.test(commitSha)) reject('COMMIT_SHA_INVALID');
  const license = string(source.license, 'LICENSE', 64);
  if (!LICENSE.test(license)) reject('LICENSE_INVALID');
  const artifact = record(data.artifact, 'ARTIFACT', ['kind', 'sha256']);
  if (artifact.kind !== 'web') reject('WEB_ARTIFACT_REQUIRED');
  const sha256 = string(artifact.sha256, 'ARTIFACT_SHA256', 64);
  if (!HASH64.test(sha256)) reject('ARTIFACT_SHA256_INVALID');
  const launch = record(data.launch, 'LAUNCH', ['url']);
  const launchUrl = publicHttps(launch.url, 'LAUNCH');
  const platforms = choices(data.platforms, 'PLATFORMS', KNOWN_PLATFORMS, 4);
  const surfaces = choices(data.surfaces, 'SURFACES', KNOWN_SURFACES, 2);
  const requestedPermissions = data.requestedPermissions === undefined ? [] :
    choices(data.requestedPermissions, 'REQUESTED_PERMISSIONS', KNOWN_REQUESTS, 8);
  return Object.freeze({
    schema: TABLET_APP_SCHEMA, appId, publisherId, title, version,
    source: Object.freeze({ repositoryUrl, commitSha: commitSha.toLowerCase(), license }),
    artifact: Object.freeze({ kind: 'web', sha256: sha256.toLowerCase() }),
    launch: Object.freeze({ url: launchUrl }),
    platforms: Object.freeze(platforms), surfaces: Object.freeze(surfaces),
    requestedPermissions: Object.freeze(requestedPermissions),
    candidateState: 'VALIDATED_SOURCE_CANDIDATE_ONLY',
    installed: false, executionAuthorized: false, toolGrants: 'NOT_GRANTED'
  });
}
