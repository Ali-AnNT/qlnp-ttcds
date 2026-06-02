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