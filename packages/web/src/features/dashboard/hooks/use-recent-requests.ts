import { useQuery } from "@tanstack/react-query";
import { leaveRequestsApi, type LeaveRequestDto } from "../api/dashboard.api";
import { useAuth } from "@/features/auth";
import { AppRoles } from "@/features/shared-reference-data";

/** Recent leave requests for the dashboard activity feed.
 *  Staff see only their own; managers/admins see all. */
export function useRecentRequests() {
  const { user } = useAuth();
  const isStaff = user?.role === AppRoles.Staff;

  const query = useQuery({
    queryKey: ["leave-requests", isStaff ? "my" : "all"],
    queryFn: async () => {
      const res = isStaff
        ? await leaveRequestsApi.listMy()
        : await leaveRequestsApi.list();
      return res.data ?? [];
    },
  });

  const leaveRequests: LeaveRequestDto[] = query.data ?? [];

  // Pending approval count (all for managers, own for staff) — used by the CTA button
  const pendingApproval = isStaff
    ? leaveRequests.filter((r) => r.status === "pending")
    : leaveRequests.filter((r) => r.status === "pending");

  // Last 8 requests for activity feed
  const recentRequests = leaveRequests.slice(0, 8);

  return {
    pendingApproval,
    recentRequests,
    loading: query.isLoading,
  };
}
