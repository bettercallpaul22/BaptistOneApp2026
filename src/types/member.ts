import type { ProfileCompletion, ProfileSectionValue } from '@/types/profile';

export type MemberRecord = Record<string, ProfileSectionValue>;
export type MembershipStatus = 'NONE' | 'REJECTED' | 'PENDING' | 'APPROVED';

export interface MemberBasicProfile extends MemberRecord {
  displayName: string | null;
  username: string | null;
  email: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  avatarFileId: string | null;
  coverImageFileId: string | null;
  firstName: string | null;
  lastName: string | null;
  id: string;
  profileId: string;
  status: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  churchId: string | null;
  familyId: string | null;
  familyRole: string | null;
}

export interface MemberChurch extends MemberRecord {
  id: string;
  name: string;
  image: string | null;
  about: string | null;
  address: MemberRecord;
  socialLinks: MemberRecord;
  association: MemberRecord | null;
}

export interface MemberMembershipAndPreferences extends MemberRecord {
  churchId: string | null;
  id: string;
  memberSince: string | null;
  membershipType: string | null;
  receivingNotifications: boolean;
  financialDonationsParticipation: boolean;
  reminderTimezone: string | null;
  ministries: ProfileSectionValue[];
  portfolioId: string | null;
  ministryMemberships: ProfileSectionValue[];
}

export interface MemberAccount {
  basicProfile: MemberBasicProfile;
  membershipAndPreferences: MemberMembershipAndPreferences;
  church: MemberChurch | null;
  pendingMembershipRequest: MemberRecord | null;
  membershipStatus: MembershipStatus | null;
  profileCompletion: ProfileCompletion | null;
}

export interface MemberAccountResponse {
  status: boolean;
  data: MemberAccount;
  message?: string;
}

export interface MemberBasicProfileUpdateRequest {
  avatarFileId?: string | null;
  coverImageFileId?: string | null;
}

export interface StoredMemberAccount {
  data: MemberAccount;
  lastFetchedAt: string;
}
