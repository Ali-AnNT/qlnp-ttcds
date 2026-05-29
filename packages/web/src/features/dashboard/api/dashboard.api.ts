// Dashboard API — re-exports from feature API modules for dashboard queries.
// Dashboard hooks may import directly from these features instead of using this barrel.

export {
  leaveBalancesApi,
  type LeaveBalanceDto,
} from "@/features/leave-requests/api/leave-balances.api";

export {
  leaveRequestsApi,
  type LeaveRequestDto,
} from "@/features/leave-requests/api/leave-requests.api";

export { leaveTypesApi, type LeaveTypeDto } from "@/features/config";

export { configApi, type ConfigDto } from "@/features/config";
