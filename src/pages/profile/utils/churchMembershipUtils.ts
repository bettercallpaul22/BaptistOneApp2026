import type { ChurchRegistrationOption } from '@/types/church';
import type { MemberAccount, MemberRecord, MembershipStatus } from '@/types/member';
import { churchAssociationFallback } from '../config/profileConfig';

export const getChurchAssociationName = (church: ChurchRegistrationOption) =>
  church.association?.name?.trim() || churchAssociationFallback;

export const joinableMembershipStatuses: Array<MembershipStatus | null> = [
  null,
  'NONE',
  'REJECTED',
];

export const canRequestChurchMembership = (status: MembershipStatus | null | undefined) =>
  joinableMembershipStatuses.includes(status ?? null);

export const getMemberRecordString = (record: MemberRecord | null | undefined, key: string) => {
  const value = record?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : '';
};

export const getMemberRecordId = (record: unknown): string => {
  if (!record || typeof record !== 'object') return '';

  const source = Array.isArray(record) ? record[0] : record;
  if (!source || typeof source !== 'object') return '';

  const recordObject = source as Record<string, unknown>;
  const directIdKeys = [
    'id',
    'requestId',
    'membershipRequestId',
    'pendingMembershipRequestId',
    'membership_request_id',
    'pending_membership_request_id',
  ];

  for (const key of directIdKeys) {
    const value = recordObject[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  const nestedKeys = [
    'request',
    'membershipRequest',
    'pendingMembershipRequest',
    'membership_request',
  ];

  for (const key of nestedKeys) {
    const nestedId = getMemberRecordId(recordObject[key]);
    if (nestedId) return nestedId;
  }

  return '';
};

export const getNestedMemberRecord = (
  record: MemberRecord | null | undefined,
  key: string,
): MemberRecord | null => {
  const value = record?.[key];
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as MemberRecord)
    : null;
};

export const getPendingMembershipRequestId = (memberAccount: MemberAccount | null) =>
  getMemberRecordId(memberAccount?.pendingMembershipRequest);

export const getApprovedChurchDetails = (memberAccount: MemberAccount | null) => {
  const church = memberAccount?.church;
  const association = church?.association;
  const conference = getNestedMemberRecord(association, 'conference');

  return {
    churchName: church?.name?.trim() || 'your church',
    associationName: getMemberRecordString(association, 'name'),
    conferenceName: getMemberRecordString(conference, 'name'),
  };
};

export const getMemberChurchInformationRows = (
  memberAccount: MemberAccount | null,
): Array<readonly [string, string]> => {
  const church = memberAccount?.church;
  const association = church?.association;
  const conference = getNestedMemberRecord(association, 'conference');
  const convention = getNestedMemberRecord(conference, 'convention');
  const rows: Array<readonly [string, string]> = [
    ['Church Name', church?.name?.trim() ?? ''],
    ['Association Name', getMemberRecordString(association, 'name')],
    ['Conference Name', getMemberRecordString(conference, 'name')],
    ['Convention Name', getMemberRecordString(convention, 'name')],
  ];

  return rows.filter(([, value]) => value);
};
