import { AxiosError } from "axios";

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    return data?.error ?? data?.message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};
