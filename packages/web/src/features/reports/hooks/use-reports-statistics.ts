import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "../api/reports.api";
import type { ReportsFilterParams } from "../api/reports.api";

export function useReportsStatistics(params: ReportsFilterParams = {}) {
  return useQuery({
    queryKey: ["reports-statistics", params],
    queryFn: async () => {
      const { data, error } = await reportsApi.statistics(params);
      if (error) throw new Error(error);
      return data!;
    },
  });
}
