export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    unitPreference: 'kg' | 'lb';
    theme: 'light' | 'dark' | 'system';
  };
  accessToken: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
}
