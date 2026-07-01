import { PayoutPageData } from "@/types/payout.types"
import { apiClient } from "./client"

export const getPayoutPageData = async (orgId: string): Promise<PayoutPageData> => {
  const response = await apiClient.get<{ data: PayoutPageData }>(
    `/organisations/${orgId}/members/payout-page`
  )
  return response.data.data
}
