import { useQuery } from "@tanstack/react-query";
import {
  leaveBalancesApi,
  leaveTypesApi,
  configApi,
  type LeaveBalanceDto,
  type LeaveTypeDto,
  type ConfigDto,
} from "../api/dashboard.api";
import { useAuth } from "@/features/auth";
import { AppRoles } from "@/features/shared-reference-data";

/** Dashboard stats for the current user.
 *  leaveBalances is scoped to the authenticated user only (via /my endpoint). */
export function useDashboardStats() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  const balancesQuery = useQuery({
    queryKey: ["leave-balances", "my", currentYear],
    queryFn: async () => {
      const res = await leaveBalancesApi.my(currentYear);
      return res.data ?? [];
    },
  });

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

  const leaveBalances: LeaveBalanceDto[] = balancesQuery.data ?? [];
  const leaveTypes: LeaveTypeDto[] = typesQuery.data ?? [];
  const approvalConfigs: ConfigDto[] = configsQuery.data ?? [];

  // Current user's balances for this year
  const myBalances = leaveBalances.filter(
    (b) => b.userId === user?.userId && b.year === currentYear,
  );

  // Max approval level per leave type (for status labels)
  const maxLevelByType = new Map<number, number>();
  for (const c of approvalConfigs) {
    const current = maxLevelByType.get(c.leaveTypeId) ?? 0;
    if (c.approvalLevel > current) maxLevelByType.set(c.leaveTypeId, c.approvalLevel);
  }

  const remainingDays = myBalances[0]?.remainingDays ?? 0;
  const totalDaysAllowed = myBalances[0]?.totalDays ?? 0;

  const loading = balancesQuery.isLoading || typesQuery.isLoading || configsQuery.isLoading;

  return {
    leaveBalances,
    myBalances,
    leaveTypes,
    approvalConfigs,
    maxLevelByType,
    remainingDays,
    totalDaysAllowed,
    loading,
  };
}