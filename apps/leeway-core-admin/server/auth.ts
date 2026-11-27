/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.SERVER.AUTH
TAG: LEEWAY.CORE.CREATOR.AUTHORITY.GATE.V1

5WH:
WHAT = Creator Authority verification, first-run passcode claim, and Bearer session token management.
WHY = Enforce Creator-level authorization on consequential administrative mutations without duplicating Zitadel or introducing external identity providers.
WHO = Creator/Human Authority via LeeWay Core Security Boundary.
WHERE = server/auth.ts
WHEN = 2026-11-27
HOW = Express middleware verifying HMAC-SHA256 Bearer tokens issued from scrypt-verified passcode or env secret.

LICENSE = Apache-2.0
*/
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { NextFunction, Request, Response } from 'express';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const AUTH_FILE = path.join(DATA_DIR, 'creator-auth.json');

// Ephemeral in-memory fallback signing key if LEEWAY_SESSION_SECRET is unset
const EPHEMERAL_SIGNING_KEY = crypto.randomBytes(32).toString('hex');

function getSigningKey(): string {
  const configured = String(process.env.LEEWAY_SESSION_SECRET || '').trim();
  return configured.length >= 16 ? configured : EPHEMERAL_SIGNING_KEY;
}

interface StoredCredential {
  salt: string;
  hash: string;
  claimedAt: string;
  creatorLabel: string;
}

function readStoredCredential(): StoredCredential | null {
  try {
    if (!fs.existsSync(AUTH_FILE)) return null;
    const parsed = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
    if (
      parsed &&
      typeof parsed.salt === 'string' &&
      typeof parsed.hash === 'string' &&
      typeof parsed.claimedAt === 'string'
    ) {
      return parsed as StoredCredential;
    }
    return null;
  } catch {
    return null;
  }
}

function writeStoredCredential(cred: StoredCredential): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmpPath = `${AUTH_FILE}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(cred, null, 2), 'utf8');
  fs.renameSync(tmpPath, AUTH_FILE);
}

function hashPasscode(passcode: string, salt: string): string {
  return crypto.scryptSync(passcode, salt, 64).toString('hex');
}

function constantTimeMatch(aHex: string, bHex: string): boolean {
  const aBuf = Buffer.from(aHex, 'utf8');
  const bBuf = Buffer.from(bHex, 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function getAuthStatus(): {
  mode: 'ENV_PASSCODE' | 'CLAIMED_LOCAL' | 'UNCLAIMED_FIRST_RUN';
  zitadelBinding: 'BOUND' | 'UNBOUND';
  zitadelIssuer: string | null;
} {
  const envPasscode = String(process.env.LEEWAY_CREATOR_PASSCODE || '').trim();
  const zitadelIssuer = String(process.env.LEEWAY_ZITADEL_ISSUER || '').trim() || null;
  if (envPasscode.length > 0) {
    return {
      mode: 'ENV_PASSCODE',
      zitadelBinding: zitadelIssuer ? 'BOUND' : 'UNBOUND',
      zitadelIssuer,
    };
  }
  const stored = readStoredCredential();
  return {
    mode: stored ? 'CLAIMED_LOCAL' : 'UNCLAIMED_FIRST_RUN',
    zitadelBinding: zitadelIssuer ? 'BOUND' : 'UNBOUND',
    zitadelIssuer,
  };
}

export function claimFirstRunPasscode(passcode: string, creatorLabel = 'Leonard J. Lee (Creator)'): {
  ok: boolean;
  error?: string;
} {
  const envPasscode = String(process.env.LEEWAY_CREATOR_PASSCODE || '').trim();
  if (envPasscode.length > 0) {
    return { ok: false, error: 'ENV_PASSCODE_OVERRIDES_FIRST_RUN_CLAIM' };
  }
  if (readStoredCredential()) {
    return { ok: false, error: 'CREATOR_PASSCODE_ALREADY_CLAIMED' };
  }
  if (typeof passcode !== 'string' || passcode.trim().length < 8) {
    return { ok: false, error: 'PASSCODE_MIN_8_CHARS_REQUIRED' };
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPasscode(passcode.trim(), salt);
  writeStoredCredential({
    salt,
    hash,
    claimedAt: new Date().toISOString(),
    creatorLabel,
  });
  return { ok: true };
}

export function verifyPasscode(passcode: string): boolean {
  if (typeof passcode !== 'string' || passcode.length === 0) return false;
  const envPasscode = String(process.env.LEEWAY_CREATOR_PASSCODE || '').trim();
  if (envPasscode.length > 0) {
    const salt = 'leeway-env-salt-v1';
    return constantTimeMatch(hashPasscode(passcode, salt), hashPasscode(envPasscode, salt));
  }
  const stored = readStoredCredential();
  if (!stored) return false;
  return constantTimeMatch(hashPasscode(passcode, stored.salt), stored.hash);
}

export interface CreatorSessionPayload {
  sub: string;
  role: 'CREATOR_SOVEREIGN';
  iat: number;
  exp: number;
  jti: string;
}

export function issueCreatorToken(): { token: string; expiresAt: string } {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60 * 8; // 8 hours
  const payload: CreatorSessionPayload = {
    sub: 'creator:leonard-j-lee',
    role: 'CREATOR_SOVEREIGN',
    iat: now,
    exp,
    jti: crypto.randomUUID(),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSigningKey())
    .update(payloadB64)
    .digest('base64url');
  return {
    token: `${payloadB64}.${sig}`,
    expiresAt: new Date(exp * 1000).toISOString(),
  };
}

export function verifyCreatorToken(token: string | undefined): CreatorSessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getSigningKey())
    .update(payloadB64)
    .digest('base64url');
  if (!constantTimeMatch(sigB64, expectedSig)) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as CreatorSessionPayload;
    if (payload.role !== 'CREATOR_SOVEREIGN') return null;
    if (!Number.isFinite(payload.exp) || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function requireCreatorAuthority(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1].trim() : undefined;
  const session = verifyCreatorToken(token);
  if (!session) {
    res.status(401).json({
      ok: false,
      error: 'CREATOR_AUTHORITY_REQUIRED',
      authStatus: getAuthStatus(),
    });
    return;
  }
  (req as Request & { creatorSession?: CreatorSessionPayload }).creatorSession = session;
  next();
}
