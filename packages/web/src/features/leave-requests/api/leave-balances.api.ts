import { api } from "@/shared/api/client";
import type { LeaveBalanceDto } from "./types";

export const leaveBalancesApi = {
  list: (year?: number) =>
    api.get<LeaveBalanceDto[]>(`/leave-balances${year ? `?year=${year}` : ""}`),
  my: (year?: number) =>
    api.get<LeaveBalanceDto[]>(`/leave-balances/my${year ? `?year=${year}` : ""}`),
};