import { Payout, PayoutPageData } from "@/types/payout.types"
import { apiClient } from "./client"

export const getPayoutPageData = async (orgId: string): Promise<PayoutPageData> => {
  const response = await apiClient.get<{ data: PayoutPageData }>(
    `/organisations/${orgId}/payouts/payout-page`
  )
  return response.data.data
}

export const requestPayout = async (orgId: string, amount: number): Promise<Payout> => {
  const response = await apiClient.post<{ data: Payout }>(
    `/organisations/${orgId}/payouts`,
    { amount }
  )
  return response.data.data
}
