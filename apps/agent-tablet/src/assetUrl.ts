/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT.TABLET.ASSET.ROUTING
TAG: LEEWAY.TABLET.BASE_AWARE_ASSETS.V1
5WH:
WHAT = Resolve Tablet-owned public assets under the active deployment base path.
WHY = GitHub Pages serves the Tablet below /Leeway-Agent-Virtual-Tablet/ while local hosts serve at /.
WHO = LeeWay Agent Virtual Tablet presentation layer.
WHERE = apps/agent-tablet/src/assetUrl.ts.
WHEN = 2026-11-22.
HOW = Resolve relative public assets against the document base URI without changing external URLs.
LICENSE = Existing repository terms; no new license asserted.
*/

export function tabletAssetUrl(asset: string): string {
  if (/^(?:https?:|data:|blob:)/i.test(asset)) return asset;
  const relativeAsset = asset.replace(/^\/+/, '');
  if (typeof document === 'undefined') return asset;
  return new URL(relativeAsset, document.baseURI).toString();
}
