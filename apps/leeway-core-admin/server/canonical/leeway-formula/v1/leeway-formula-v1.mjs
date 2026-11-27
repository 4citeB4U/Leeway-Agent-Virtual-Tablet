import { createHash } from 'node:crypto';
import { rat, rAdd, rSub, rMul, rDiv, rCmp, rMin, rMax } from './rational.mjs';
import { encodeVector } from './base64-codec.mjs';
import { canonicalize, hashCanonical } from './canonical-input.mjs';

export const FORMULA_ID = 'LEEWAY-FORMULA-v1.0';
export const UNIVERSE_MIN = 0;
export const UNIVERSE_MAX = 69;
export const UNIVERSE_SIZE = 70;
export const MU_NUMERATOR = 727n;
export const MU_DENOMINATOR = 24n;
export const FEATURE_ORDER = ['F', 'G', 'R', 'P', 'v', 'a', 'D', 'H', 'C', 'Q'];
export const FEATURE_WEIGHT = '1/10';

export const GOLDEN_MATRIX = [
  [5, 9, 35, 54, 63, 7],
  [14, 20, 59, 60, 61, 25],
  [8, 30, 41, 48, 54, 4],
  [6, 17, 27, 48, 50, 5],
  [30, 36, 40, 42, 57, 2],
  [6, 26, 46, 58, 65, 25],
  [3, 4, 24, 36, 47, 17],
  [4, 5, 22, 50, 58, 1],
  [2, 9, 44, 53, 59, 8],
  [9, 14, 44, 50, 56, 3],
  [2, 7, 18, 29, 38, 16],
  [5, 25, 36, 40, 48, 3],
  [8, 10, 14, 45, 59, 5],
  [12, 29, 37, 43, 55, 18],
  [17, 44, 63, 66, 67, 4],
  [17, 38, 46, 50, 69, 20]
];

export const GOLDEN_DECIMAL = [4, 50, 63, 59, 48, 69];
export const GOLDEN_BASE64 = ['E', 'y', '/', '7', 'w', 'BF'];

const GOLDEN_CANONICAL = GOLDEN_MATRIX.map(row => row.join(',')).join('\n');
export const GOLDEN_INPUT_HASH = hashCanonical(GOLDEN_CANONICAL);

function occurrenceRows(matrix, x) {
  const tau = [];
  for (let t = 0; t < matrix.length; t++) {
    if (matrix[t].includes(x)) tau.push(t + 1);
  }
  return tau;
}

function cellCount(matrix, x) {
  let count = 0;
  for (const row of matrix) {
    for (const v of row) {
      if (v === x) count++;
    }
  }
  return count;
}

function columnCounts(matrix, x) {
  const counts = new Array(matrix[0].length).fill(0);
  for (const row of matrix) {
    for (let j = 0; j < row.length; j++) {
      if (row[j] === x) counts[j]++;
    }
  }
  return counts;
}

function coOccurrencePairCount(matrix, x, y) {
  let pair = 0;
  for (const row of matrix) {
    if (row.includes(x) && row.includes(y)) pair++;
  }
  return pair;
}

export function computeFeatures(matrix) {
  const nrows = matrix.length;
  const features = [];
  for (let x = UNIVERSE_MIN; x <= UNIVERSE_MAX; x++) {
    const tau = occurrenceRows(matrix, x);
    const n = tau.length;
    const F = rat(cellCount(matrix, x));
    const G = n >= 1 ? rat(BigInt(nrows - tau[n - 1])) : rat(BigInt(nrows));
    const R = n >= 1 ? rat(BigInt(tau[n - 1]), BigInt(nrows)) : rat(0n);
    const maxCj = Math.max(...columnCounts(matrix, x));
    const P = n >= 1 ? rat(BigInt(maxCj), F.n) : rat(0n);
    const v = n >= 2 ? rat(BigInt(tau[n - 1] - tau[n - 2])) : rat(0n);
    const a = n >= 3 ? rat(BigInt((tau[n - 1] - tau[n - 2]) - (tau[n - 2] - tau[n - 3]))) : rat(0n);
    const D = rat(absBig(24n * BigInt(x) - MU_NUMERATOR), MU_DENOMINATOR);
    const H = rAdd(rMul(rat(1n, 2n), rMul(v, v)), rMul(rat(1n, 2n), rMul(D, D)));
    let C = rat(0n);
    for (let y = UNIVERSE_MIN; y <= UNIVERSE_MAX; y++) {
      if (y === x) continue;
      if (coOccurrencePairCount(matrix, x, y) >= 2) C = rAdd(C, rat(1n));
    }
    const Q = rAdd(rAdd(rAdd(rAdd(v, a), D), R), G);
    features.push({ x, tau, n, F, G, R, P, v, a, D, H, C, Q });
  }
  return features;
}

function absBig(n) {
  return n < 0n ? -n : n;
}

export function normalizeFeatures(features) {
  const normalized = {};
  for (const key of FEATURE_ORDER) {
    const vals = features.map(f => f[key]);
    const lo = rMin(vals);
    const hi = rMax(vals);
    normalized[key] = rCmp(hi, lo) === 0
      ? vals.map(() => rat(0n))
      : vals.map(z => rDiv(rSub(z, lo), rSub(hi, lo)));
  }
  return normalized;
}

export function computeScores(features, normalized) {
  return features.map((f, i) => {
    let sum = rat(0n);
    for (const key of FEATURE_ORDER) {
      sum = rAdd(sum, normalized[key][i]);
    }
    return { x: f.x, score: rDiv(sum, rat(10n)) };
  });
}

export function rankCandidates(features, scores) {
  const featureByX = new Map(features.map(f => [f.x, f]));
  const scoreByX = new Map(scores.map(s => [s.x, s.score]));
  const candidates = features.map(f => f.x);
  candidates.sort((p, q) => {
    let c = rCmp(scoreByX.get(q), scoreByX.get(p));
    if (c) return c;
    c = rCmp(featureByX.get(q).F, featureByX.get(p).F);
    if (c) return c;
    c = rCmp(featureByX.get(q).R, featureByX.get(p).R);
    if (c) return c;
    c = rCmp(featureByX.get(q).P, featureByX.get(p).P);
    if (c) return c;
    return p - q;
  });
  return candidates;
}

export function featureFingerprint(features, normalized) {
  const fingerprint = {};
  for (const f of features) {
    const normValues = {};
    for (const key of FEATURE_ORDER) {
      normValues[key] = normalized[key][f.x];
    }
    fingerprint[String(f.x)] = {
      n: f.n,
      F: f.F,
      G: f.G,
      R: f.R,
      P: f.P,
      v: f.v,
      a: f.a,
      D: f.D,
      H: f.H,
      C: f.C,
      Q: f.Q
    };
  }
  return fingerprint;
}

export function evaluate(matrix) {
  const { canonical } = canonicalize(matrix);
  const inputHash = hashCanonical(canonical);
  const features = computeFeatures(matrix);
  const normalized = normalizeFeatures(features);
  const scores = computeScores(features, normalized);
  const ranked = rankCandidates(features, scores);
  const top10 = ranked.slice(0, 10);
  const top6 = ranked.slice(0, 6);
  const decimalState = top6;
  const base64State = encodeVector(decimalState);
  const resultHash = createHash('sha256')
    .update(JSON.stringify({ formulaId: FORMULA_ID, inputHash, decimalState, base64State }))
    .digest('hex');
  return {
    formulaId: FORMULA_ID,
    decimalState,
    base64State,
    top10,
    featureFingerprint: featureFingerprint(features, normalized),
    inputHash,
    resultHash
  };
}

export function verifyGolden(matrix = GOLDEN_MATRIX) {
  let result = null;
  let error = null;
  try {
    result = evaluate(matrix);
  } catch (err) {
    error = String(err);
  }
  const pass = Boolean(
    !error &&
    result &&
    JSON.stringify(result.decimalState) === JSON.stringify(GOLDEN_DECIMAL) &&
    JSON.stringify(result.base64State) === JSON.stringify(GOLDEN_BASE64)
  );
  return {
    pass,
    status: pass ? 'LEEWAY_FORMULA_V1_PASS' : 'LEEWAY_FORMULA_V1_BLOCKED',
    formulaId: FORMULA_ID,
    goldenVectorPass: pass,
    computedDecimal: result ? result.decimalState : null,
    computedBase64: result ? result.base64State : null,
    expectedDecimal: GOLDEN_DECIMAL,
    expectedBase64: GOLDEN_BASE64,
    inputHash: result ? result.inputHash : null,
    error
  };
}
