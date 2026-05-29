// Config feature — owns leave-types CRUD and LeaveTypeDto.
// Other features import LeaveTypeDto from here to avoid type drift.
export { leaveTypesApi, type LeaveTypeDto } from "./api/leave-types.api";
export { configApi, type ConfigDto } from "./api/config.api";
