import { getMembers, getMemberDetails } from "@/lib/api/member.api";
import { useQuery } from "@tanstack/react-query";

export const useMembers = (orgId: string) => {
  return useQuery({
    queryKey: ["members", orgId],
    queryFn: () => getMembers(orgId),
    enabled: !!orgId,
  });
};

export const useMemberDetails = (orgId: string, memberId: string) => {
  return useQuery({
    queryKey: ["member_details", orgId, memberId],
    queryFn: () => getMemberDetails(orgId, memberId),
    enabled: !!orgId && !!memberId,
  });
};
