import { AxiosError } from "axios";

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};
