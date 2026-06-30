import { useMutation } from "@tanstack/react-query";
import { loginRequest } from "@/lib/api/auth.api";
import type { LoginPayload } from "@/types/auth.types";

export const useLogin = () => {
  return useMutation({
    mutationFn: (payload: LoginPayload) => loginRequest(payload),
  });
};
