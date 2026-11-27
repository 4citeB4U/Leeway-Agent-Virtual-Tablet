/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.TESTS.VERIFICATION
TAG: LEEWAY.CORE.AUTOMATED.VERIFICATION.SUITE.V1

5WH:
WHAT = Automated verification suite for Canonical Formula SHA-256 integrity, 14 domain adapters, diagnostics honesty, Creator Authority auth gate, atomic persistence, and source compliance.
WHY = Satisfy LeeWay Engineering TEST, VALIDATE, VERIFY, and EVIDENCE requirements with deterministic executable checks.
WHO = External Software Engineering Contributor under Creator Authority.
WHERE = tests/core-verification.test.ts
WHEN = 2026-11-27
HOW = Node native test runner executed via tsx --test with isolated backup/restore of local data/ artifacts.

LICENSE = Apache-2.0
*/
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import {
  claimFirstRunPasscode,
  getAuthStatus,
  issueCreatorToken,
  verifyCreatorToken,
  verifyPasscode,
} from '../server/auth.ts';
import {
  collectHostDiagnosticsSnapshot,
  runAllowlistedDiagnosticProbe,
} from '../server/diagnostics.ts';
import {
  buildDomainFormulaInput,
  FORMULA_DOMAIN_ADAPTERS,
  initializeCanonicalFormula,
} from '../server/formulaAdapters.ts';
import {
  appendReceipt,
  loadCoreState,
  saveCoreState,
  TWELVE_ENGINEERING_STAGES,
} from '../server/store.ts';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');
const AUTH_FILE = path.join(DATA_DIR, 'creator-auth.json');
const STATE_FILE = path.join(DATA_DIR, 'core-state.json');
const RECEIPTS_DIR = path.join(ROOT, 'server', 'canonical', 'receipts', 'leeway-formula');

let authBackup: string | null = null;
let stateBackup: string | null = null;
let existingReceiptFiles = new Set<string>();

before(() => {
  if (fs.existsSync(AUTH_FILE)) {
    authBackup = fs.readFileSync(AUTH_FILE, 'utf8');
  }
  if (fs.existsSync(STATE_FILE)) {
    stateBackup = fs.readFileSync(STATE_FILE, 'utf8');
  }
  if (fs.existsSync(RECEIPTS_DIR)) {
    existingReceiptFiles = new Set(fs.readdirSync(RECEIPTS_DIR));
  }
});

after(() => {
  if (authBackup !== null) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(AUTH_FILE, authBackup, 'utf8');
  } else if (fs.existsSync(AUTH_FILE)) {
    fs.unlinkSync(AUTH_FILE);
  }

  if (stateBackup !== null) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STATE_FILE, stateBackup, 'utf8');
  } else if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
  }

  if (fs.existsSync(RECEIPTS_DIR)) {
    for (const file of fs.readdirSync(RECEIPTS_DIR)) {
      if (!existingReceiptFiles.has(file) && file.endsWith('.json')) {
        fs.unlinkSync(path.join(RECEIPTS_DIR, file));
      }
    }
  }
});

describe('01. Canonical Golden LEEWAY-FORMULA-v1.0 Kernel & 14 Domain Adapters', () => {
  it('verifies 11/11 SHA-256 kernel integrity files and Golden Vector identity', async () => {
    const boot = await initializeCanonicalFormula();
    assert.equal(boot.integrity.verified, true, `Integrity error: ${boot.integrity.error}`);
    assert.equal(boot.integrity.filesChecked.length, 11);
    assert.ok(boot.integrity.filesChecked.every((f) => f.match === true));
    assert.ok(boot.service, 'Formula service must load cleanly');

    const health = boot.service.health();
    assert.equal(health.status, 'LEEWAY_FORMULA_V1_PASS');
    assert.equal(health.goldenVectorPass, true);
    assert.equal(health.specValid, true);
    assert.deepEqual(health.expectedDecimal, [4, 50, 63, 59, 48, 69]);
    assert.deepEqual(health.expectedBase64, ['E', 'y', '/', '7', 'w', 'BF']);
  });

  it('evaluates all 14 domain adapters with hashed receipts and exact Golden Matrix vector', async () => {
    const boot = await initializeCanonicalFormula();
    assert.ok(boot.service);
    assert.equal(FORMULA_DOMAIN_ADAPTERS.length, 14);

    for (const contract of FORMULA_DOMAIN_ADAPTERS) {
      const built = buildDomainFormulaInput(contract.domainId);
      const res = boot.service.evaluate({
        adapterId: built.adapter.canonicalAdapterId,
        input: built.input,
        caller: `test:${contract.domainId}`,
        traceId: `test-${contract.domainId}`,
      });
      assert.equal(res.formulaId, 'LEEWAY-FORMULA-v1.0');
      assert.equal(res.decimalState.length, 6);
      assert.equal(res.base64State.length, 6);
      assert.equal(res.top10.length, 10);
      assert.match(res.inputHash, /^[a-f0-9]{64}$/);
      assert.match(res.resultHash, /^[a-f0-9]{64}$/);
      assert.ok(fs.existsSync(res.receiptPath), `Expected receipt file at ${res.receiptPath}`);

      if (contract.domainId === 'research-evaluation' || contract.domainId === 'storage-transformations') {
        assert.deepEqual(res.decimalState, [4, 50, 63, 59, 48, 69]);
        assert.deepEqual(res.base64State, ['E', 'y', '/', '7', 'w', 'BF']);
      }
    }
  });

  it('fails closed on out-of-bounds matrix input without fallback synthesis', async () => {
    const boot = await initializeCanonicalFormula();
    assert.ok(boot.service);
    const badMatrix = Array.from({ length: 16 }, () => [999, 1, 2, 3, 4, 5]);
    assert.throws(() => {
      boot.service!.evaluate({
        adapterId: 'raw-base64-v1',
        input: { matrix: badMatrix },
        caller: 'test:negative-bounds',
        traceId: 'test-negative',
      });
    });
  });
});

describe('02. Creator Diagnostics Host Telemetry Honesty & Allowlist', () => {
  it('reports real Node OS metrics while marking unbound hardware/veritas explicitly', async () => {
    const snap = await collectHostDiagnosticsSnapshot();
    assert.equal(snap.schemaVersion, 1);
    assert.equal(snap.device.binding, 'HOST_PROCESS_ONLY');
    assert.equal(snap.device.enrollment, 'UNVERIFIED');
    assert.equal(snap.metrics.cpu.state, 'OBSERVED');
    assert.equal(snap.metrics.memory.state, 'OBSERVED');
    assert.equal(snap.metrics.temperature.state, 'UNAVAILABLE');
    assert.equal(snap.capabilities.gpuUtilization, 'UNAVAILABLE');
    assert.equal(snap.capabilities.gpuMemory, 'UNVERIFIED');
    assert.equal(snap.capabilities.independentVeritas, 'NOT_PROVIDED');
  });

  it('permits allowlisted read-only probes and blocks arbitrary commands', async () => {
    const allowed = await runAllowlistedDiagnosticProbe('node-runtime');
    assert.equal(allowed.status, 'OBSERVED');
    assert.match(allowed.output, /Node v/);

    const blocked = await runAllowlistedDiagnosticProbe('rm -rf /tmp/anything');
    assert.equal(blocked.status, 'BLOCKED');
  });
});

describe('03. Creator Authority Auth Gate (scrypt + HMAC-SHA256 Bearer)', () => {
  it('enforces first-run passcode claim rules, prevents duplicate claim, and rejects tampered tokens', () => {
    if (fs.existsSync(AUTH_FILE)) {
      fs.unlinkSync(AUTH_FILE);
    }

    const prevEnv = process.env.LEEWAY_CREATOR_PASSCODE;
    delete process.env.LEEWAY_CREATOR_PASSCODE;
    try {
      assert.equal(getAuthStatus().mode, 'UNCLAIMED_FIRST_RUN');

      const shortRes = claimFirstRunPasscode('short');
      assert.equal(shortRes.ok, false);
      assert.equal(shortRes.error, 'PASSCODE_MIN_8_CHARS_REQUIRED');

      const claimRes = claimFirstRunPasscode('CreatorTest#2026');
      assert.equal(claimRes.ok, true);
      assert.equal(getAuthStatus().mode, 'CLAIMED_LOCAL');

      const dupRes = claimFirstRunPasscode('AnotherPass#2026');
      assert.equal(dupRes.ok, false);
      assert.equal(dupRes.error, 'CREATOR_PASSCODE_ALREADY_CLAIMED');

      assert.equal(verifyPasscode('CreatorTest#2026'), true);
      assert.equal(verifyPasscode('WrongPasscode1'), false);

      const issued = issueCreatorToken();
      const verified = verifyCreatorToken(issued.token);
      assert.ok(verified);
      assert.equal(verified.role, 'CREATOR_SOVEREIGN');

      const tampered = `${issued.token.slice(0, -4)}AAAA`;
      assert.equal(verifyCreatorToken(tampered), null);
    } finally {
      if (prevEnv !== undefined) process.env.LEEWAY_CREATOR_PASSCODE = prevEnv;
    }
  });
});

describe('04. Atomic Store, Privacy Boundaries & Receipt Ledger', () => {
  it('seeds canonical Workforce A-E, enforces privateContentAccess=false, and writes atomic receipts', () => {
    if (fs.existsSync(STATE_FILE)) {
      fs.unlinkSync(STATE_FILE);
    }
    const state = loadCoreState();
    assert.equal(TWELVE_ENGINEERING_STAGES.length, 12);
    assert.ok(state.customers.length >= 6);
    assert.ok(state.customers.every((c) => c.privateContentAccess === false));

    const categories = new Set(state.workforce.map((w) => w.category));
    assert.ok(categories.has('A_LEEWAY_INTERNAL'));
    assert.ok(categories.has('B_LEEWAY_CONTRACTED'));
    assert.ok(categories.has('C_CUSTOMER_INTERNAL_AGENT'));
    assert.ok(categories.has('D_CUSTOMER_EXTERNAL_CANDIDATE'));
    assert.ok(categories.has('E_EXTERNALLY_DEPLOYED_CONTRACTED'));

    const receipt = appendReceipt(
      state,
      'TEST_VERIFICATION_CHECKPOINT',
      'Automated Test Suite',
      'core-state',
      'Verification checkpoint test receipt',
      { check: true }
    );
    assert.match(receipt.sha256, /^[a-f0-9]{64}$/);
    assert.equal(receipt.veritasState, 'NOT_VERIFIED_EXTERNALLY');

    saveCoreState(state);
    assert.equal(fs.existsSync(`${STATE_FILE}.tmp`), false);
    assert.equal(fs.existsSync(STATE_FILE), true);
  });
});

describe('05. LeeWay Standards Source Compliance & Zero Forbidden Dependencies', () => {
  it('confirms every server and src TS/TSX file includes a LeeWay 5WH header and no banned strings', () => {
    const collectFiles = (dir: string, exts: string[]): string[] => {
      const results: string[] = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'canonical' || entry.name === 'node_modules' || entry.name === 'dist') continue;
          results.push(...collectFiles(full, exts));
        } else if (exts.some((ext) => entry.name.endsWith(ext))) {
          results.push(full);
        }
      }
      return results;
    };

    const files = [
      path.join(ROOT, 'server.ts'),
      ...collectFiles(path.join(ROOT, 'server'), ['.ts']),
      ...collectFiles(path.join(ROOT, 'src'), ['.ts', '.tsx']),
    ];

    const forbiddenPatterns = [
      /@google\/genai/i,
      /@google\/generative-ai/i,
      /GEMINI_API_KEY/,
      /GOOGLE_API_KEY/,
      /Google AI Studio/i,
      /[CE]:\\Users\\/i,
    ];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      assert.ok(
        content.includes('LEEWAY HEADER — DO NOT REMOVE'),
        `Missing LeeWay 5WH header in ${path.relative(ROOT, file)}`
      );
      for (const pat of forbiddenPatterns) {
        assert.equal(
          pat.test(content),
          false,
          `Forbidden pattern ${pat} found in ${path.relative(ROOT, file)}`
        );
      }
    }
  });
});
