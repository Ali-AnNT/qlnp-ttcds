// Reports API — re-exports from feature-owning modules for reports queries.

export { leaveRequestsApi } from "@/features/leave-requests/api/leave-requests.api";
export type { LeaveRequestDto } from "@/features/leave-requests/api/types";

export {
  departmentsApi,
  type DepartmentDto,
} from "@/features/layout";

export { leaveTypesApi, type LeaveTypeDto } from "@/features/config";
