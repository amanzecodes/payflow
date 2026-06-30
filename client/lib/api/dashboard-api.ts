import { DashboardOverviewResponse } from "@/types/dashboard.type"
import { apiClient } from "./client"

export const getDashboardData = async (orgId: string): Promise<DashboardOverviewResponse> => {
    const response = await apiClient.get<DashboardOverviewResponse>(`dashboard/${orgId}/overview`)
    return response.data
}