export interface ProfileSectionStatus {
  completed: boolean;
  completedAt: string | null;
}

export type ProfileSectionMap = Record<string, ProfileSectionStatus>;

export interface ProfileFileAsset {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  key?: string;
  contentType: string;
  size?: number;
  checksum?: string | null;
  altText?: string | null;
  url: string;
  bucketName?: string;
  region?: string | null;
  versionId?: string | null;
  metadata?: Record<string, ProfileSectionValue> | null;
  tags?: Record<string, ProfileSectionValue> | null;
  uploadedById?: string | null;
  uploadedAt?: string;
  [key: string]: ProfileSectionValue;
}

export type ProfileSectionValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ProfileFileAsset
  | ProfileSectionValue[]
  | { [key: string]: ProfileSectionValue };

export type ProfileInformationSection = Record<string, ProfileSectionValue>;

export interface ProfileReward {
  id: string;
  createdAt: string;
  updatedAt: string;
  profileCompletionId: string;
  sectionKey: string;
  points: number;
  currency: string;
  reason: string;
  metadata: Record<string, ProfileSectionValue>;
}

export interface ProfileCompletion {
  id: string;
  createdAt: string;
  updatedAt: string;
  profileId: string;
  memberId: string | null;
  status: string;
  completionScore: number;
  rewardBalance: number;
  sections: ProfileSectionMap;
  churchInformation: ProfileInformationSection;
  personalInformation: ProfileInformationSection;
  contactInformation: ProfileInformationSection;
  identityInformation: ProfileInformationSection;
  membershipInformation: ProfileInformationSection;
  salvationInformation: ProfileInformationSection;
  baptismInformation: ProfileInformationSection;
  educationInformation: ProfileInformationSection;
  employmentInformation: ProfileInformationSection;
  ministryInformation: ProfileInformationSection;
  familyInformation: ProfileInformationSection;
  spouseInformation: ProfileInformationSection;
  childrenInformation: ProfileInformationSection | ProfileInformationSection[];
  dependants: ProfileInformationSection | ProfileInformationSection[];
  emergencyContact: ProfileInformationSection;
  churchInterests: ProfileInformationSection | ProfileSectionValue[];
  givingPreferences: ProfileInformationSection;
  documents: ProfileInformationSection | ProfileSectionValue[];
  verification: ProfileInformationSection;
  submittedAt: string | null;
  completedAt: string | null;
  rewards: ProfileReward[];
  currency: string;
  requiredScore: number;
  canConnectToChurch: boolean;
}

export interface ProfileCompletionResponse {
  status: boolean;
  data: ProfileCompletion;
  message?: string;
}

export interface UpdateProfileCompletionSectionPayload {
  sectionKey: string;
  data: ProfileInformationSection;
}

export interface UpdateProfileCompletionSectionRequest {
  data: ProfileInformationSection;
}

export interface StoredProfileCompletion {
  data: ProfileCompletion;
  lastFetchedAt: string;
}
