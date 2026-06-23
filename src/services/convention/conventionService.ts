import { endpoints } from '@/services/api/endpoints';
import { http } from '@/services/api/http';
import type {
  ConventionAnnouncementsResponse,
  ConventionDocumentsResponse,
  ConventionProgramRegistrationsResponse,
  ConventionProgramsResponse,
  ConventionPublicationAccessesResponse,
  ConventionPublicationsResponse,
  ConventionRegistrationPayload,
  ConventionRegisterResponse,
  ConventionPublicationPurchasePayload,
  ConventionPurchaseResponse,
} from '@/types/convention';

export const conventionService = {
  getPrograms: async (conventionId: string, params: { page?: number; limit?: number; search?: string } = {}) => {
    const response = await http.get<ConventionProgramsResponse>(
      endpoints.publicConventions.programs(conventionId, params),
    );
    if (!response.status) {
      throw new Error(response.message || 'Unable to load programs.');
    }
    return response;
  },

  getPublications: async (conventionId: string, params: { page?: number; limit?: number; search?: string } = {}) => {
    const response = await http.get<ConventionPublicationsResponse>(
      endpoints.publicConventions.publications(conventionId, params),
    );
    if (!response.status) {
      throw new Error(response.message || 'Unable to load publications.');
    }
    return response;
  },

  getAnnouncements: async (conventionId: string, params: { page?: number; limit?: number; search?: string } = {}) => {
    const response = await http.get<ConventionAnnouncementsResponse>(
      endpoints.publicConventions.announcements(conventionId, params),
    );
    if (!response.status) {
      throw new Error(response.message || 'Unable to load announcements.');
    }
    return response;
  },

  getDocuments: async (conventionId: string, params: { page?: number; limit?: number; search?: string } = {}) => {
    const response = await http.get<ConventionDocumentsResponse>(
      endpoints.privateConventions.documents(conventionId, params),
    );
    if (!response.status) {
      throw new Error(response.message || 'Unable to load documents.');
    }
    return response;
  },

  registerForProgram: async (conventionId: string, programId: string, payload: ConventionRegistrationPayload) => {
    const response = await http.post<ConventionRegisterResponse>(
      endpoints.privateConventions.registerProgram(conventionId, programId),
      payload,
    );
    if (!response.status) {
      throw new Error(response.message || 'Unable to register for program.');
    }
    return response;
  },

  getProgramRegistrations: async (conventionId: string) => {
    const response = await http.get<ConventionProgramRegistrationsResponse>(
      endpoints.privateConventions.registrations(conventionId),
    );
    if (!response.status) {
      throw new Error(response.message || 'Unable to load registrations.');
    }
    return response;
  },

  purchasePublication: async (conventionId: string, publicationId: string, payload: ConventionPublicationPurchasePayload) => {
    const response = await http.post<ConventionPurchaseResponse>(
      endpoints.privateConventions.purchasePublication(conventionId, publicationId),
      payload,
    );
    if (!response.status) {
      throw new Error(response.message || 'Unable to purchase publication.');
    }
    return response;
  },

  getPublicationAccesses: async (conventionId: string) => {
    const response = await http.get<ConventionPublicationAccessesResponse>(
      endpoints.privateConventions.publicationAccesses(conventionId),
    );
    if (!response.status) {
      throw new Error(response.message || 'Unable to load publication accesses.');
    }
    return response;
  },
};
