import { endpoints } from '@/services/api/endpoints';
import { http } from '@/services/api/http';
import type { FileUploadRequest, FileUploadResponse } from '@/types/fileUpload';

export const fileUploadService = {
  uploadFile: async ({ module, file, isPublic }: FileUploadRequest) => {
    const formData = new FormData();
    formData.append('module', module);
    formData.append('isPublic', String(isPublic));
    formData.append('file', file);

    const response = await http.post<FileUploadResponse, FormData>(endpoints.files.upload, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.status || !response.data?.id) {
      throw new Error(response.message || 'Unable to upload file.');
    }

    return response;
  },
};
