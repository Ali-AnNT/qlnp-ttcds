// Dashboard API — re-exports from feature API modules for dashboard queries.
// Dashboard hooks may import directly from these features instead of using this barrel.

export {
  leaveBalancesApi,
  leaveRequestsApi,
  type LeaveBalanceDto,
  type LeaveRequestDto,
} from "@/features/leave-requests";

export { leaveTypesApi, type LeaveTypeDto } from "@/features/config";

export { configApi, type ConfigDto } from "@/features/config";
