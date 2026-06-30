import { apiClient } from "@/lib/api/client";
import type {
  Bank,
  Organisation,
  Collection,
  FeeLine,
  Member,
} from "@/types/onboarding.types";

export const getBanksList = async (): Promise<Bank[]> => {
  const { data } = await apiClient.get<{ success: boolean; data: Bank[] }>(
    "/banks/list"
  );
  return data.data;
};

export const verifyBankAccount = async (
  accountNumber: string,
  bankCode: string
): Promise<{ accountName: string }> => {
  const { data } = await apiClient.post<{
    success: boolean;
    data: { accountName: string };
  }>("/banks/verify", { accountNumber, bankCode });
  return data.data;
};

export const createOrganisation = async (payload: {
  name: string;
  type: string;
  adminWhatsapp: string;
  payoutBankAccount: string;
  payoutBankCode: string;
  payoutAccountName: string;
  payoutBankName: string;
  structure: string;
}): Promise<Organisation> => {
  const { data } = await apiClient.post<{ success: boolean; data: Organisation }>(
    "/organisations",
    payload
  );
  return data.data;
};

export const createCollection = async (
  orgId: string,
  payload: {
    name: string;
    cycle: string;
    amount?: number;
  }
): Promise<Collection> => {
  const { data } = await apiClient.post<{ success: boolean; data: Collection }>(
    `/organisations/${orgId}/collections`,
    payload
  );
  return data.data;
};

export const createFeeLine = async (payload: {
  collectionId: string;
  name: string;
  amount: number;
}): Promise<FeeLine> => {
  const { data } = await apiClient.post<{ success: boolean; data: FeeLine }>(
    "/fee-lines",
    payload
  );
  return data.data;
};

export const deleteFeeLine = async (feeLineId: string): Promise<void> => {
  await apiClient.delete(`/fee-lines/${feeLineId}`);
};

export const addMember = async (
  orgId: string,
  payload: {
    name: string;
    identifier: string;
    expectedAmount: number;
  }
): Promise<Member> => {
  const { data } = await apiClient.post<{ success: boolean; data: Member }>(
    `/organisations/${orgId}/members`,
    payload
  );
  return data.data;
};

export const getInviteCode = async (
  orgId: string
): Promise<{ inviteCode: string }> => {
  const { data } = await apiClient.get<{
    success: boolean;
    data: { inviteCode: string };
  }>(`/organisations/${orgId}/invite-code`);
  return data.data;
};

export const getDashboardOverview = async (orgId: string) => {
  const { data } = await apiClient.get(`/dashboard/${orgId}/overview`);
  return data.data;
};
