/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.FORMULA.ADAPTER
TAG: LEEWAY.FORMULA.FABRIC.CLIENT

5WH:
WHAT = Client adapter implementing LEEWAY_FORMULA_FABRIC_CLIENT contract (v1.0.0) with fail-closed boundary.
WHY = Connect to an authorized live LeeWay Formula Fabric service when configured and fail closed without fabricating Formula metrics when absent.
WHO = Leeway Innovations — Formula Governance Integration
WHERE = src/leeway/formulaAdapter.ts
WHEN = 2026-11-27
HOW = Reads VITE_LEEWAY_FORMULA_FABRIC_URL, probes /formula/v1/health and /formula/v1/authority, or returns BLOCKED_NO_VERIFIED_FORMULA_CAPABILITY.

LICENSE = Apache-2.0
*/

import { FormulaBridgeStatus } from '../types/studio';

export const FORMULA_CLIENT_CONTRACT = {
  schemaVersion: '1.0.0',
  contractId: 'LEEWAY_FORMULA_FABRIC_CLIENT',
  basePath: '/formula/v1',
  fallbackOrder: [
    'authorized live Formula Fabric',
    'verified sealed offline bundle',
    'BLOCKED_NO_VERIFIED_FORMULA_CAPABILITY',
  ],
} as const;

export function getConfiguredFormulaUrl(): string | null {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    const raw = env?.VITE_LEEWAY_FORMULA_FABRIC_URL?.trim();
    if (!raw) return null;
    return raw.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export async function inspectFormulaFabricAuthority(): Promise<FormulaBridgeStatus> {
  const endpointUrl = getConfiguredFormulaUrl();
  const checkedAt = new Date().toISOString();

  if (!endpointUrl) {
    return {
      contractId: FORMULA_CLIENT_CONTRACT.contractId,
      schemaVersion: FORMULA_CLIENT_CONTRACT.schemaVersion,
      endpointConfigured: false,
      endpointUrl: null,
      authorityState: 'BLOCKED_NO_VERIFIED_FORMULA_CAPABILITY',
      lastCheckedAt: checkedAt,
      message:
        'No authorized live Formula Fabric URL (VITE_LEEWAY_FORMULA_FABRIC_URL) or sealed offline Formula bundle is provisioned. Local segmentation runs via deterministic Canvas 2D geometry without counterfeit Formula claims.',
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${endpointUrl}/authority`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return {
        contractId: FORMULA_CLIENT_CONTRACT.contractId,
        schemaVersion: FORMULA_CLIENT_CONTRACT.schemaVersion,
        endpointConfigured: true,
        endpointUrl,
        authorityState: 'BLOCKED_NO_VERIFIED_FORMULA_CAPABILITY',
        lastCheckedAt: checkedAt,
        message: `Formula Fabric authority check returned HTTP ${res.status}. Fail-closed rule applied.`,
      };
    }

    const payload = (await res.json()) as { authorityState?: string; formulaVersion?: string };
    return {
      contractId: FORMULA_CLIENT_CONTRACT.contractId,
      schemaVersion: FORMULA_CLIENT_CONTRACT.schemaVersion,
      endpointConfigured: true,
      endpointUrl,
      authorityState: payload.authorityState === 'VERIFIED' ? 'VERIFIED' : 'AVAILABLE',
      lastCheckedAt: checkedAt,
      message: `Connected to authorized Formula Fabric (${payload.formulaVersion ?? 'version reported by server'}).`,
    };
  } catch (err) {
    return {
      contractId: FORMULA_CLIENT_CONTRACT.contractId,
      schemaVersion: FORMULA_CLIENT_CONTRACT.schemaVersion,
      endpointConfigured: true,
      endpointUrl,
      authorityState: 'BLOCKED_NO_VERIFIED_FORMULA_CAPABILITY',
      lastCheckedAt: checkedAt,
      message: `Formula Fabric unreachable (${err instanceof Error ? err.message : 'network error'}). Fail-closed rule applied.`,
    };
  }
}
