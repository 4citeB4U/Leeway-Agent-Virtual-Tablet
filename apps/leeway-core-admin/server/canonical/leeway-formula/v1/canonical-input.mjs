import { createHash } from 'node:crypto';

export const ROWS = 16;
export const COLS = 6;
export const MIN_VALUE = 0;
export const MAX_VALUE = 69;

export function canonicalize(matrix) {
  if (!Array.isArray(matrix)) throw new Error('CANONICAL_INPUT_MATRIX_REQUIRED');
  if (matrix.length !== ROWS) throw new Error(`CANONICAL_INPUT_ROWS_EXPECTED_${ROWS}_GOT_${matrix.length}`);
  for (let r = 0; r < ROWS; r++) {
    const row = matrix[r];
    if (!Array.isArray(row) || row.length !== COLS) {
      throw new Error(`CANONICAL_INPUT_ROW_${r}_EXPECTED_${COLS}_COLS`);
    }
    for (let c = 0; c < COLS; c++) {
      const v = row[c];
      if (!Number.isInteger(v)) throw new Error(`CANONICAL_INPUT_NON_INTEGER_AT_${r}_${c}`);
      if (v < MIN_VALUE || v > MAX_VALUE) throw new Error(`CANONICAL_INPUT_OUT_OF_RANGE_${v}_AT_${r}_${c}`);
    }
  }
  const canonical = matrix.map(row => row.join(',')).join('\n');
  return { matrix, canonical };
}

export function hashCanonical(canonical) {
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export function canonicalInputHash(matrix) {
  const { canonical } = canonicalize(matrix);
  return hashCanonical(canonical);
}
