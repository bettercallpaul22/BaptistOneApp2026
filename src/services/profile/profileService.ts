import { endpoints } from '@/services/api/endpoints';
import { http } from '@/services/api/http';
import type {
  ProfileCompletionResponse,
  UpdateProfileCompletionSectionPayload,
  UpdateProfileCompletionSectionRequest,
} from '@/types/profile';

export const profileService = {
  getProfileCompletion: async () => {
    const response = await http.get<ProfileCompletionResponse>(endpoints.privateMembers.profileCompletion);

    if (!response.status || !response.data) {
      throw new Error(response.message || 'Unable to load profile.');
    }

    return response;
  },

  updateProfileCompletionSection: async ({ sectionKey, data }: UpdateProfileCompletionSectionPayload) => {
    const response = await http.put<ProfileCompletionResponse, UpdateProfileCompletionSectionRequest>(
      endpoints.privateMembers.profileCompletionSection(sectionKey),
      { data },
    );

    if (!response.status || !response.data) {
      throw new Error(response.message || 'Unable to update profile information.');
    }

    return response;
  },
};
