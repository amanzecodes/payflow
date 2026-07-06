import type { Organisation } from "@/types/onboarding.types";
import { apiClient } from "./client";

export const getOrganisation = async (orgId: string): Promise<Organisation> => {
  const { data } = await apiClient.get<{ success: boolean; data: Organisation }>(
    `/organisations/${orgId}`
  );
  return data.data;
};
