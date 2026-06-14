export interface FamilyMemberSearchItem {
  memberId: string;
  profileId: string;
  displayName: string | null;
  email: string | null;
  username: string | null;
  avatarUrl: string | null;
  avatarFileId: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  churchId: string | null;
  churchName: string | null;
  familyId: string | null;
  familyRole: string | null;
}

export interface FamilyMemberSearchResponse {
  status: boolean;
  message?: string;
  data?: {
    items: FamilyMemberSearchItem[];
    meta?: {
      source?: string;
    };
  };
}

export interface InviteFamilyMemberPayload {
  relationship: FamilyRelationship;
  name: string;
  email?: string;
  phone?: string;
  message: string;
}

export interface InviteFamilyMemberResponse {
  status: boolean;
  message?: string;
  data?: unknown;
}

export type FamilyRelationship = 'SPOUSE' | 'CHILD' | 'DEPENDANT' | 'OTHER';

export interface LinkFamilyMemberPayload {
  targetMemberId: string;
  relationship: FamilyRelationship;
}

export interface LinkFamilyMemberResponse {
  status: boolean;
  message?: string;
  data?: unknown;
}

export type FamilyLinkRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export interface FamilyLinkRequest {
  id: string;
  familyId: string;
  relationship: FamilyRelationship;
  message: string | null;
  status: FamilyLinkRequestStatus;
  createdAt: string;
  requesterMemberId: string;
  requesterProfileId: string;
  requesterName: string | null;
  requesterUsername: string | null;
  requesterAvatarUrl: string | null;
  requesterAvatarFileId: string | null;
}

export interface FamilyLinkRequestsResponse {
  status: boolean;
  message?: string;
  data?: {
    items: FamilyLinkRequest[];
  };
}

export interface UserFamily {
  id: string;
  createdAt: string;
  updatedAt: string;
  churchId: string | null;
  name: string;
  primaryMemberId: string;
  createdByMemberId: string;
  status: string;
  metadata?: Record<string, unknown>;
}

export interface UserFamilyMember {
  memberId: string;
  profileId: string;
  displayName: string | null;
  email: string | null;
  username: string | null;
  avatarUrl: string | null;
  avatarFileId: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  churchId: string | null;
  churchName?: string | null;
  familyRole: string | null;
  familyLinkedAt: string | null;
}

export interface UserFamilyInvitation {
  id: string;
  createdAt: string;
  updatedAt: string;
  familyId: string;
  invitedByMemberId: string;
  matchedMemberId: string | null;
  relationship: FamilyRelationship;
  invitedName: string | null;
  invitedEmail: string | null;
  invitedPhone: string | null;
  inviteUrl: string | null;
  message: string | null;
  status: string;
  sentAt: string | null;
  acceptedAt: string | null;
  metadata?: Record<string, unknown>;
}

export interface UserFamilyResponse {
  status: boolean;
  message?: string;
  data?: {
    family: UserFamily | null;
    members: UserFamilyMember[];
    invitations: UserFamilyInvitation[];
  };
}
