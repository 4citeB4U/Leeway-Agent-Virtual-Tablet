import { createHash } from 'node:crypto';
import { canonicalize } from '../canonical-input.mjs';

export const VERSION = 'v1.0.0';

export const rawBase64V1 = {
  adapterId: 'raw-base64-v1',
  formulaId: 'LEEWAY-FORMULA-v1.0',
  version: VERSION,
  window: 16,
  width: 6,
  description: 'accepts an already-canonical 16x6 decimal matrix (values 0..69)',
  toMatrix(input) {
    if (!input || !Array.isArray(input.matrix)) throw new Error('RAW_BASE64_V1_MATRIX_REQUIRED');
    const { matrix, canonical } = canonicalize(input.matrix);
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
};
