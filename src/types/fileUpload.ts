export type FileUploadModule =
  | 'baptistone_member'
  | 'baptistone_kyc'
  | 'baptistone_church_document'
  | 'baptistone_church_leadership';

export interface FileUploadRequest {
  module: FileUploadModule;
  file: File;
  isPublic: boolean;
}

export interface UploadedFile {
  id: string;
  url: string;
  key: string;
}

export interface FileUploadResponse {
  status: boolean;
  message?: string;
  data: UploadedFile;
}
