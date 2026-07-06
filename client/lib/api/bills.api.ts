import { BillHistoryItem, VendAirtimeData, VendAirtimePayload } from "@/types/bills.types"
import { apiClient } from "./client"

export const vendAirtime = async (orgId: string, payload: VendAirtimePayload): Promise<VendAirtimeData> => {
  const response = await apiClient.post<{ data: VendAirtimeData }>(
    `/organisations/${orgId}/bills/airtime`,
    payload
  )
  return response.data.data
}

export const getBillsHistory = async (orgId: string): Promise<BillHistoryItem[]> => {
  const response = await apiClient.get<{ data: BillHistoryItem[] }>(
    `/organisations/${orgId}/bills/history`
  )
  return response.data.data
}
