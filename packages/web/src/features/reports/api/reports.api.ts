import { api } from "@/shared/api/client";

export interface StatisticsResponse {
  totalDays: number;
  approvedRatio: number;
  rejectedCount: number;
  pendingCount: number;
  cancelledCount: number;
  byDept: DeptStat[];
  byType: TypeStat[];
  byPeriod: PeriodStat[] | null;
}

export interface DeptStat {
  name: string;
  days: number;
}

export interface TypeStat {
  name: string;
  value: number;
}

export interface PeriodStat {
  period: string;
  totalDays: number;
  employeeCount: number;
}

export interface ReportsFilterParams {
  from?: string;
  to?: string;
  status?: string;
  period?: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8003/api";

export const reportsApi = {
  statistics: (params: ReportsFilterParams) => {
    const cleanParams = Object.entries(params).filter(
      ([_, v]) => v != null && v !== ""
    );
    const qs = new URLSearchParams(cleanParams as [string, string][]).toString();
    return api.get<StatisticsResponse>(`/reports/statistics?${qs}`);
  },
  exportUrl: (params: ReportsFilterParams) => {
    const cleanParams = Object.entries(params).filter(
      ([_, v]) => v != null && v !== ""
    );
    const qs = new URLSearchParams(cleanParams as [string, string][]).toString();
    return `${API_URL}/reports/export?${qs}`;
  },
};
