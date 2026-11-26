/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.MOBILE.SURFACE_POLICY.TYPES
TAG: LEEWAY.TABLET.MOBILE.LOGISTICS_PORTABLE_LAUNCH.TYPES.V1
5WH:
WHAT = Declare the pure mobile Tablet policy imported by TypeScript surfaces.
WHY = Keep the exact runtime helper testable without a competing TypeScript implementation.
WHO = Creator-authorized Tablet source contributors.
WHERE = apps/agent-tablet/src/mobileSurfacePolicy.d.mts.
WHEN = 2026-11-23.
HOW = Type-only contract; does not provide identity or capability authorization.
LICENSE = Existing repository terms.
*/
export function isCompactTabletViewport(width: number, height: number): boolean;
export function browserPlatformFamily(userAgent?: string): 'WINDOWS' | 'LINUX' | 'ANDROID' | 'APPLE' | 'UNVERIFIED DEVICE';
export function tabletSurfaceUrl(rawUrl: string, appId: string, surface: 'tablet' | 'widget', compact?: boolean): string;

export interface PublishedAppSurfaceDecision {
  state: 'HOSTED_APPROVED' | 'LOCAL_ADAPTER_AUTHORIZED' | 'UNAVAILABLE' | 'DENIED';
  url?: string;
  capabilityRef?: string;
  entitlement?: 'ACTIVE' | 'DEGRADED' | 'REVOKED';
  serviceAvailability?: 'AVAILABLE' | 'UNAVAILABLE';
  adapterConnectivity?: 'CONNECTED' | 'DISCONNECTED';
  sessionAuthorization?: 'AUTHORIZED' | 'UNAUTHORIZED';
  informationPersistence?: 'PERSISTED' | 'UNBOUND';
}
export interface PublishedAppSurfaceResult {
  state: 'HOSTED_APPROVED' | 'LOCAL_ADAPTER_AUTHORIZED' | 'UNAVAILABLE' | 'DENIED';
  url: string | null;
  reason: string | null;
  entitlement: string;
  serviceAvailability: string;
  adapterConnectivity: string;
  sessionAuthorization: string;
  informationPersistence: string;
}
export function resolvePublishedAppSurface(app: {id: string; capabilityRef: string}, surface: 'tablet' | 'widget', compact: boolean, decision?: PublishedAppSurfaceDecision): PublishedAppSurfaceResult;
