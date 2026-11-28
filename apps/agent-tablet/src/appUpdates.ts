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

// Injected at build time from `git rev-parse HEAD` by vite.config.ts. Empty when
// the tablet is built without a git worktree (e.g. a static export).
const TABLET_BUILD_COMMIT: string | null =
  typeof __LEEWAY_INSTALLED_COMMIT__ === 'string' && __LEEWAY_INSTALLED_COMMIT__
    ? __LEEWAY_INSTALLED_COMMIT__
    : null;

export type AppUpdateBinding = {
  appId: WorkstationAppId;
  label: string;
  owner: string;
  repo: string;
  installedCommit: string | null;
  kind: 'TABLET' | 'PUBLISHED_APP' | 'LOCAL_ONLY';
};

export type AppUpdateState = 'CHECKING' | 'CURRENT' | 'UPDATE_AVAILABLE' | 'UNBOUND' | 'ERROR';

export type AppUpdateCheck = AppUpdateBinding & {
  latestCommit: string | null;
  state: AppUpdateState;
  detail?: string;
};

export const APP_UPDATE_BINDINGS: AppUpdateBinding[] = [
  { appId: 'desktop', label: 'LeeWay Agent Virtual Tablet', owner: '4citeB4U', repo: 'Leeway-Agent-Virtual-Tablet', installedCommit: TABLET_BUILD_COMMIT, kind: 'TABLET' },
  { appId: 'globalP2p', label: 'LeeWay Global P2P', owner: 'agentlee2116-ctrl', repo: 'Leeway-Global-P2P', installedCommit: '94c905da4a2dc3a7916047afd6ccbb5d41aefbd6', kind: 'PUBLISHED_APP' },
  { appId: 'directConnect', label: 'Direct Connect Portal', owner: 'larrylee2912-ux', repo: 'Direct-Connect-Portal', installedCommit: '9a0e0962bc148207a4557940b28839acf54e3f24', kind: 'PUBLISHED_APP' },
  { appId: 'motionGlyph', label: 'Motion-Glyph-LAB', owner: 'larrylee2912-ux', repo: 'Motion-Glyph-LAB', installedCommit: '59c131b383cd13a15ce1b7f1b55481780f3ded71', kind: 'PUBLISHED_APP' },
  { appId: 'watchWinSale', label: 'Watch-Win-Sale', owner: 'larrylee2912-ux', repo: 'Watch-Win-Sale', installedCommit: '8ec657c610585f51ebe27e30ed6f9b1df939bc2b', kind: 'PUBLISHED_APP' },
  { appId: 'settings', label: 'Settings & About — Journey with LeeWay', owner: '4citeB4U', repo: 'Leeway-Agent-Virtual-Tablet', installedCommit: TABLET_BUILD_COMMIT, kind: 'TABLET' },
  { appId: 'creatorControl', label: 'LeeWay Core — Creator Control Center', owner: '4citeB4U', repo: 'Leeway-Agent-Virtual-Tablet', installedCommit: TABLET_BUILD_COMMIT, kind: 'LOCAL_ONLY' }
];

export const githubCommitUrl = (binding: AppUpdateBinding) =>
  `https://api.github.com/repos/${binding.owner}/${binding.repo}/commits/main`;

// One source of truth for the GitHub comparison, shared by Update Center and
// the always-on update warning banner.
export async function checkGithubUpdate(binding: AppUpdateBinding): Promise<AppUpdateCheck> {
  try {
    const response = await fetch(githubCommitUrl(binding), { cache: 'no-store' });
    if (response.status === 409) return { ...binding, latestCommit: null, state: 'UNBOUND', detail: 'GitHub reports no commit for this repository yet.' };
    if (!response.ok) throw new Error(`GITHUB_${response.status}`);
    const data = await response.json() as { sha?: string };
    const latestCommit = data.sha || null;
    if (!binding.installedCommit) return { ...binding, latestCommit, state: 'UNBOUND', detail: 'No installed commit recorded for this surface.' };
    if (!latestCommit) return { ...binding, latestCommit, state: 'ERROR', detail: 'GitHub did not return a commit SHA.' };
    return { ...binding, latestCommit, state: latestCommit === binding.installedCommit ? 'CURRENT' : 'UPDATE_AVAILABLE' };
  } catch (error) {
    return { ...binding, latestCommit: null, state: 'ERROR', detail: String(error) };
  }
}

export async function checkGithubUpdates(): Promise<AppUpdateCheck[]> {
  return Promise.all(APP_UPDATE_BINDINGS.map(checkGithubUpdate));
}
