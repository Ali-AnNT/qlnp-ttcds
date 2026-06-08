import { useQuery } from "@tanstack/react-query";
import { myStatsApi, type MyStatsResponse } from "../api/my-stats.api";

/** Fetches server-computed dashboard metrics (remaining days + request counts).
 *  Replaces client-side aggregation across leave-balances/my + leave-requests/my. */
export function useMyStats() {
  const query = useQuery<MyStatsResponse>({
    queryKey: ["lma-my-stats"],
    queryFn: async () => {
      const res = await myStatsApi.get();
      if (res.data === null) {
        throw new Error(res.error ?? "Failed to load my stats");
      }
      return res.data;
    },
  });

  return {
    remainingDays: query.data?.remainingDays ?? 0,
    pendingCount: query.data?.pendingCount ?? 0,
    approvedCount: query.data?.approvedCount ?? 0,
    usedDays: query.data?.usedDays ?? 0,
    loading: query.isLoading,
    error: query.error,
  };
}
