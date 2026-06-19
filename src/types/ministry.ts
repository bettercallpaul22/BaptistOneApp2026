export interface MyMinistry {
  membershipId: string;
  role: string;
  joinedAt: string;
  ministryId: string;
  churchId: string;
  name: string;
  slug: string;
}

export interface ChurchMinistryMembership {
  id: string;
  role: string;
  joinedAt: string;
}

export interface ChurchMinistryPendingRequest {
  id: string;
}

export interface ChurchMinistry {
  ministryId: string;
  churchId: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  joined: boolean;
  membership: ChurchMinistryMembership | null;
  hasPendingRequest: boolean;
  pendingRequest: ChurchMinistryPendingRequest | null;
}

export interface MyMinistryResponse {
  status: boolean;
  message?: string;
  data: MyMinistry[];
}

export interface ChurchMinistriesResponse {
  status: boolean;
  message?: string;
  data: ChurchMinistry[];
}
