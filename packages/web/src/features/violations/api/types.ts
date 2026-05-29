import { DepartmentDto } from "@/features/layout/api/departments.api";
import { LeaveRequestDto } from "@/features/leave-requests/api/types";

export type Period = "year" | "quarter" | "month";

export interface UserAggregate {
  userId: number;
  userName: string;
  donViId: number;
  totalUsed: number;
  requests: LeaveRequestDto[];
  byType: Record<string, number>;
}

export interface EmployeeViolation extends UserAggregate {
  dept?: DepartmentDto;
  limit: number;
  overage: number;
}

export interface DepartmentViolation {
  dept: DepartmentDto;
  totalUsed: number;
  allowed: number;
  overage: number;
  empCount: number;
  violatingCount: number;
  totalEmpOverage: number;
  byType: Record<string, number>;
}

export interface ViolationByType {
  name: string;
  value: number;
}
