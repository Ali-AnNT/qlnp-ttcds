// Types
export type UserRole = "CB.PCM" | "LD.PCM" | "GD.PGD" | "QTHT";

export const roleLabels: Record<UserRole, string> = {
  "CB.PCM": "Cán bộ phòng chuyên môn",
  "LD.PCM": "Lãnh đạo phòng chuyên môn",
  "GD.PGD": "Giám đốc / Phó giám đốc",
  "QTHT": "Quản trị hệ thống",
};

export type LeaveStatus = "pending" | "approved_leader" | "approved_director" | "rejected" | "cancelled";

export const leaveStatusLabels: Record<LeaveStatus, string> = {
  pending: "Chờ duyệt",
  approved_leader: "LĐ đã duyệt",
  approved_director: "GĐ đã duyệt",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
};

export interface Department {
  id: string;
  name: string;
  code: string | null;
}

export interface Employee {
  id: string;
  username: string;
  full_name: string;
  department_id: string | null;
  job_title: string | null;
  role: UserRole;
  phone: string | null;
  email: string | null;
  is_active: boolean;
}

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  default_days: number;
  description: string | null;
  is_active: boolean;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  status: LeaveStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  total_days: number;
  used_days: number;
}
