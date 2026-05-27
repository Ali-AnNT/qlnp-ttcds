// Role constants — single source of truth
export const AppRoles = {
  Staff: "QLNP.CB.PCM",
  Leader: "QLNP.LD.PCM",
  Director: "QLNP.GD.PGD",
  Admin: "QLNP.QTHT",
} as const;

export type UserRole = (typeof AppRoles)[keyof typeof AppRoles];

export const roleLabels: Record<UserRole, string> = {
  [AppRoles.Staff]: "Cán bộ phòng chuyên môn",
  [AppRoles.Leader]: "Lãnh đạo phòng chuyên môn",
  [AppRoles.Director]: "Giám đốc / Phó giám đốc",
  [AppRoles.Admin]: "Quản trị hệ thống",
};

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export const leaveStatusLabels: Record<LeaveStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
};

/** Level-specific labels for approval progress display */
const APPROVAL_LEVEL_LABELS: Record<number, string> = {
  1: "TP đã duyệt",
  2: "BGĐ đã duyệt",
};

/**
 * Returns approval status text with progress indication.
 * - approved → "Đã duyệt"
 * - pending + approvedLevel > 0 → "TP đã duyệt (cấp 1/2)" etc.
 * - pending + approvedLevel = 0 → "Chờ duyệt"
 */
export function getApprovalStatusLabel(status: string, approvedLevel: number, maxLevel: number): string {
  if (status === "approved") return "Đã duyệt";
  if (status === "rejected") return "Từ chối";
  if (status === "cancelled") return "Đã hủy";
  if (status === "pending" && approvedLevel > 0) {
    const levelLabel = APPROVAL_LEVEL_LABELS[approvedLevel] ?? `Cấp ${approvedLevel}`;
    return maxLevel > approvedLevel ? `${levelLabel} (cấp ${approvedLevel}/${maxLevel})` : levelLabel;
  }
  if (status === "pending") return "Chờ duyệt";
  return status;
}

/**
 * Returns Tailwind badge classes for approval status.
 */
export function getApprovalStatusColor(status: string, approvedLevel: number, maxLevel: number): string {
  if (status === "approved") return "bg-success/10 text-success border-success/30";
  if (status === "rejected") return "bg-red-100 text-red-700 border-red-300";
  if (status === "cancelled") return "bg-gray-100 text-gray-500 border-gray-300";
  if (status === "pending" && approvedLevel > 0 && approvedLevel < maxLevel)
    return "bg-blue-100 text-blue-700 border-blue-300";
  if (status === "pending") return "bg-yellow-100 text-yellow-700 border-yellow-300";
  return "bg-gray-100 text-gray-500 border-gray-300";
}

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

export interface ApprovalConfig {
  id: string;
  leave_type_id: string;
  approval_level: number;
  approver_role: UserRole;
}