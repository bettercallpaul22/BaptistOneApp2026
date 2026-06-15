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

export interface ChurchComplianceBadge extends Record<string, ProfileSectionValue> {
  status?: string | null;
  label?: string | null;
  visible?: boolean | null;
  kycStatus?: string | null;
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
  complianceBadge?: ChurchComplianceBadge | null;
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

export interface ChurchRegistrationReviewMetadata {
  adminName?: string | null;
  churchName?: string | null;
  [key: string]: ProfileSectionValue;
}

export interface ChurchRegistrationReviewDetails {
  id: string;
  status: string;
  pastorName: string;
  pastorEmail: string;
  requestedAt: string;
  respondedAt: string | null;
  reminderDueAt: string | null;
  churchId: string;
  churchName: string;
  churchStatus: string;
  adminProfileId: string;
  metadata?: ChurchRegistrationReviewMetadata | null;
}

export interface ChurchRegistrationReviewDetailsResponse {
  status: boolean;
  message?: string;
  data: ChurchRegistrationReviewDetails;
}

export interface ChurchRegistrationReviewActionResponse {
  status?: boolean;
  success?: boolean;
  message?: string;
  data?: ChurchRegistrationReviewDetails | null;
}

export interface ChurchPaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ChurchPaginatedData<TItem> {
  items: TItem[];
  meta: ChurchPaginatedMeta;
}

export interface ChurchFileAsset extends Record<string, ProfileSectionValue> {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  key?: string | null;
  contentType?: string | null;
  size?: number | null;
  checksum?: string | null;
  altText?: string | null;
  url?: string | null;
  bucketName?: string | null;
  region?: string | null;
  versionId?: string | null;
  metadata?: Record<string, ProfileSectionValue> | null;
  tags?: Record<string, ProfileSectionValue> | null;
  uploadedById?: string | null;
  uploadedAt?: string | null;
}

export type ChurchLeadershipImage = ChurchFileAsset;

export interface ChurchLeadershipItem extends Record<string, ProfileSectionValue> {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  churchId: string;
  type: string;
  name: string;
  title?: string | null;
  bio?: string | null;
  imageFileId?: string | null;
  email?: string | null;
  phone?: string | null;
  orderIndex?: number | null;
  isActive?: boolean;
  image?: ChurchLeadershipImage | null;
}

export type ChurchLeadershipMeta = ChurchPaginatedMeta;

export type ChurchLeadershipResponse = ChurchPaginatedData<ChurchLeadershipItem>;

export interface ChurchLeadershipApiResponse {
  status?: boolean;
  message?: string;
  data?: ChurchLeadershipResponse;
  items?: ChurchLeadershipItem[];
  meta?: ChurchLeadershipMeta;
}

export interface ChurchDocumentItem extends Record<string, ProfileSectionValue> {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  churchId: string;
  name: string;
  fileId?: string | null;
  isActive?: boolean;
  orderIndex?: number | null;
  file?: ChurchFileAsset | null;
}

export type ChurchDocumentMeta = ChurchPaginatedMeta;
export type ChurchDocumentsResponse = ChurchPaginatedData<ChurchDocumentItem>;

export interface ChurchDocumentsApiResponse {
  status?: boolean;
  message?: string;
  data?: ChurchDocumentsResponse;
  items?: ChurchDocumentItem[];
  meta?: ChurchDocumentMeta;
}

export interface ChurchEventLocation extends Record<string, ProfileSectionValue> {
  name?: string | null;
  address?: string | null;
}

export interface ChurchEventItem extends Record<string, ProfileSectionValue> {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  churchId: string;
  type: string;
  title: string;
  description?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  isAllDay?: boolean;
  location?: ChurchEventLocation | null;
  eventImageFileId?: string | null;
  eventImage?: ChurchFileAsset | null;
  orderIndex?: number | null;
}

export type ChurchEventMeta = ChurchPaginatedMeta;
export type ChurchEventsResponse = ChurchPaginatedData<ChurchEventItem>;

export interface ChurchEventsApiResponse {
  status?: boolean;
  message?: string;
  data?: ChurchEventsResponse;
  items?: ChurchEventItem[];
  meta?: ChurchEventMeta;
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
