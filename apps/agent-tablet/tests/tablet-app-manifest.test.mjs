/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.USER_APP.MANIFEST.TEST
TAG: LEEWAY.TABLET.USER_APP.CANDIDATE_VALIDATION.TEST.V1
5WH:
WHAT = Verify app manifest acceptance, malicious package rejection and no implied installation/permission.
WHY = Permit future user app creation without bypassing LeeWay Runtime, publisher custody or device C3.
WHO = Creator-authorized Tablet test contributors.
WHERE = apps/agent-tablet/tests/tablet-app-manifest.test.mjs.
WHEN = 2026-11-23.
HOW = Offline Node fixtures; no remote access, live device or tenant-owned data.
LICENSE = Existing repository terms.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTabletAppCandidate, TABLET_APP_SCHEMA } from '../src/tabletAppManifest.mjs';

const fixture = () => ({
  schema: TABLET_APP_SCHEMA,
  appId: 'creator.dispatch-board',
  publisherId: 'creator',
  title: 'Dispatch Board',
  version: '1.0.0',
  source: { repositoryUrl: 'https://github.com/example/dispatch-board', commitSha: 'a'.repeat(40), license: 'MIT' },
  artifact: { kind: 'web', sha256: 'b'.repeat(64) },
  launch: { url: 'https://example.github.io/dispatch-board/' },
  platforms: ['Windows','Linux','Android','Apple'],
  surfaces: ['tablet','widget'],
  requestedPermissions: []
});

test('valid owned web app candidate carries immutable source identity but never install or grant', () => {
  const m = validateTabletAppCandidate(fixture());
  assert.equal(m.candidateState, 'VALIDATED_SOURCE_CANDIDATE_ONLY');
  assert.equal(m.installed, false);
  assert.equal(m.executionAuthorized, false);
  assert.equal(m.toolGrants, 'NOT_GRANTED');
  assert.equal(Object.isFrozen(m), true);
  assert.equal(m.source.commitSha, 'a'.repeat(40));
});

test('declaring sensitive permissions never confers them', () => {
  const m = fixture(); m.requestedPermissions = ['device.bridge.execute','device.camera','agent.workflow'];
  const parsed = validateTabletAppCandidate(m);
  assert.deepEqual([...parsed.requestedPermissions], m.requestedPermissions);
  assert.equal(parsed.executionAuthorized, false);
  assert.equal(parsed.toolGrants, 'NOT_GRANTED');
});

test('rejects forged install receipt, administrator bypass and unknown manifest controls', () => {
  for (const field of ['installed','verified','runtimeGrant','privateKey','containerCommand']) {
    const m = fixture(); m[field] = true;
    assert.throws(() => validateTabletAppCandidate(m), /ROOT_FIELD_NOT_ALLOWED/);
  }
});

test('denies arbitrary URLs, localhost, unsupported apps and unsigned source references', () => {
  for (const launchUrl of [
    'http://example.com/', 'javascript:alert(1)', 'https://127.0.0.1/',
    'https://192.168.1.12/', 'https://localhost/', 'https://user:pass@example.com/'
  ]) {
    const m = fixture(); m.launch.url = launchUrl;
    assert.throws(() => validateTabletAppCandidate(m), /LAUNCH_(URL_INVALID|PUBLIC_HTTPS_REQUIRED)/);
  }
  const ownerMismatch = fixture(); ownerMismatch.publisherId = 'outsider';
  assert.throws(() => validateTabletAppCandidate(ownerMismatch), /PUBLISHER_ID_MISMATCH/);
  const wrongSource = fixture(); wrongSource.source.repositoryUrl = 'https://git.example.com/private/repo';
  assert.throws(() => validateTabletAppCandidate(wrongSource), /SOURCE_GITHUB_REPOSITORY_REQUIRED/);
  const badHash = fixture(); badHash.artifact.sha256 = 'not-a-signature';
  assert.throws(() => validateTabletAppCandidate(badHash), /ARTIFACT_SHA256_INVALID/);
  const badKind = fixture(); badKind.artifact.kind = 'container';
  assert.throws(() => validateTabletAppCandidate(badKind), /WEB_ARTIFACT_REQUIRED/);
});

test('duplicate OS/surfaces, undeclared permissions and missing version are rejected', () => {
  const duplicatePlatform = fixture(); duplicatePlatform.platforms = ['Android','Android'];
  assert.throws(() => validateTabletAppCandidate(duplicatePlatform), /PLATFORMS_INVALID/);
  const badSurface = fixture(); badSurface.surfaces = ['tablet','admin'];
  assert.throws(() => validateTabletAppCandidate(badSurface), /SURFACES_INVALID/);
  const badPermission = fixture(); badPermission.requestedPermissions = ['raw.host.exec'];
  assert.throws(() => validateTabletAppCandidate(badPermission), /REQUESTED_PERMISSIONS_INVALID/);
  const version = fixture(); version.version = 'latest';
  assert.throws(() => validateTabletAppCandidate(version), /VERSION_INVALID/);
});

test('explicit permission-free manifest remains valid for phone and offline source review', () => {
  const m = fixture(); m.requestedPermissions = [];
  assert.deepEqual([...validateTabletAppCandidate(m).requestedPermissions], []);
});
