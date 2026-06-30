import { useMutation } from "@tanstack/react-query";
import { registerRequest } from "@/lib/api/auth.api";
import type { RegisterPayload } from "@/types/auth.types";

export const useRegister = () => {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerRequest(payload),
  });
};
