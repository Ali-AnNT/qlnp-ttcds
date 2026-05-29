// Dashboard API — re-exports from shared API modules for dashboard queries.
// Re-export types needed by dashboard hooks and components.
export {
  leaveBalancesApi,
  type LeaveBalanceDto,
} from "@/api/leave-balances.api";

export {
  leaveRequestsApi,
  type LeaveRequestDto,
} from "@/api/leave-requests.api";

export { leaveTypesApi, type LeaveTypeDto } from "@/api/leave-types.api";

export { configApi, type ConfigDto } from "@/api/config.api";