import type { ProfileSectionValue } from '@/types/profile';

export interface ChurchRegistrationAssociation extends Record<string, ProfileSectionValue> {
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

export interface ChurchAddress extends Record<string, ProfileSectionValue> {
  line1?: string | null;
  line2?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export interface ChurchSocialLinks extends Record<string, ProfileSectionValue> {
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  x?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
}

export interface ChurchContactFields extends Record<string, ProfileSectionValue> {
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

export interface ChurchPerson extends Record<string, ProfileSectionValue> {
  id?: string;
  name?: string | null;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  title?: string | null;
  avatarUrl?: string | null;
}

export interface ChurchComplianceMetadata extends Record<string, ProfileSectionValue> {
  registrationNumber?: string | null;
  registrationState?: string | null;
  registrationStatus?: string | null;
  complianceStatus?: string | null;
  registeredAt?: string | null;
  approvedAt?: string | null;
}

export interface PublicChurchDetails extends Record<string, ProfileSectionValue> {
  id: string;
  name: string;
  slug?: string | null;
  image?: string | null;
  logo?: string | null;
  coverImage?: string | null;
  coverImageUrl?: string | null;
  about?: string | null;
  status?: string | null;
  registrationState?: string | null;
  hasAdmin?: boolean;
  membershipSize?: number | null;
  memberCount?: number | null;
  address?: ChurchAddress | null;
  socialLinks?: ChurchSocialLinks | null;
  contact?: ChurchContactFields | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  email?: string | null;
  phone?: string | null;
  admins?: ChurchPerson[];
  pastors?: ChurchPerson[];
  compliance?: ChurchComplianceMetadata | null;
  registration?: ChurchComplianceMetadata | null;
  association?: ChurchRegistrationAssociation | Record<string, ProfileSectionValue> | null;
  conference?: ChurchRegistrationAssociation | Record<string, ProfileSectionValue> | null;
  convention?: ChurchRegistrationAssociation | Record<string, ProfileSectionValue> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicChurchDetailsResponse {
  status: boolean;
  message?: string;
  data: PublicChurchDetails;
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
