import { useQuery } from "@tanstack/react-query";
import {
  leaveRequestsApi,
  departmentsApi,
  leaveTypesApi,
} from "../api/reports.api";

/** Combined reports data: all leave requests, departments, leave types. */
export function useReportsData() {
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

  const ltQuery = useQuery({
    queryKey: ["leave-types"],
    queryFn: async () => {
      const res = await leaveTypesApi.list();
      return (res.data ?? []).filter((t) => t.isActive);
    },
  });

  return {
    leaveRequests: lrQuery.data ?? [],
    departments: deptQuery.data ?? [],
    leaveTypes: ltQuery.data ?? [],
    loading: lrQuery.isLoading || deptQuery.isLoading || ltQuery.isLoading,
  };
}
