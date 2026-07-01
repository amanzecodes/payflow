import { getPayoutPageData } from "@/lib/api/payout.api"
import { useQuery } from "@tanstack/react-query"

export const usePayoutPage = (orgId: string) => {
  return useQuery({
    queryKey: ["payout_page", orgId],
    queryFn: () => getPayoutPageData(orgId),
    enabled: !!orgId
  })
}
