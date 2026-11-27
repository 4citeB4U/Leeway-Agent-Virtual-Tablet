/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.FRONTEND.CREATOR_AUTH
TAG: LEEWAY.CORE.CREATOR.AUTHORITY.MODAL.V1

5WH:
WHAT = Inline Creator Authority passcode claim and unlock dialog storing Bearer session token strictly in React memory.
WHY = Satisfy Creator authority gating on consequential mutations without creating a separate OS shell or storing tokens in localStorage.
WHO = Creator/Human Authority via Leeway Innovations.
WHERE = src/components/auth/CreatorAuthorityModal.tsx
WHEN = 2026-11-27
HOW = Calls /api/auth/claim (when UNCLAIMED_FIRST_RUN) or /api/auth/unlock and returns in-memory Bearer token.

LICENSE = Apache-2.0
*/
import React, { useState } from 'react';
import { KeyRound, ShieldCheck, X } from 'lucide-react';

export function CreatorAuthorityModal({
  authMode,
  onAuthenticated,
  onClose,
}: {
  authMode: 'ENV_PASSCODE' | 'CLAIMED_LOCAL' | 'UNCLAIMED_FIRST_RUN';
  onAuthenticated: (token: string, expiresAt: string) => void;
  onClose: () => void;
}) {
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isFirstRun = authMode === 'UNCLAIMED_FIRST_RUN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isFirstRun && passcode !== confirmPasscode) {
      setError('Passcodes do not match.');
      return;
    }
    if (passcode.trim().length < 8 && isFirstRun) {
      setError('Creator passcode must be at least 8 characters.');
      return;
    }

    setBusy(true);
    try {
      const endpoint = isFirstRun ? '/api/auth/claim' : '/api/auth/unlock';
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        setError(data.error || 'Authentication failed.');
        return;
      }
      onAuthenticated(data.token, data.expiresAt);
      onClose();
    } catch {
      setError('Network error while verifying Creator Authority.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Creator Authority Verification"
    >
      <div className="w-full max-w-md rounded-xl border border-[#D4AF37]/60 bg-[#121721] p-5 space-y-4">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <KeyRound className="h-5 w-5 text-[#D4AF37]" />
            <h2 className="font-display text-base font-semibold text-white">
              {isFirstRun ? 'Claim First-Run Creator Authority' : 'Unlock Creator Authority Session'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close authority dialog"
            className="rounded p-1 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <p className="text-xs leading-relaxed text-slate-300">
          {isFirstRun
            ? 'No environment passcode is configured yet. Set a Creator Authority passcode (minimum 8 characters) to hash via scrypt on the server and authorize executive decisions, workforce contracts, and mission transitions.'
            : 'Enter your Creator Authority passcode to unlock consequential administrative controls. Session tokens remain strictly in memory.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Creator Passcode
            </label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              required
              autoFocus
              className="w-full rounded border border-[#2D3648] bg-[#0B0E14] px-3 py-2 text-xs text-white"
            />
          </div>

          {isFirstRun && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Confirm Creator Passcode
              </label>
              <input
                type="password"
                value={confirmPasscode}
                onChange={(e) => setConfirmPasscode(e.target.value)}
                required
                className="w-full rounded border border-[#2D3648] bg-[#0B0E14] px-3 py-2 text-xs text-white"
              />
            </div>
          )}

          {error && (
            <div className="rounded border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-[#2D3648] bg-[#171D2A] px-3 py-2 text-xs text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded border border-[#D4AF37] bg-[#D4AF37]/20 px-4 py-2 text-xs font-semibold text-[#F8E7A1] hover:bg-[#D4AF37]/30 disabled:opacity-40"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{busy ? 'Verifying…' : isFirstRun ? 'Claim & Unlock' : 'Unlock Session'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
