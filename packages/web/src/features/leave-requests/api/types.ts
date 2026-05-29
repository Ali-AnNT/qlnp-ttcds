// ── Leave Request DTOs ──

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
  totalDays?: number;
}

// ── Leave Balance DTO ──

export interface LeaveBalanceDto {
  id: number;
  userId: number;
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  role?: string;
}
