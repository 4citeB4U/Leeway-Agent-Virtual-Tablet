import { createHash } from 'node:crypto';
import { canonicalize, MIN_VALUE, MAX_VALUE } from '../canonical-input.mjs';

export const VERSION = 'v1.0.0';

const DIMENSION_KEYS = ['Q', 'V', 'H', 'R', 'S', 'L'];

function linearQuantize(value, min, max) {
  if (!Number.isFinite(value)) throw new Error(`RUNTIME_STATE_V1_NON_FINITE_RAW_${value}`);
  if (min >= max) throw new Error(`RUNTIME_STATE_V1_INVALID_RANGE_${min}_${max}`);
  const clamped = Math.min(Math.max(value, min), max);
  return Math.round(((clamped - min) / (max - min)) * MAX_VALUE);
}

export const runtimeStateV1 = {
  adapterId: 'runtime-state-v1',
  formulaId: 'LEEWAY-FORMULA-v1.0',
  version: VERSION,
  window: 16,
  width: 6,
  description: 'maps 16 runtime events of 6 dimensions (Q,V,H,R,S,L) into the canonical 16x6 0..69 matrix',
  toMatrix(input) {
    if (!input) throw new Error('RUNTIME_STATE_V1_INPUT_REQUIRED');
    const stateRows = input.stateRows;
    if (!Array.isArray(stateRows) || stateRows.length !== 16) {
      throw new Error('RUNTIME_STATE_V1_16_STATE_ROWS_REQUIRED');
    }
    const rawCanonical = [];
    if (Array.isArray(input.matrix)) {
      for (let r = 0; r < 16; r++) {
        if (!Array.isArray(input.matrix[r]) || input.matrix[r].length !== 6) {
          throw new Error(`RUNTIME_STATE_V1_MATRIX_ROW_${r}_INVALID`);
        }
        rawCanonical.push(input.matrix[r].map(Number));
      }
      const { matrix, canonical } = canonicalize(rawCanonical);
      const sourceHash = createHash('sha256').update(canonical, 'utf8').digest('hex');
      const adapterHash = createHash('sha256').update(VERSION, 'utf8').digest('hex');
      return {
        matrix,
        canonical,
        sourceHash,
        adapterHash,
        adapterId: this.adapterId,
        formulaId: this.formulaId,
        window: this.window,
        width: this.width
      };
    }
    if (Array.isArray(input.ranges)) {
      if (input.ranges.length !== 6) throw new Error('RUNTIME_STATE_V1_6_RANGES_REQUIRED');
      for (let r = 0; r < 16; r++) {
        const row = stateRows[r];
        if (!Array.isArray(row) || row.length !== 6) {
          throw new Error(`RUNTIME_STATE_V1_STATE_ROW_${r}_INVALID`);
        }
        rawCanonical.push(row.map((v, j) => linearQuantize(Number(v), Number(input.ranges[j][0]), Number(input.ranges[j][1]))));
      }
      const { matrix, canonical } = canonicalize(rawCanonical);
      const sourceHash = createHash('sha256').update(JSON.stringify({ stateRows, ranges: input.ranges }), 'utf8').digest('hex');
      const adapterHash = createHash('sha256').update(VERSION, 'utf8').digest('hex');
      return {
        matrix,
        canonical,
        sourceHash,
        adapterHash,
        adapterId: this.adapterId,
        formulaId: this.formulaId,
        window: this.window,
        width: this.width
      };
    }
    throw new Error('RUNTIME_STATE_V1_REQUIRES_MATRIX_OR_RANGES');
  },
  dimensionKeys: DIMENSION_KEYS
};
