export interface Admin {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  type: 'ESTATE' | 'COOPERATIVE' | 'GYM' | 'SCHOOL' | 'CLINIC' | 'OTHER';
  structure: 'FLAT' | 'VARIABLE';
  inviteCode: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  phone: string;
  password: string;
  remember?: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    admin: Admin;
    organisations: Organisation[];
  };
}
