export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  otherName: string | null;
  email: string;
  country: string;
  countryCode: string;
  fcmToken: string | null;
}

export interface UserAccess {
  id: string;
  role: string;
  createdAt: string;
  status: string;
  resourceId: string;
  resourceType: string;
  resourceName: string;
  userId: string;
  updatedAt: string;
}

export interface AuthProfile {
  id: string;
  createdAt: string;
  updatedAt: string;
  type: string;
  appName: string;
  displayName: string;
  username: string;
  status: string;
  email: string;
  emailVerified: boolean;
  country: string;
  countryCode: string;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  avatarFileId: string | null;
  coverImageFileId: string | null;
  bio: string | null;
  metadata: Record<string, unknown>;
  userId: string;
}

export interface AuthAccess {
  token: string;
  refresh: string | null;
  expires: string;
  expiresTimestamp: number;
}

export interface AuthData {
  user: AuthUser;
  userAccess: UserAccess[];
  currentAccess: UserAccess;
  profile: AuthProfile;
  access: AuthAccess;
  accountStage: string;
}

export interface AuthApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface IntentLoginPayload {
  intent: string;
}

export interface HandoffLoginPayload {
  code: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  countryCode: string;
  password: string;
  redirectUrl:string;
}

export interface RegistrationResult {
  email: string;
  message: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResult {
  email: string;
  message: string;
}

export interface SetPasswordPayload {
  email: string;
  password: string;
  token: string;
}

export interface SetPasswordResult {
  email: string;
  message: string;
}

export interface SwitchAccessPayload {
  accessId: string;
}
