import { apiClient } from "@/lib/api/client";
import type { AuthResponse, LoginPayload, RegisterPayload } from "@/types/auth.types";

export const loginRequest = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
  return data;
};

export const registerRequest = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", payload);
  return data;
};

export const logoutRequest = async (): Promise<void> => {
  await apiClient.post("/auth/logout");
};

export const fetchCurrentAdmin = async (): Promise<AuthResponse> => {
  const { data } = await apiClient.get<AuthResponse>("/auth/me");
  return data;
};
