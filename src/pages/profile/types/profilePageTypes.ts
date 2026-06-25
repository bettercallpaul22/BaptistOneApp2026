import type { FileUploadModule } from '@/types/fileUpload';

export type ProfileTab = 'profile' | 'church';
export type ProfileLocationState = { profileTab?: ProfileTab } | null;

export type ProfileFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'date'
  | 'number'
  | 'boolean'
  | 'list'
  | 'textarea'
  | 'select'
  | 'multi-select'
  | 'radio'
  | 'search-select'
  | 'file'
  | 'file-list'
  | 'children-list'
  | 'dependants-list'
  | 'family-children-list';

export interface ProfileFieldSchema {
  name: string;
  label?: string;
  type?: ProfileFieldType;
  disabled?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  searchable?: boolean;
  uploadModule?: FileUploadModule;
  isPublic?: boolean;
  accept?: string;
}

export interface ChildFormValue {
  name: string;
  gender: string;
  dob: string;
  age: string;
  school: string;
}

export interface DependantFormValue {
  name: string;
  relationship: string;
  phone: string;
  age: string;
  isLivingWithUser: boolean;
}

export type EditableFieldValue =
  | string
  | boolean
  | string[]
  | ChildFormValue[]
  | DependantFormValue[]
  | { children: ChildFormValue[] };
