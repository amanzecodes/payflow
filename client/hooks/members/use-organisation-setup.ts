import { useQuery } from "@tanstack/react-query";
import { getOrganisation } from "@/lib/api/organisation.api";
import { getCollections } from "@/lib/api/collection.api";

export const useOrganisation = (orgId?: string) => {
  return useQuery({
    queryKey: ["organisation", orgId],
    queryFn: () => getOrganisation(orgId!),
    enabled: !!orgId,
  });
};

export const useCollections = (orgId?: string) => {
  return useQuery({
    queryKey: ["collections", orgId],
    queryFn: () => getCollections(orgId!),
    enabled: !!orgId,
  });
};
