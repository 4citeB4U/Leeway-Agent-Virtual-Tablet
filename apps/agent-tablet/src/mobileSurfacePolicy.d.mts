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
