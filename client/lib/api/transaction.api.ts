import type { TransactionsPageData } from "@/types/transaction.types";
import { apiClient } from "./client";

export const getTransactions = async (
  orgId: string,
  page: number = 1,
  limit: number = 20
): Promise<TransactionsPageData> => {
  const response = await apiClient.get<{ success: boolean; data: TransactionsPageData }>(
    `/dashboard/${orgId}/transactions`,
    { params: { page, limit } }
  );
  return response.data.data;
};
