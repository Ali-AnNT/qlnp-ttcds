import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { configApi } from "@/features/config";
import type { ConfigDto } from "@/features/config";

/** Maps a leave type to its max approval level (for status label display). */
function buildMaxLevelByType(configs: ConfigDto[]) {
  const map = new Map<number, number>();
  for (const c of configs) {
    const current = map.get(c.leaveTypeId) ?? 0;
    if (c.approvalLevel > current) map.set(c.leaveTypeId, c.approvalLevel);
  }
  return map;
}

/** Maps a leave type → { approvalLevel → approver roles[] } (for visibility routing). */
function buildFlowByType(configs: ConfigDto[]) {
  const map = new Map<number, Map<number, string[]>>();
  for (const c of configs) {
    if (!map.has(c.leaveTypeId)) map.set(c.leaveTypeId, new Map());
    const levelMap = map.get(c.leaveTypeId)!;
    if (!levelMap.has(c.approvalLevel)) levelMap.set(c.approvalLevel, []);
    levelMap.get(c.approvalLevel)!.push(c.approverRole);
  }
  return map;
}

export function useApprovalConfigs() {
  const query = useQuery({
    queryKey: ["approval-configs"],
    queryFn: async () => {
      const res = await configApi.get();
      return res.data ?? [];
    },
  });

  const maxLevelByType = useMemo(() => buildMaxLevelByType(query.data ?? []), [query.data]);
  const flowByType = useMemo(() => buildFlowByType(query.data ?? []), [query.data]);

  return {
    configs: query.data ?? [],
    maxLevelByType,
    flowByType,
    loading: query.isLoading,
  };
}
