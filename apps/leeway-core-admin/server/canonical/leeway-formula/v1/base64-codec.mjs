const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function encode(x) {
  if (!Number.isInteger(x) || x < 0) throw new Error(`BASE64_ENCODE_NON_NEGATIVE_INTEGER_REQUIRED:${x}`);
  if (x === 0) return 'A';
  let out = '';
  let v = BigInt(x);
  while (v > 0n) {
    out = ALPHABET[Number(v % 64n)] + out;
    v = v / 64n;
  }
  return out;
}

export function decode(s) {
  if (typeof s !== 'string' || s.length === 0) throw new Error('BASE64_DECODE_STRING_REQUIRED');
  let v = 0n;
  for (const ch of s) {
    const idx = ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error(`BASE64_DECODE_INVALID_CHARACTER:${ch}`);
    v = v * 64n + BigInt(idx);
  }
  return Number(v);
}

export function encodeVector(arr) {
  return arr.map(encode);
}

export function decodeVector(arr) {
  return arr.map(decode);
}
