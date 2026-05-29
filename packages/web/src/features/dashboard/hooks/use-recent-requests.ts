import { useQuery } from "@tanstack/react-query";
import { leaveRequestsApi, type LeaveRequestDto } from "../api/dashboard.api";
import { useAuth } from "@/features/auth";
import { AppRoles } from "@/features/shared-reference-data";

/** Recent leave requests for dashboard activity feed.
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

  // My own requests (for staff metrics)
  const myRequests = isStaff
    ? leaveRequests
    : leaveRequests.filter((r) => r.userId === user?.userId);

  // Pending approval count (all for managers, own for staff)
  const pendingApproval = isStaff
    ? myRequests.filter((r) => r.status === "pending")
    : leaveRequests.filter((r) => r.status === "pending");

  const approvedCount = myRequests.filter((r) => r.status === "approved").length;
  const totalDaysUsed = myRequests
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => sum + r.totalDays, 0);

  // Last 8 requests for activity feed
  const recentRequests = leaveRequests.slice(0, 8);

  return {
    leaveRequests,
    myRequests,
    pendingApproval,
    approvedCount,
    totalDaysUsed,
    recentRequests,
    loading: query.isLoading,
  };
}