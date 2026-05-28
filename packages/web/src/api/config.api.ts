import { api } from "./client";

export interface ConfigDto {
  id: number;
  leaveTypeId: number;
  approvalLevel: number;
  approverRole: string;
}

export const configApi = {
  get: () => api.get<ConfigDto[]>("/system-configs/leave-configs"),
  update: (data: ConfigDto[]) => api.put<ConfigDto[]>("/system-configs/leave-configs", data),
};
