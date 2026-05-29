// Calendar API — re-exports from feature API modules for calendar queries.
// Calendar hooks import directly from feature-owning features.

export {
  leaveRequestsApi,
  type LeaveRequestDto,
} from "@/features/leave-requests";

export {
  departmentsApi,
  type DepartmentDto,
} from "@/features/layout";

export { configApi, type ConfigDto } from "@/features/config";
