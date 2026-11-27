import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const RECEIPTS_ROOT = path.resolve(MODULE_DIR, '..', '..', 'receipts', 'leeway-formula');

export function receiptsRoot() {
  return RECEIPTS_ROOT;
}

export function hashFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

export function writeFormulaReceipt(payload) {
  fs.mkdirSync(RECEIPTS_ROOT, { recursive: true });
  const stamp = payload.timestamp.replace(/[-:TZ.]/g, '').slice(0, 14);
  const trace = (payload.traceId || 'no-trace').slice(0, 8);
  const receipt = {
    schema: 'leeway-proof-backed-receipt-schema',
    receiptId: `leeway-formula-run-${stamp}-${trace}`,
    status: payload.status || 'completed',
    startedAt: payload.timestamp,
    endedAt: payload.timestamp,
    formulaVersion: payload.formulaId,
    formulaHash: payload.formulaHash || null,
    adapterVersion: payload.adapterId,
    adapterHash: payload.adapterHash || null,
    inputHash: payload.inputHash || null,
    inputRows: payload.inputRows || null,
    base64Rows: payload.base64Rows || null,
    featureFingerprint: payload.featureFingerprint || null,
    top10: payload.top10 || null,
    top6: payload.top6 || null,
    decimalState: payload.decimalState || null,
    base64State: payload.base64State || null,
    resultHash: payload.resultHash || null,
    caller: payload.caller || 'unknown',
    traceId: payload.traceId || null,
    ok: payload.ok !== false
  };
  const filePath = path.join(RECEIPTS_ROOT, `${receipt.receiptId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(receipt, null, 2), 'utf8');
  return filePath;
}

export function listFormulaReceipts() {
  if (!fs.existsSync(RECEIPTS_ROOT)) return [];
  return fs.readdirSync(RECEIPTS_ROOT)
    .filter(name => name.endsWith('.json'))
    .sort()
    .reverse();
}
