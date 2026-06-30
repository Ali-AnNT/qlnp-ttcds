import { useQuery } from "@tanstack/react-query";
import {
  leaveTypesApi,
  configApi,
  type LeaveTypeDto,
  type ConfigDto,
} from "../api/dashboard.api";

/** Dashboard reference data: leave types + approval configs (used by the activity feed). */
export function useDashboardStats() {
  const typesQuery = useQuery({
    queryKey: ["leave-types"],
    queryFn: async () => {
      const res = await leaveTypesApi.list();
      return (res.data ?? []).filter((t) => t.isActive);
    },
  });

  const configsQuery = useQuery({
    queryKey: ["approval-configs"],
    queryFn: async () => {
      const res = await configApi.get();
      return res.data ?? [];
    },
  });

  const leaveTypes: LeaveTypeDto[] = typesQuery.data ?? [];
  const approvalConfigs: ConfigDto[] = configsQuery.data ?? [];

  // Max approval level per leave type (for status labels)
  const maxLevelByType = new Map<number, number>();
  for (const c of approvalConfigs) {
    const current = maxLevelByType.get(c.leaveTypeId) ?? 0;
    if (c.approvalLevel > current) maxLevelByType.set(c.leaveTypeId, c.approvalLevel);
  }

  const loading = typesQuery.isLoading || configsQuery.isLoading;

  return {
    leaveTypes,
    maxLevelByType,
    loading,
  };
}
