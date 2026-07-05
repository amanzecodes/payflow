import { getPayoutPageData, requestPayout } from "@/lib/api/payout.api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const usePayoutPage = (orgId: string) => {
  return useQuery({
    queryKey: ["payout_page", orgId],
    queryFn: () => getPayoutPageData(orgId),
    enabled: !!orgId
  })
}

export const useRequestPayout = (orgId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (amount: number) => requestPayout(orgId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payout_page", orgId] })
    },
  })
}
