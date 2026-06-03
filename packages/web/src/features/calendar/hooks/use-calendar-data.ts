import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  leaveRequestsApi,
  departmentsApi,
  configApi,
} from "../api/calendar.api";
import { useAuth } from "@/features/auth";
import { AppRoles } from "@/features/shared-reference-data";
import type { ConfigDto } from "../api/calendar.api";

/** Maps a leave type to its max approval level (for status label display). */
function buildMaxLevelByType(configs: ConfigDto[]) {
  const map = new Map<number, number>();
  for (const c of configs) {
    const current = map.get(c.leaveTypeId) ?? 0;
    if (c.approvalLevel > current) map.set(c.leaveTypeId, c.approvalLevel);
  }
  return map;
}

/** Combined calendar data: leave requests, departments, approval configs. */
export function useCalendarData() {
  const { user } = useAuth();

  const lrQuery = useQuery({
    queryKey: ["leave-requests"],
    queryFn: async () => {
      const res = await leaveRequestsApi.list();
      return res.data ?? [];
    },
  });

  const deptQuery = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await departmentsApi.list();
      return res.data ?? [];
    },
  });

  const cfgQuery = useQuery({
    queryKey: ["approval-configs"],
    queryFn: async () => {
      const res = await configApi.get();
      return res.data ?? [];
    },
  });

  const leaveRequests = lrQuery.data ?? [];
  const departments = deptQuery.data ?? [];
  const approvalConfigs = cfgQuery.data || [];

  const maxLevelByType = useMemo(
    () => buildMaxLevelByType(approvalConfigs),
    [approvalConfigs],
  );

  const isStaff = user?.role === AppRoles.Staff;

  // Active (non-cancelled, non-rejected) requests, filtered by role
  const activeRequests = leaveRequests.filter((r) => {
    if (r.status === "cancelled" || r.status === "rejected") return false;
    if (isStaff) return r.status === "approved";
    return true;
  });

  const loading =
    lrQuery.isLoading || deptQuery.isLoading || cfgQuery.isLoading;

  return {
    leaveRequests,
    departments,
    approvalConfigs,
    maxLevelByType,
    activeRequests,
    isStaff,
    loading,
  };
}
