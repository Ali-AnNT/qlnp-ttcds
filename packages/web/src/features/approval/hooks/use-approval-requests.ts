import { useQuery } from "@tanstack/react-query";
import { leaveRequestsApi } from "../api/approval.api";

/** All pending leave requests for the approval dashboard. */
export function useApprovalRequests() {
  return useQuery({
    queryKey: ["leave-requests", "approval"],
    queryFn: async () => {
      const res = await leaveRequestsApi.list({ status: "pending" });
      return res.data ?? [];
    },
  });
}
