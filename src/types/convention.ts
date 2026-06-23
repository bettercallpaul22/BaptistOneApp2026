export type ConventionTabKey = 'programs' | 'publications' | 'announcement' | 'documents';

export type AttendanceMode = 'PHYSICAL' | 'ONLINE' | 'BOTH';

export type PricingModel = 'FREE' | 'SUBSCRIPTION' | 'ONE_TIME';

export type PublicationAccessStatus = 'ACTIVE' | 'INACTIVE';

export type RegistrationStatus = 'PAID' | 'PENDING_PAYMENT';

export type AnnouncementType = 'ANNOUNCEMENT' | 'FUND_CALL';

export interface ConventionFileAsset {
  id: string;
  key: string;
  contentType: string;
  size: number;
  url: string;
  bucketName: string;
  region: string | null;
}

export interface ConventionProgramRegistrationField {
  key: string;
  type: string;
  label: string;
  options?: string[];
  required: boolean;
}

export interface ConventionProgram {
  id: string;
  conventionId: string;
  title: string;
  slug: string;
  description: string;
  attendanceMode: AttendanceMode;
  registrationFields: ConventionProgramRegistrationField[];
  basePrice: number;
  currency: string;
  venue: string | null;
  startsAt: string;
  endsAt: string;
  coverFile: ConventionFileAsset | null;
  isActive: boolean;
  isPublic: boolean;
}

export interface ConventionProgramRegistration {
  id: string;
  programId: string;
  memberId: string;
  churchId: string;
  attendanceMode: string;
  responses: Record<string, unknown>;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  reference: string;
  status: RegistrationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ConventionPublication {
  id: string;
  conventionId: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  author: string;
  pricingModel: PricingModel;
  price: number;
  currency: string;
  subscriptionDays: number | null;
  coverFile: ConventionFileAsset | null;
  contentFile: ConventionFileAsset | null;
  isActive: boolean;
  createdAt: string;
}

export interface ConventionPublicationAccess {
  id: string;
  publicationId: string;
  memberId: string;
  status: PublicationAccessStatus;
  amount: number;
  currency: string;
  paymentMethod: string;
  reference: string;
  activatedAt: string;
  expiresAt: string | null;
  paidAt: string | null;
  publication?: ConventionPublication;
}

export interface ConventionDocument {
  id: string;
  conventionId: string;
  title: string;
  name: string;
  description: string;
  file: ConventionFileAsset | null;
  contentFile: ConventionFileAsset | null;
  orderIndex: number;
  publishedAt: string | null;
}

export interface ConventionAnnouncement {
  id: string;
  conventionId: string;
  type: AnnouncementType;
  title: string;
  body: string;
  audienceTargets: string[];
  amount: number | null;
  currency: string | null;
  walletId: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ConventionMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ConventionProgramsResponse {
  status: boolean;
  message?: string;
  data: {
    items: ConventionProgram[];
    meta: ConventionMeta;
  };
}

export interface ConventionPublicationsResponse {
  status: boolean;
  message?: string;
  data: {
    items: ConventionPublication[];
    meta: ConventionMeta;
  };
}

export interface ConventionAnnouncementsResponse {
  status: boolean;
  message?: string;
  data: {
    items: ConventionAnnouncement[];
    meta: ConventionMeta;
  };
}

export interface ConventionDocumentsResponse {
  status: boolean;
  message?: string;
  data: {
    items: ConventionDocument[];
    meta: ConventionMeta;
  };
}

export interface ConventionProgramRegistrationsResponse {
  status: boolean;
  message?: string;
  data: {
    items: ConventionProgramRegistration[];
    meta: ConventionMeta;
  };
}

export interface ConventionPublicationAccessesResponse {
  status: boolean;
  message?: string;
  data: {
    items: ConventionPublicationAccess[];
    meta: ConventionMeta;
  };
}

export interface ConventionRegistrationPayload {
  attendanceMode: string;
  responses: Record<string, unknown>;
  totalAmount: number;
  currency: string;
  paymentMethod: 'wallet' | 'paystack';
  authKey?: string;
  callbackUrl?: string;
}

export interface ConventionPublicationPurchasePayload {
  pricingModel: PricingModel;
  amount: number;
  currency: string;
  paymentMethod: 'wallet' | 'paystack';
  authKey?: string;
  callbackUrl?: string;
}

export interface ConventionRegisterResponse {
  status: boolean;
  message?: string;
  data?: {
    checkoutUrl?: string;
    registration?: ConventionProgramRegistration;
  };
}

export interface ConventionPurchaseResponse {
  status: boolean;
  message?: string;
  data?: {
    checkoutUrl?: string;
    access?: ConventionPublicationAccess;
  };
}

export const getConventionIdFromMember = (member: { church?: { association?: Record<string, unknown> | null } | null } | null): string | null => {
  if (!member?.church?.association) return null;
  const association = member.church.association;
  const conference = association.conference as Record<string, unknown> | undefined;
  if (!conference) return null;
  const convention = conference.convention as Record<string, unknown> | undefined;
  if (!convention?.id) return null;
  return String(convention.id);
};
