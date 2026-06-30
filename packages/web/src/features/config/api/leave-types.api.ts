import { api } from "@/shared/api/client";
import { LeaveTypeDto } from "./types";

export const leaveTypesApi = {
  list: (params?: { q?: string; includeInactive?: boolean }) => {
    const s = new URLSearchParams();
    if (params?.q) s.set("q", params.q);
    if (params?.includeInactive) s.set("includeInactive", "true");
    const qs = s.toString();
    return api.get<LeaveTypeDto[]>(`/leave-types${qs ? `?${qs}` : ""}`);
  },
  get: (id: number) => api.get<LeaveTypeDto>(`/leave-types/${id}`),
  create: (data: Omit<LeaveTypeDto, "id">) =>
    api.post<LeaveTypeDto>("/leave-types", data),
  update: (id: number, data: Omit<LeaveTypeDto, "id">) =>
    api.put<LeaveTypeDto>(`/leave-types/${id}`, data),
  delete: (id: number) => api.delete<void>(`/leave-types/${id}`),
};
