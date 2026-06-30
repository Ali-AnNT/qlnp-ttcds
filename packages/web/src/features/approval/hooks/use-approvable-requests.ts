import { useQuery } from "@tanstack/react-query";
import { leaveRequestsApi } from "@/features/leave-requests";

/**
 * Pending leave requests the current user is allowed to approve at the next
 * level. BE filters by role + department + approval config — no client-side
 * filtering required.
 */
export function useApprovableRequests() {
  return useQuery({
    queryKey: ["leave-requests", "approvable"],
    queryFn: async () => {
      const res = await leaveRequestsApi.approvable();
      return res.data ?? [];
    },
  });
}
