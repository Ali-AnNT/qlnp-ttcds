import { useQuery } from "@tanstack/react-query";
import { leaveBalancesApi } from "../api/leave-balances.api";

export function useLeaveBalances(year?: number) {
  const currentYear = year ?? new Date().getFullYear();

  return useQuery({
    queryKey: ["leave-balances", "my", currentYear],
    queryFn: async () => {
      const res = await leaveBalancesApi.my(currentYear);
      return res.data ?? [];
    },
  });
}
