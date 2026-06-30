import { Member } from "@/components/members/types";
import { apiClient } from "./client";

export type MemberWithChargeStatus = Member & {
  currentChargeStatus: "PENDING" | "PAID" | "OVERDUE" | null;
  lastPaidAt: string | null;
};

export const getMembers = async (orgId: string): Promise<MemberWithChargeStatus[]> => {
  const response = await apiClient.get<{ data: MemberWithChargeStatus[] }>(
    `/organisations/${orgId}/members`
  );
  return response.data.data;
};

export const getMemberDetails = async (
  orgId: string,
  memberId: string
): Promise<Member> => {
  const response = await apiClient.get<{ data: Member }>(
    `/organisations/${orgId}/members/${memberId}`
  );
  return response.data.data;
};
