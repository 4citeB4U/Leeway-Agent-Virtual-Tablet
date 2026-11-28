/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.UPDATES
TAG: LEEWAY.TABLET.APP_UPDATE_MANIFEST.V1
WHAT: Installed-version manifest for the tablet and its published applications.
WHY: An update flag must be based on a real GitHub commit comparison, not a cosmetic badge.
WHO: LeeWay Industries / creator-authorized outside contributor (LW-OPENCODE).
WHERE: apps/agent-tablet/src/appUpdates.ts
WHEN: 2026-11-27
HOW: Read-only GitHub compare metadata plus local request routing; no new authority or deployment plane.
AUTHORITY: LOCAL_OPERATIONS_ONLY. No production deployment or receipt claim.
LICENSE: Existing repository terms.
*/
import type { WorkstationAppId } from './types';

export type AppUpdateBinding = {
  appId: WorkstationAppId;
  label: string;
  owner: string;
  repo: string;
  installedCommit: string | null;
  kind: 'TABLET' | 'PUBLISHED_APP' | 'LOCAL_ONLY';
};

export const APP_UPDATE_BINDINGS: AppUpdateBinding[] = [
  { appId: 'desktop', label: 'LeeWay Agent Virtual Tablet', owner: '4citeB4U', repo: 'Leeway-Agent-Virtual-Tablet', installedCommit: '466a2d2c37cc2b355a3850e6efd39c2f2f040361', kind: 'TABLET' },
  { appId: 'globalP2p', label: 'LeeWay Global P2P', owner: 'agentlee2116-ctrl', repo: 'Leeway-Global-P2P', installedCommit: '94c905da4a2dc3a7916047afd6ccbb5d41aefbd6', kind: 'PUBLISHED_APP' },
  { appId: 'directConnect', label: 'Direct Connect Portal', owner: 'larrylee2912-ux', repo: 'Direct-Connect-Portal', installedCommit: 'a7dbe5f73c5b02f4a8f52c7bb059079523838781', kind: 'PUBLISHED_APP' },
  { appId: 'motionGlyph', label: 'Motion-Glyph-LAB', owner: 'larrylee2912-ux', repo: 'Motion-Glyph-LAB', installedCommit: '59c131b383cd13a15ce1b7f1b55481780f3ded71', kind: 'PUBLISHED_APP' },
  { appId: 'watchWinSale', label: 'Watch-Win-Sale', owner: 'larrylee2912-ux', repo: 'Watch-Win-Sale', installedCommit: '8ec657c610585f51ebe27e30ed6f9b1df939bc2b', kind: 'PUBLISHED_APP' },
  { appId: 'settings', label: 'Settings & About — Journey with LeeWay', owner: '4citeB4U', repo: 'Leeway-Agent-Virtual-Tablet', installedCommit: '466a2d2c37cc2b355a3850e6efd39c2f2f040361', kind: 'TABLET' },
  { appId: 'creatorControl', label: 'LeeWay Core — Creator Control Center', owner: '4citeB4U', repo: 'Leeway-Agent-Virtual-Tablet', installedCommit: '466a2d2c37cc2b355a3850e6efd39c2f2f040361', kind: 'LOCAL_ONLY' }
];

export const githubCommitUrl = (binding: AppUpdateBinding) =>
  `https://api.github.com/repos/${binding.owner}/${binding.repo}/commits/main`;
