/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.RECEIPT.LEDGER
TAG: LEEWAY.RECEIPT.EXECUTION.LOG

5WH:
WHAT = Real Web Crypto SHA-256 execution receipt generator for user-triggered studio actions.
WHY = Comply with LeeWay R18 by recording verifiable cryptographic digests only for executed actions without fabricated entries.
WHO = Leeway Innovations — Receipt Evidence Utility
WHERE = src/leeway/receiptLedger.ts
WHEN = 2026-11-27
HOW = Uses globalThis.crypto.subtle.digest('SHA-256', ...) to hash serialized action payloads deterministically.

LICENSE = Apache-2.0
*/

import { ExecutionReceipt } from '../types/studio';

export async function computeSha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback for environments lacking SubtleCrypto (Node.js test runners without WebCrypto subtle)
  let h1 = 0xdeadbeef ^ bytes.length;
  let h2 = 0x41c6ce57 ^ bytes.length;
  for (let i = 0; i < bytes.length; i++) {
    const ch = bytes[i];
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `noncrypto-${(4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0')}`;
}

export async function createExecutionReceipt(
  action: ExecutionReceipt['action'],
  summary: string,
  details: Record<string, string | number | boolean>
): Promise<ExecutionReceipt> {
  const timestamp = new Date().toISOString();
  const payload = JSON.stringify({ timestamp, action, summary, details });
  const sha256 = await computeSha256Hex(payload);
  return {
    id: `rcpt-${sha256.slice(0, 12)}`,
    timestamp,
    action,
    summary,
    sha256,
    details,
  };
}
