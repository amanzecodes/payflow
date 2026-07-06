import { useMutation } from "@tanstack/react-query";
import { addMember } from "@/lib/api/onboarding.api";

export const useAddMember = () => {
  return useMutation({
    mutationFn: ({
      orgId,
      payload,
    }: {
      orgId: string;
      payload: { name: string; identifier: string; phone: string; expectedAmount: number };
    }) => addMember(orgId, payload),
  });
};
