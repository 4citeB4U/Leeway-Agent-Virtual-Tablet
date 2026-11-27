/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT.TABLET.DIAGNOSTICS.TEST
TAG: LEEWAY.TABLET.DIAGNOSTICS.ASSETS.TEST.V1
5WH:
WHAT = Verify recovered original Diagnostics assets are byte-identical and not promoted to physical geometry.
WHY = Prevent unrelated or modified imagery from being presented as verified device evidence.
WHO = Tablet diagnostics maintainers; this test grants no host or device authority.
WHERE = apps/agent-tablet/test/diagnostics/assets.test.ts.
WHEN = 2026-11-26.
HOW = Hash recovered files and validate manifest qualification against the original embedded reference.
LICENSE = Repository terms.
*/

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  ORIGINAL_DIAGNOSTICS_EXPLODED_ASSET,
  RECOVERED_DIAGNOSTICS_ASSETS
} from '../../src/diagnostics/assets';

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public/diagnostics-assets');

test('recovered original assets are byte-identical to their pinned hashes', () => {
  assert.equal(RECOVERED_DIAGNOSTICS_ASSETS.length, 8);
  for (const asset of RECOVERED_DIAGNOSTICS_ASSETS) {
    const bytes = fs.readFileSync(path.join(publicDir, asset.file));
    assert.equal(bytes.length, asset.bytes, `${asset.file} byte length`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, `${asset.file} SHA-256`);
    assert.notEqual(asset.qualification, 'VERIFIED_PHYSICAL_GEOMETRY');
  }
});

test('exploded reference matches the original embedded asset hash and stays illustrative', () => {
  const recovered = RECOVERED_DIAGNOSTICS_ASSETS.find(asset => asset.file === ORIGINAL_DIAGNOSTICS_EXPLODED_ASSET.file);
  assert.ok(recovered);
  assert.equal(recovered.sha256, ORIGINAL_DIAGNOSTICS_EXPLODED_ASSET.sha256);
  assert.equal(recovered.qualification, 'CATEGORY_ILLUSTRATION_NOT_MODEL_EVIDENCE');
  assert.equal(ORIGINAL_DIAGNOSTICS_EXPLODED_ASSET.sourceArchive, 'omniboard---universal-hardware-diagnostic-engine.zip');
});
