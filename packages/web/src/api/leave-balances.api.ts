import { api } from "@/shared/api/client";

export interface LeaveBalanceDto {
  id: number;
  userId: number;
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  role?: string;
}

export const leaveBalancesApi = {
  list: (year?: number) =>
    api.get<LeaveBalanceDto[]>(`/leave-balances${year ? `?year=${year}` : ""}`),
  my: (year?: number) =>
    api.get<LeaveBalanceDto[]>(`/leave-balances/my${year ? `?year=${year}` : ""}`),
};