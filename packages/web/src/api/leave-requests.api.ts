import { api } from "./client";

export interface LeaveRequestDto {
  id: number;
  userId: number;
  userName?: string;
  donViId?: number;
  donViName?: string;
  leaveTypeId: number;
  leaveTypeName?: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: string;
  approvedLevel: number;
  requestedApproverId?: number | null;
  approvedBy: number | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateLeaveRequestDto {
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  reason?: string;
}

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
