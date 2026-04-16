export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  unitPreference: 'kg' | 'lb';
  theme: 'light' | 'dark' | 'system';
  createdAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  unitPreference?: 'kg' | 'lb';
  theme?: 'light' | 'dark' | 'system';
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
