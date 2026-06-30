import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { loginRequest } from "@/lib/api/auth.api";
import type { LoginPayload, AuthResponse } from "@/types/auth.types";
import { useOnboardingStore } from "@/lib/store/onboarding.store";

export const useLogin = (options?: UseMutationOptions<AuthResponse, Error, LoginPayload>) => {
  const setOrgId = useOnboardingStore((state) => state.setOrgId);
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {};

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginRequest(payload),
    onSuccess: (data, variables, onMutateResult, context) => {
      // Set the first organization as the global orgId (persisted via Zustand + localStorage)
      if (data.data?.organisations?.[0]) {
        const orgId = data.data.organisations[0].id;
        setOrgId(orgId);
      }
      // Call the custom onSuccess if provided
      customOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      customOnError?.(error, variables, onMutateResult, context);
    },
    ...restOptions,
  });
};
