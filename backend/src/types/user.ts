export interface IUser {
  id: string;
  email: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  authProvider: string;
  authProviderId?: string | null;
  language: string;
  theme: string;
  emailVerifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date | null;
}

export interface IUserCreate {
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  password?: string;
  authProvider?: string;
  authProviderId?: string;
  avatarUrl?: string;
  language?: string;
  theme?: string;
  emailVerifiedAt?: Date | null;
  verificationToken?: string | null;
  verificationSentAt?: Date | null;
}

export interface IUserUpdate {
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  avatarUrl?: string;
  language?: string;
  theme?: string;
}
