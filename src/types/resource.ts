export type ResourceFormat = 'hardcopy' | 'softcopy' | 'both';
export type ResourceFulfilmentType = 'SOFT' | 'HARD';

export const formatToFulfilmentType: Record<ResourceFormat, ResourceFulfilmentType> = {
  softcopy: 'SOFT',
  hardcopy: 'HARD',
  both: 'SOFT',
};

export const fulfilmentTypeToFormat: Record<ResourceFulfilmentType, ResourceFormat> = {
  SOFT: 'softcopy',
  HARD: 'hardcopy',
};

export interface ResourceFile {
  id: string;
  createdAt: string;
  updatedAt: string;
  key: string;
  contentType: string;
  size: number;
  checksum: string | null;
  altText: string | null;
  url: string;
  bucketName: string;
  region: string | null;
  versionId: string | null;
  metadata: string | null;
  tags: string | null;
  uploadedById: string | null;
  uploadedAt: string;
}

export interface Resource {
  id: string;
  createdAt: string;
  updatedAt: string;
  churchId: string;
  type: string;
  title: string;
  slug: string;
  author: string;
  description: string;
  price: number;
  currency: string;
  coverFileId: string;
  softCopyFileId: string | null;
  softCopyAvailable: boolean;
  hardCopyAvailable: boolean;
  stockQty: number;
  soldQty: number;
  isActive: boolean;
  createdByProfileId: string | null;
  updatedByProfileId: string | null;
  coverFile: ResourceFile | null;
  softCopyFile: ResourceFile | null;
}

export interface ResourceMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ResourcesResponse {
  status: boolean;
  data: {
    items: Resource[];
    meta: ResourceMeta;
  };
}

export interface CartItem {
  cartId: string;
  quantity: number;
  fulfilmentType: ResourceFulfilmentType;
  itemId: string;
  title: string;
  author: string;
  price: number;
  currency: string;
  churchId: string;
  softCopyFileId: string | null;
}

export interface CartItemsResponse {
  status: boolean;
  data: {
    items: CartItem[];
    meta: ResourceMeta;
  };
}

export const getResourceFormats = (resource: Resource): ResourceFormat[] => {
  if (resource.softCopyAvailable && resource.hardCopyAvailable) return ['softcopy', 'hardcopy'];
  if (resource.softCopyAvailable) return ['softcopy'];
  if (resource.hardCopyAvailable) return ['hardcopy'];
  return [];
};

export const getResourceCoverUrl = (resource: Resource): string | null => {
  const src = resource.coverFile?.url;
  if (!src) return null;
  return src.startsWith('http://') ? src.replace(/^http:\/\//, 'https://') : src;
};
