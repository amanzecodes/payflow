import { getTransactions } from "@/lib/api/transaction.api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const useTransactions = (orgId: string, page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: ["transactions", orgId, page, limit],
    queryFn: () => getTransactions(orgId, page, limit),
    enabled: !!orgId,
    placeholderData: keepPreviousData,
  });
};
