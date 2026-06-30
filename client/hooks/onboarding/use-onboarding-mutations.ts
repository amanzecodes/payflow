import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getBanksList,
  verifyBankAccount,
  createOrganisation,
  createCollection,
  createFeeLine,
  deleteFeeLine,
  addMember,
  getInviteCode,
} from "@/lib/api/onboarding.api";

export const useBanksList = () => {
  return useQuery({
    queryKey: ["banks"],
    queryFn: getBanksList,
  });
};

export const useVerifyBankAccount = () => {
  return useMutation({
    mutationFn: ({ accountNumber, bankCode }: { accountNumber: string; bankCode: string }) =>
      verifyBankAccount(accountNumber, bankCode),
  });
};

export const useCreateOrganisation = () => {
  return useMutation({
    mutationFn: createOrganisation,
  });
};

export const useCreateCollection = () => {
  return useMutation({
    mutationFn: ({ orgId, payload }: { orgId: string; payload: any }) =>
      createCollection(orgId, payload),
  });
};

export const useCreateFeeLine = () => {
  return useMutation({
    mutationFn: createFeeLine,
  });
};

export const useDeleteFeeLine = () => {
  return useMutation({
    mutationFn: deleteFeeLine,
  });
};

export const useAddMember = () => {
  return useMutation({
    mutationFn: ({ orgId, payload }: { orgId: string; payload: any }) =>
      addMember(orgId, payload),
  });
};

export const useGetInviteCode = (orgId?: string) => {
  return useQuery({
    queryKey: ["inviteCode", orgId],
    queryFn: () => getInviteCode(orgId!),
    enabled: !!orgId,
  });
};
