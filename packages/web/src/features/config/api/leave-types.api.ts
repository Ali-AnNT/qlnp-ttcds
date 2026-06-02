import { api } from "@/shared/api/client";
import { LeaveTypeDto } from "./types";

export const leaveTypesApi = {
  list: () => api.get<LeaveTypeDto[]>("/leave-types"),
  get: (id: number) => api.get<LeaveTypeDto>(`/leave-types/${id}`),
  create: (data: Omit<LeaveTypeDto, "id">) =>
    api.post<LeaveTypeDto>("/leave-types", data),
  update: (id: number, data: Partial<LeaveTypeDto>) =>
    api.put<LeaveTypeDto>(`/leave-types/${id}`, data),
  delete: (id: number) => api.delete<void>(`/leave-types/${id}`),
};
