// Reports API — re-exports from feature-owning modules for reports queries.

export { leaveRequestsApi, type LeaveRequestDto } from "@/features/leave-requests";

export {
  departmentsApi,
  type DepartmentDto,
} from "@/features/layout";

export { leaveTypesApi, type LeaveTypeDto } from "@/features/config";
