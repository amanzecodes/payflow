import { getBillsHistory, vendAirtime } from "@/lib/api/bills.api"
import { VendAirtimePayload } from "@/types/bills.types"
import { useMutation, useQuery } from "@tanstack/react-query"

export const useVendAirtime = (orgId: string) => {
  return useMutation({
    mutationFn: (payload: VendAirtimePayload) => vendAirtime(orgId, payload),
  })
}

export const useBillsHistory = (orgId: string) => {
  return useQuery({
    queryKey: ["bills_history", orgId],
    queryFn: () => getBillsHistory(orgId),
    enabled: !!orgId,
  })
}
