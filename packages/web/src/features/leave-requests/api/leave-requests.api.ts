import { api } from "@/shared/api/client";
import type { LeaveRequestDto, CreateLeaveRequestDto } from "./types";

export const leaveRequestsApi = {
  list: (params?: { status?: string; page?: number; pageSize?: number }) =>
    api.get<LeaveRequestDto[]>(
      `/leave-requests?${new URLSearchParams(
        Object.entries(params || {}).filter(([_, v]) => v != null) as [string, string][]
      ).toString()}`
    ),
  listMy: () => api.get<LeaveRequestDto[]>("/leave-requests/my"),
  create: (data: CreateLeaveRequestDto) =>
    api.post<LeaveRequestDto>("/leave-requests", data),
  update: (id: number, data: Partial<CreateLeaveRequestDto>) =>
    api.put<LeaveRequestDto>(`/leave-requests/${id}`, data),
  approve: (id: number) =>
    api.post<LeaveRequestDto>(`/leave-requests/${id}/approve`),
  reject: (id: number, rejectedReason?: string) =>
    api.post<LeaveRequestDto>(`/leave-requests/${id}/reject`, { rejectedReason }),
  cancel: (id: number) =>
    api.post<LeaveRequestDto>(`/leave-requests/${id}/cancel`),
};
