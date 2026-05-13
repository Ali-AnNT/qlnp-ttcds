import { api } from "./client";

export interface ConfigDto {
  id: number;
  leaveTypeId: number;
  approvalLevel: number;
  approverRole: string;
}

export interface UserRoleDto {
  userId: number;
  role: string;
}

export const configApi = {
  get: () => api.get<ConfigDto[]>("/config"),
  update: (data: ConfigDto[]) => api.put<ConfigDto[]>("/config", data),
  userRole: (userId: number) => api.get<UserRoleDto>(`/config/user-role/${userId}`),
};
