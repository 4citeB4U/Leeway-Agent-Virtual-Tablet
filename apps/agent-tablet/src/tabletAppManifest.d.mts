/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.USER_APP.MANIFEST.TYPES
TAG: LEEWAY.TABLET.USER_APP.CANDIDATE_VALIDATION.TYPES.V1
5WH:
WHAT = Bind typed Tablet app candidates to one JavaScript manifest validator.
WHY = Prevent a second source or client-side entitlement authority.
WHO = Creator-authorized Tablet source contributors.
WHERE = apps/agent-tablet/src/tabletAppManifest.d.mts.
WHEN = 2026-11-23.
HOW = Type declaration for fail-closed candidate parser, not an installation API.
LICENSE = Existing repository terms.
*/
export const TABLET_APP_SCHEMA: 'leeway.tablet-app.v1';
export type LeeWayTabletAppCandidate = Readonly<{
 schema:'leeway.tablet-app.v1'; appId:string; publisherId:string; title:string; version:string;
 source:Readonly<{repositoryUrl:string;commitSha:string;license:string}>;
 artifact:Readonly<{kind:'web';sha256:string}>;
 launch:Readonly<{url:string}>;
 platforms:readonly ('Windows'|'Linux'|'Android'|'Apple')[];
 surfaces:readonly ('tablet'|'widget')[];
 requestedPermissions:readonly string[];
 candidateState:'VALIDATED_SOURCE_CANDIDATE_ONLY';
 installed:false; executionAuthorized:false; toolGrants:'NOT_GRANTED';
}>;
export function validateTabletAppCandidate(input: unknown): LeeWayTabletAppCandidate;
