/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT_TABLET.CREATOR_BUSINESS_READ
TAG: LEEWAY.TABLET.ORIGINAL_CREATOR_CUSTOMER_OVERVIEW_VALIDATOR.V1
5WH:
WHAT = Verify an original Runtime-authorized Creator business read response before rendering customer metrics in Tablet.
WHY = No customer extension, public HTML frame or browser setting can grant Creator business access or fake registrations.
WHO = Original Runtime/CRM/ERP/Bridge authority; outside support renders read-only data, not Agent Lee.
WHERE = apps/agent-tablet/src/components/creatorBusinessReadModel.ts.
WHEN = 2026-11-24.
HOW = Exact schema, marker/grant, bounded counts, tenant scope and safe customer directory checks.
LICENSE = Existing repository terms; no new issuer or customer data store.
*/
export type CreatorCounts = {
  invitationsIssued: number;
  invitationsRedeemed: number;
  verifiedAccounts: number;
  registeredContacts: number;
  enrolledDevices: number;
  activeAccounts: number;
  marketingOptIns: number;
};
export type CreatorCustomer = {
  contactRef: string;
  accountRef: string;
  displayName: string;
  verifiedEmail: string;
  accountStatus: 'REGISTERED' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  edition: 'PERSONAL' | 'INDUSTRIAL';
  marketingAllowed: boolean;
  enrolledDeviceCount: number;
  bridgeEnrollment: 'ENROLLED' | 'PENDING' | 'REVOKED' | 'NO_DEVICE' | 'NOT_PROBED';
  verifiedExtensionCount: number;
  extensionFleetStatus: 'CURRENT' | 'UPDATE_REQUIRED' | 'PENDING' | 'REVOKED' | 'NO_EXTENSION' | 'NOT_PROBED';
  registeredAt: string;
  lastVerifiedDeviceAt: string | null;
};
export type CreatorBusinessOverview = {
  schema: 'leeway.creator.business-overview.v1';
  authority: 'ORIGINAL_RUNTIME_CRM_ERP';
  status: 'VERIFIED';
  grant: 'CRM_ERP_CREATOR_BUSINESS_READ';
  verifiedCreator: true;
  businessTenantRef: string;
  observedAt: string;
  counts: CreatorCounts;
  customers: CreatorCustomer[];
  nextCursor: string | null;
  cachePolicy: 'NO_STORE';
  monitoringScope: 'CUSTOMER_ACCOUNT_DEVICE_AND_EXTENSION_REGISTRATION_STATUS_ONLY';
  privateContentAccess: false;
  extensionDeviceCommands: false;
};
const metrics: (keyof CreatorCounts)[] = [
  'invitationsIssued', 'invitationsRedeemed','verifiedAccounts','registeredContacts',
  'enrolledDevices','activeAccounts','marketingOptIns'
];
const deny = (): never => { throw new Error('CREATOR_TABLET_RUNTIME_READBACK_UNVERIFIED'); };
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const validRef = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:@/-]{3,159}$/.test(value);
const validTime = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= 40 && Number.isFinite(Date.parse(value));
const validEmail = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !/[<>\r\n\u0000]/.test(value);
export function parseCreatorBusinessOverview(raw: unknown): CreatorBusinessOverview {
  if (!object(raw) || raw.schema !== 'leeway.creator.business-overview.v1' ||
      raw.authority !== 'ORIGINAL_RUNTIME_CRM_ERP' || raw.status !== 'VERIFIED' ||
      raw.grant !== 'CRM_ERP_CREATOR_BUSINESS_READ' || raw.verifiedCreator !== true ||
      !validRef(raw.businessTenantRef) || !validTime(raw.observedAt) ||
      raw.cachePolicy !== 'NO_STORE' ||
      raw.monitoringScope !== 'CUSTOMER_ACCOUNT_DEVICE_AND_EXTENSION_REGISTRATION_STATUS_ONLY' ||
      raw.privateContentAccess !== false || raw.extensionDeviceCommands !== false ||
      !object(raw.counts) || !Array.isArray(raw.customers) || raw.customers.length > 100 ||
      !(raw.nextCursor === null ||
        typeof raw.nextCursor === 'string' && /^[A-Za-z0-9_-]{8,128}$/.test(raw.nextCursor)))
    return deny();
  const counts: Partial<CreatorCounts> = {};
  for (const key of metrics) {
    const n = raw.counts[key];
    if (typeof n !== 'number' || !Number.isSafeInteger(n) || n < 0) return deny();
    counts[key] = n;
  }
  const customers: CreatorCustomer[] = [];
  const seen = new Set<string>();
  for (const entry of raw.customers) {
    if (!object(entry) || !validRef(entry.contactRef) || !validRef(entry.accountRef) ||
        seen.has(entry.accountRef) || !validEmail(entry.verifiedEmail) ||
        typeof entry.displayName !== 'string' ||
        !entry.displayName.trim() || entry.displayName.length > 120 ||
        !['REGISTERED', 'ACTIVE', 'SUSPENDED', 'CLOSED'].includes(String(entry.accountStatus)) ||
        !['PERSONAL', 'INDUSTRIAL'].includes(String(entry.edition)) ||
        typeof entry.marketingAllowed !== 'boolean' ||
        typeof entry.enrolledDeviceCount !== 'number' ||
        !Number.isSafeInteger(entry.enrolledDeviceCount) || entry.enrolledDeviceCount < 0 ||
        !['ENROLLED','PENDING','REVOKED','NO_DEVICE','NOT_PROBED'].includes(String(entry.bridgeEnrollment)) ||
        typeof entry.verifiedExtensionCount !== 'number' ||
        !Number.isSafeInteger(entry.verifiedExtensionCount) || entry.verifiedExtensionCount < 0 ||
        !['CURRENT','UPDATE_REQUIRED','PENDING','REVOKED','NO_EXTENSION','NOT_PROBED'].includes(String(entry.extensionFleetStatus)) ||
        !validTime(entry.registeredAt) ||
        !(entry.lastVerifiedDeviceAt === null || validTime(entry.lastVerifiedDeviceAt)))
      return deny();
    seen.add(entry.accountRef);
    customers.push({
      contactRef: entry.contactRef, accountRef:entry.accountRef,
      displayName:entry.displayName.trim(), verifiedEmail:entry.verifiedEmail.toLowerCase(),
      accountStatus:entry.accountStatus as CreatorCustomer['accountStatus'],
      edition:entry.edition as CreatorCustomer['edition'],
      marketingAllowed:entry.marketingAllowed,
      enrolledDeviceCount:entry.enrolledDeviceCount,
      bridgeEnrollment:entry.bridgeEnrollment as CreatorCustomer['bridgeEnrollment'],
      verifiedExtensionCount:entry.verifiedExtensionCount,
      extensionFleetStatus:entry.extensionFleetStatus as CreatorCustomer['extensionFleetStatus'],
      registeredAt:entry.registeredAt,
      lastVerifiedDeviceAt:typeof entry.lastVerifiedDeviceAt === 'string' ? entry.lastVerifiedDeviceAt : null
    });
  }
  return {
    schema:'leeway.creator.business-overview.v1',
    authority:'ORIGINAL_RUNTIME_CRM_ERP',
    status:'VERIFIED',grant:'CRM_ERP_CREATOR_BUSINESS_READ',verifiedCreator:true,
    businessTenantRef:raw.businessTenantRef,observedAt:raw.observedAt,
    counts:counts as CreatorCounts,customers,nextCursor:raw.nextCursor as string | null,
    cachePolicy:'NO_STORE',
    monitoringScope:'CUSTOMER_ACCOUNT_DEVICE_AND_EXTENSION_REGISTRATION_STATUS_ONLY',
    privateContentAccess:false,extensionDeviceCommands:false
  };
}
