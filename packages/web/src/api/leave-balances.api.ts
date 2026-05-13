import { api } from "./client";

export interface LeaveBalanceDto {
  id: number;
  userId: number;
  leaveTypeId: number;
  leaveTypeName?: string;
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

export const leaveBalancesApi = {
  list: (year?: number) =>
    api.get<LeaveBalanceDto[]>(`/leave-balances${year ? `?year=${year}` : ""}`),
  my: (year?: number) =>
    api.get<LeaveBalanceDto[]>(`/leave-balances/my${year ? `?year=${year}` : ""}`),
};
