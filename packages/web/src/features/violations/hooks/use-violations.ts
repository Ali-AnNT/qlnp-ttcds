import { leaveTypesApi } from "@/features/config";
import { departmentsApi } from "@/features/layout";
import { leaveBalancesApi, leaveRequestsApi } from "@/features/leave-requests";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  DepartmentViolation,
  Period,
  UserAggregate,
  ViolationByType,
} from "../api/types";

export function useViolations(
  year: number,
  period: Period,
  month: number,
  quarter: number,
) {
  const lrQuery = useQuery({
    queryKey: ["leave-requests", "all"],
    queryFn: async () => {
      const res = await leaveRequestsApi.list({ pageSize: 10000 });
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

  const ltQuery = useQuery({
    queryKey: ["leave-types"],
    queryFn: async () => {
      const res = await leaveTypesApi.list();
      return (res.data ?? []).filter((t) => t.isActive);
    },
  });

  const lbQuery = useQuery({
    queryKey: ["leave-balances", "all", year],
    queryFn: async () => {
      const res = await leaveBalancesApi.list(year);
      return res.data ?? [];
    },
  });

  const isLoading =
    lrQuery.isLoading ||
    deptQuery.isLoading ||
    ltQuery.isLoading ||
    lbQuery.isLoading;

  const leaveRequests = lrQuery.data ?? [];
  const departments = deptQuery.data ?? [];
  const leaveTypes = ltQuery.data ?? [];
  const leaveBalances = lbQuery.data ?? [];

  const years = useMemo(() => {
    const set = new Set<number>([new Date().getFullYear()]);
    leaveRequests.forEach((r) => set.add(new Date(r.startDate).getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [leaveRequests]);

  const getUserLimit = (userId: number) => {
    const balances = leaveBalances.filter(
      (b) => b.userId === userId && b.year === year,
    );
    if (balances.length > 0) {
      return balances.reduce((sum, b) => sum + Number(b.totalDays), 0);
    }
    const fallback = leaveTypes.reduce(
      (sum, t) => sum + Number(t.defaultDays || 0),
      0,
    );
    return fallback > 0 ? fallback : 12;
  };

  const filteredApproved = useMemo(() => {
    return leaveRequests.filter((r) => {
      if (r.status !== "approved") return false;
      const d = new Date(r.startDate);
      if (d.getFullYear() !== year) return false;
      if (period === "month" && d.getMonth() + 1 !== month) return false;
      if (period === "quarter") {
        const q = Math.floor(d.getMonth() / 3) + 1;
        if (q !== quarter) return false;
      }
      return true;
    });
  }, [leaveRequests, year, period, month, quarter]);

  const userAggregates = useMemo(() => {
    const map = new Map<number, UserAggregate>();
    filteredApproved.forEach((r) => {
      const existing = map.get(r.userId);
      if (existing) {
        existing.totalUsed += Number(r.totalDays);
        existing.requests.push(r);
        const ltName =
          leaveTypes.find((t) => t.id === r.leaveTypeId)?.name || "Khác";
        existing.byType[ltName] =
          (existing.byType[ltName] || 0) + Number(r.totalDays);
      } else {
        const ltName =
          leaveTypes.find((t) => t.id === r.leaveTypeId)?.name || "Khác";
        map.set(r.userId, {
          userId: r.userId,
          userName: r.userName || "",
          donViId: r.donViId || 0,
          totalUsed: Number(r.totalDays),
          requests: [r],
          byType: { [ltName]: Number(r.totalDays) },
        });
      }
    });
    return Array.from(map.values());
  }, [filteredApproved, leaveTypes]);

  const employeeViolations = useMemo(() => {
    return userAggregates
      .map((u) => {
        const limit = getUserLimit(u.userId);
        const overage = u.totalUsed - limit;
        const dept = departments.find((d) => d.donViId === u.donViId);
        return { ...u, dept, limit, overage };
      })
      .filter((v) => v.overage > 0);
  }, [userAggregates, departments, leaveBalances, leaveTypes, year]);

  const departmentViolations = useMemo(() => {
    return departments
      .map((d) => {
        const deptUsers = userAggregates.filter((u) => u.donViId === d.donViId);
        const totalUsed = deptUsers.reduce((s, u) => s + u.totalUsed, 0);
        const allowed = deptUsers.reduce(
          (s, u) => s + getUserLimit(u.userId),
          0,
        );
        const overage = totalUsed - allowed;

        const violatingEmps = employeeViolations.filter(
          (v) => v.dept?.donViId === d.donViId,
        );
        const totalEmpOverage = violatingEmps.reduce(
          (s, v) => s + v.overage,
          0,
        );

        const byType: Record<string, number> = {};
        deptUsers.forEach((u) => {
          Object.entries(u.byType).forEach(([k, val]) => {
            byType[k] = (byType[k] || 0) + val;
          });
        });

        return {
          dept: d,
          totalUsed,
          allowed,
          overage,
          empCount: deptUsers.length,
          violatingCount: violatingEmps.length,
          totalEmpOverage,
          byType,
        } as DepartmentViolation;
      })
      .filter((d) => d.violatingCount > 0 || d.overage > 0);
  }, [
    departments,
    userAggregates,
    employeeViolations,
    leaveBalances,
    leaveTypes,
    year,
  ]);

  const violationByType = useMemo(() => {
    const map: Record<string, number> = {};
    employeeViolations.forEach((v) => {
      Object.entries(v.byType).forEach(([k, val]) => {
        map[k] = (map[k] || 0) + val;
      });
    });
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
    })) as ViolationByType[];
  }, [employeeViolations]);

  const totalSystemOverage = useMemo(
    () => employeeViolations.reduce((s, v) => s + v.overage, 0),
    [employeeViolations],
  );

  return {
    years,
    employeeViolations,
    departmentViolations,
    violationByType,
    totalSystemOverage,
    isLoading,
    leaveTypes,
  };
}
