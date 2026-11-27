export function rat(n, d = 1n) {
  if (typeof n !== 'bigint') n = BigInt(n);
  if (typeof d !== 'bigint') d = BigInt(d);
  if (d === 0n) throw new Error('RATIONAL_DIVISION_BY_ZERO');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcdBig(absBig(n), d);
  return { n: n / g, d: d / g, toJSON() { return this.d === 1n ? this.n.toString() : `${this.n}/${this.d}`; } };
}

function absBig(n) { return n < 0n ? -n : n; }

function gcdBig(a, b) {
  while (b) { const t = a % b; a = b; b = t; }
  return a;
}

export const rAdd = (a, b) => rat(a.n * b.d + b.n * a.d, a.d * b.d);
export const rSub = (a, b) => rat(a.n * b.d - b.n * a.d, a.d * b.d);
export const rMul = (a, b) => rat(a.n * b.n, a.d * b.d);
export const rDiv = (a, b) => rat(a.n * b.d, a.d * b.n);

export function rCmp(a, b) {
  const l = a.n * b.d;
  const r = b.n * a.d;
  return l < r ? -1 : l > r ? 1 : 0;
}

export const rMin = (arr) => arr.reduce((m, z) => (rCmp(z, m) < 0 ? z : m));
export const rMax = (arr) => arr.reduce((m, z) => (rCmp(z, m) > 0 ? z : m));

export function rToString(r) {
  return r.d === 1n ? `${r.n}` : `${r.n}/${r.d}`;
}

export function rToNumber(r) {
  return Number(r.n) / Number(r.d);
}

export function rIsZero(r) {
  return r.n === 0n;
}
