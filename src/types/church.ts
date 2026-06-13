import type { ProfileSectionValue } from '@/types/profile';

export interface ChurchRegistrationAssociation {
  id: string;
  name: string | null;
}

export interface ChurchRegistrationOption {
  id: string;
  name: string;
  slug?: string;
  image?: string | null;
  about?: string | null;
  address?: Record<string, ProfileSectionValue> | null;
  association?: ChurchRegistrationAssociation | null;
  conference?: ChurchRegistrationAssociation | null;
  convention?: ChurchRegistrationAssociation | null;
  registrationState?: string;
  status?: string;
  hasAdmin?: boolean;
  membershipSize?: number;
  [key: string]: ProfileSectionValue | ChurchRegistrationAssociation | null | undefined;
}

export interface ChurchRegistrationOptionsMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ChurchRegistrationOptionsData {
  items: ChurchRegistrationOption[];
  meta: ChurchRegistrationOptionsMeta;
}

export interface ChurchRegistrationOptionsResponse {
  status: boolean;
  message?: string;
  data: ChurchRegistrationOptionsData;
}

export interface FetchChurchRegistrationOptionsPayload {
  search?: string;
  page?: number;
  limit?: number;
}

export interface OnboardMemberPayload {
  churchId: string;
}

export interface OnboardMemberResponse {
  status: boolean;
  message?: string;
  data?: ProfileSectionValue;
}

export interface RevokeMembershipRequestPayload {
  requestId: string;
}

export interface RevokeMembershipRequestResponse {
  status: boolean;
  message?: string;
  data?: ProfileSectionValue;
}
