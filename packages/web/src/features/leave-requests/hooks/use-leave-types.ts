import { useQuery } from "@tanstack/react-query";
import { leaveTypesApi } from "@/features/config";

/** Leave types are owned by the config feature (CRUD).
 *  This hook is a convenience wrapper for features that only need to read them. */
export function useLeaveTypes() {
  return useQuery({
    queryKey: ["leave-types"],
    queryFn: async () => {
      const res = await leaveTypesApi.list();
      return (res.data ?? []).filter((t) => t.isActive);
    },
  });
}
