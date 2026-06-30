import { getDashboardData } from "@/lib/api/dashboard-api"
import { useQuery } from "@tanstack/react-query"

export const useDashboardData = (orgId: string) => {
    return useQuery({
        queryKey: ["dashboard_data", orgId],
        queryFn: () => getDashboardData(orgId),
        enabled: !!orgId
    })
}