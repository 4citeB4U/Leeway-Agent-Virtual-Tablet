import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as engine from './leeway-formula-v1.mjs';
import * as codec from './base64-codec.mjs';
import { listAdapters, getAdapter } from './adapters/adapter-registry.mjs';
import { writeFormulaReceipt, listFormulaReceipts, hashFile } from './formula-receipts.mjs';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const SPEC_PATH = path.resolve(MODULE_DIR, '..', '..', 'standards', 'formulas', 'LEEWAY-FORMULA-v1.0.spec.json');
const SPEC_MD_PATH = path.resolve(MODULE_DIR, '..', '..', 'standards', 'formulas', 'LEEWAY-FORMULA-v1.0.md');

let lastResult = null;

function specValid() {
  const specOk = fs.existsSync(SPEC_PATH) && fs.existsSync(SPEC_MD_PATH);
  if (!specOk) return { valid: false, reason: 'SPEC_FILES_MISSING' };
  let parsed = null;
  try {
    parsed = JSON.parse(fs.readFileSync(SPEC_PATH, 'utf8'));
  } catch (err) {
    return { valid: false, reason: `SPEC_PARSE_FAILED:${String(err)}` };
  }
  const consistent =
    parsed.formulaId === engine.FORMULA_ID &&
    JSON.stringify(parsed.goldenVector.decimal) === JSON.stringify(engine.GOLDEN_DECIMAL) &&
    JSON.stringify(parsed.goldenVector.base64) === JSON.stringify(engine.GOLDEN_BASE64);
  return {
    valid: consistent,
    reason: consistent ? null : 'SPEC_AND_ENGINE_MISMATCH',
    specHash: hashFile(SPEC_PATH),
    specMdHash: hashFile(SPEC_MD_PATH)
  };
}

export function health() {
  const golden = engine.verifyGolden();
  const spec = specValid();
  const adapters = listAdapters();
  const pass = golden.goldenVectorPass && spec.valid && adapters.length >= 2;
  return {
    status: pass ? 'LEEWAY_FORMULA_V1_PASS' : 'LEEWAY_FORMULA_V1_BLOCKED',
    formula: engine.FORMULA_ID,
    loaded: true,
    goldenVectorPass: golden.goldenVectorPass,
    specValid: spec.valid,
    adapterRegistryPass: adapters.length >= 2,
    expectedDecimal: golden.expectedDecimal,
    expectedBase64: golden.expectedBase64,
    specHash: spec.specHash,
    specMdHash: spec.specMdHash,
    timestamp: new Date().toISOString()
  };
}

export function spec() {
  const spec = specValid();
  if (!spec.valid) throw new Error(`SPEC_INVALID:${spec.reason}`);
  return {
    formulaId: engine.FORMULA_ID,
    documentationPath: 'standards/formulas/LEEWAY-FORMULA-v1.0.md',
    specHash: spec.specHash,
    specMdHash: spec.specMdHash,
    universe: { min: engine.UNIVERSE_MIN, max: engine.UNIVERSE_MAX, size: engine.UNIVERSE_SIZE },
    goldenVector: { decimal: engine.GOLDEN_DECIMAL, base64: engine.GOLDEN_BASE64 },
    featureOrder: engine.FEATURE_ORDER,
    featureWeight: engine.FEATURE_WEIGHT,
    tieBreak: 'S down, F down, R down, P down, x up',
    codec: 'positional base-64, RFC4648 alphabet, no leading zeros'
  };
}

export function adapters() {
  return listAdapters();
}

export function evaluate({ adapterId, input, caller, traceId }) {
  if (!adapterId) throw new Error('ADAPTER_ID_REQUIRED');
  if (!input) throw new Error('INPUT_REQUIRED');
  const adapter = getAdapter(adapterId);
  const canonical = adapter.toMatrix(input);
  const result = engine.evaluate(canonical.matrix);
  const timestamp = new Date().toISOString();
  const payload = {
    timestamp,
    status: 'completed',
    formulaId: engine.FORMULA_ID,
    formulaHash: hashFile(SPEC_PATH),
    adapterId,
    adapterHash: canonical.adapterHash,
    inputHash: result.inputHash,
    inputRows: canonical.matrix,
    base64Rows: result.base64State,
    featureFingerprint: result.featureFingerprint,
    top10: result.top10,
    top6: result.decimalState,
    decimalState: result.decimalState,
    base64State: result.base64State,
    resultHash: result.resultHash,
    caller: caller || 'runtime-fabric',
    traceId: traceId || null
  };
  const receiptPath = writeFormulaReceipt(payload);
  lastResult = {
    ...payload,
    receiptPath,
    evaluatedAt: timestamp
  };
  return {
    formulaId: result.formulaId,
    adapterId,
    decimalState: result.decimalState,
    base64State: result.base64State,
    top10: result.top10,
    inputHash: result.inputHash,
    resultHash: result.resultHash,
    receiptPath,
    evaluatedAt: timestamp
  };
}

export function encode({ decimals }) {
  if (!Array.isArray(decimals)) throw new Error('DECIMALS_ARRAY_REQUIRED');
  return {
    decimalState: decimals,
    base64State: codec.encodeVector(decimals)
  };
}

export function last() {
  return lastResult;
}

export function receipts() {
  return listFormulaReceipts();
}
