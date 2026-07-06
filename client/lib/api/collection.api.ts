import type { Collection } from "@/types/onboarding.types";
import { apiClient } from "./client";

export const getCollections = async (orgId: string): Promise<Collection[]> => {
  const { data } = await apiClient.get<{ success: boolean; data: Collection[] }>(
    `/organisations/${orgId}/collections`
  );
  return data.data;
};
