import { useQuery } from "@tanstack/react-query";
import { configApi } from "@/features/config";

/** Max approval level per leave type, used for status label display. */
export function useMaxLevelByType() {
  const query = useQuery({
    queryKey: ["approval-configs"],
    queryFn: async () => {
      const res = await configApi.get();
      return res.data ?? [];
    },
  });

  const maxLevelByType = new Map<number, number>();
  for (const c of query.data ?? []) {
    const current = maxLevelByType.get(c.leaveTypeId) ?? 0;
    if (c.approvalLevel > current) maxLevelByType.set(c.leaveTypeId, c.approvalLevel);
  }

  return { maxLevelByType, loading: query.isLoading };
}
