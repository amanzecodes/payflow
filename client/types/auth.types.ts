export interface Admin {
  id: string;
  name: string;
  email: string;
  phone: string;
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
  };
}
