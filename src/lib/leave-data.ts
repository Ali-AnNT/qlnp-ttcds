// Types
export type UserRole = "CB.PCM" | "LD.PCM" | "GD.PGD" | "QTHT";

export const roleLabels: Record<UserRole, string> = {
  "CB.PCM": "Cán bộ phòng chuyên môn",
  "LD.PCM": "Lãnh đạo phòng chuyên môn",
  "GD.PGD": "Giám đốc / Phó giám đốc",
  "QTHT": "Quản trị hệ thống",
};

export type LeaveType = "annual" | "sick" | "unpaid" | "maternity" | "business";
export type LeaveStatus = "draft" | "pending" | "approved" | "rejected" | "cancelled";

export const leaveTypeLabels: Record<LeaveType, string> = {
  annual: "Phép năm",
  sick: "Nghỉ bệnh",
  unpaid: "Nghỉ không lương",
  maternity: "Nghỉ thai sản",
  business: "Nghỉ công tác",
};

export const leaveStatusLabels: Record<LeaveStatus, string> = {
  draft: "Nháp",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
};

export interface Department {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  name: string;
  departmentId: string;
  role: UserRole;
  email: string;
  avatar?: string;
  annualLeaveTotal: number;
  annualLeaveUsed: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  approverId?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveConfig {
  defaultAnnualDays: number;
  leaveCycleType: "yearly" | "monthly";
  leaveTypes: { type: LeaveType; label: string; enabled: boolean }[];
  approvalChain: { leaveType: LeaveType; approvers: UserRole[] }[];
}

// Mock data
export const departments: Department[] = [
  { id: "d1", name: "Phòng Kỹ thuật" },
  { id: "d2", name: "Phòng Hành chính" },
  { id: "d3", name: "Phòng Kế toán" },
  { id: "d4", name: "Phòng Dự án" },
];

export const employees: Employee[] = [
  { id: "e1", name: "Nguyễn Văn An", departmentId: "d1", role: "CB.PCM", email: "an.nv@gov.vn", annualLeaveTotal: 12, annualLeaveUsed: 3 },
  { id: "e2", name: "Trần Thị Bình", departmentId: "d1", role: "CB.PCM", email: "binh.tt@gov.vn", annualLeaveTotal: 12, annualLeaveUsed: 5 },
  { id: "e3", name: "Lê Hoàng Cường", departmentId: "d1", role: "LD.PCM", email: "cuong.lh@gov.vn", annualLeaveTotal: 14, annualLeaveUsed: 2 },
  { id: "e4", name: "Phạm Minh Đức", departmentId: "d2", role: "CB.PCM", email: "duc.pm@gov.vn", annualLeaveTotal: 12, annualLeaveUsed: 7 },
  { id: "e5", name: "Hoàng Thị Em", departmentId: "d2", role: "CB.PCM", email: "em.ht@gov.vn", annualLeaveTotal: 12, annualLeaveUsed: 1 },
  { id: "e6", name: "Vũ Đình Phúc", departmentId: "d2", role: "LD.PCM", email: "phuc.vd@gov.vn", annualLeaveTotal: 14, annualLeaveUsed: 4 },
  { id: "e7", name: "Đặng Văn Giang", departmentId: "d3", role: "CB.PCM", email: "giang.dv@gov.vn", annualLeaveTotal: 12, annualLeaveUsed: 8 },
  { id: "e8", name: "Ngô Thị Hương", departmentId: "d3", role: "CB.PCM", email: "huong.nt@gov.vn", annualLeaveTotal: 12, annualLeaveUsed: 2 },
  { id: "e9", name: "Bùi Quốc Khánh", departmentId: "d3", role: "LD.PCM", email: "khanh.bq@gov.vn", annualLeaveTotal: 14, annualLeaveUsed: 6 },
  { id: "e10", name: "Trịnh Văn Long", departmentId: "d4", role: "CB.PCM", email: "long.tv@gov.vn", annualLeaveTotal: 12, annualLeaveUsed: 10 },
  { id: "e11", name: "Mai Thị Ngọc", departmentId: "d4", role: "CB.PCM", email: "ngoc.mt@gov.vn", annualLeaveTotal: 12, annualLeaveUsed: 3 },
  { id: "e12", name: "Lý Minh Phát", departmentId: "d4", role: "LD.PCM", email: "phat.lm@gov.vn", annualLeaveTotal: 14, annualLeaveUsed: 5 },
  { id: "e13", name: "Đinh Quang Sơn", departmentId: "d1", role: "GD.PGD", email: "son.dq@gov.vn", annualLeaveTotal: 16, annualLeaveUsed: 3 },
  { id: "e14", name: "Cao Thị Tâm", departmentId: "d1", role: "QTHT", email: "tam.ct@gov.vn", annualLeaveTotal: 12, annualLeaveUsed: 1 },
];

export const mockUsers = [
  { username: "nvan", password: "123456", employeeId: "e1", role: "CB.PCM" as UserRole },
  { username: "lhcuong", password: "123456", employeeId: "e3", role: "LD.PCM" as UserRole },
  { username: "dqson", password: "123456", employeeId: "e13", role: "GD.PGD" as UserRole },
  { username: "cttam", password: "123456", employeeId: "e14", role: "QTHT" as UserRole },
];

export const initialLeaveRequests: LeaveRequest[] = [
  { id: "lr1", employeeId: "e1", type: "annual", startDate: "2026-04-20", endDate: "2026-04-22", days: 3, reason: "Du lịch gia đình", status: "pending", approverId: "e3", createdAt: "2026-04-10", updatedAt: "2026-04-10" },
  { id: "lr2", employeeId: "e1", type: "sick", startDate: "2026-03-15", endDate: "2026-03-16", days: 2, reason: "Khám bệnh định kỳ", status: "approved", approverId: "e3", createdAt: "2026-03-12", updatedAt: "2026-03-13" },
  { id: "lr3", employeeId: "e2", type: "annual", startDate: "2026-04-25", endDate: "2026-04-28", days: 4, reason: "Về quê thăm gia đình", status: "pending", approverId: "e3", createdAt: "2026-04-12", updatedAt: "2026-04-12" },
  { id: "lr4", employeeId: "e4", type: "unpaid", startDate: "2026-03-01", endDate: "2026-03-03", days: 3, reason: "Giải quyết việc cá nhân", status: "approved", approverId: "e6", createdAt: "2026-02-25", updatedAt: "2026-02-26" },
  { id: "lr5", employeeId: "e5", type: "sick", startDate: "2026-04-05", endDate: "2026-04-05", days: 1, reason: "Bị cảm", status: "approved", approverId: "e6", createdAt: "2026-04-04", updatedAt: "2026-04-04" },
  { id: "lr6", employeeId: "e7", type: "annual", startDate: "2026-04-15", endDate: "2026-04-18", days: 4, reason: "Nghỉ phép cùng gia đình", status: "rejected", approverId: "e9", rejectionReason: "Trùng lịch dự án quan trọng", createdAt: "2026-04-08", updatedAt: "2026-04-09" },
  { id: "lr7", employeeId: "e8", type: "maternity", startDate: "2026-05-01", endDate: "2026-08-31", days: 120, reason: "Nghỉ thai sản theo quy định", status: "approved", approverId: "e9", createdAt: "2026-04-01", updatedAt: "2026-04-02" },
  { id: "lr8", employeeId: "e10", type: "annual", startDate: "2026-04-10", endDate: "2026-04-14", days: 5, reason: "Du lịch Đà Nẵng", status: "pending", approverId: "e12", createdAt: "2026-04-05", updatedAt: "2026-04-05" },
  { id: "lr9", employeeId: "e11", type: "business", startDate: "2026-04-08", endDate: "2026-04-09", days: 2, reason: "Đi công tác Hà Nội", status: "approved", approverId: "e12", createdAt: "2026-04-03", updatedAt: "2026-04-04" },
  { id: "lr10", employeeId: "e2", type: "annual", startDate: "2026-02-14", endDate: "2026-02-14", days: 1, reason: "Việc gia đình", status: "approved", approverId: "e3", createdAt: "2026-02-10", updatedAt: "2026-02-11" },
  { id: "lr11", employeeId: "e4", type: "sick", startDate: "2026-01-20", endDate: "2026-01-22", days: 3, reason: "Sốt cao", status: "approved", approverId: "e6", createdAt: "2026-01-19", updatedAt: "2026-01-19" },
  { id: "lr12", employeeId: "e7", type: "annual", startDate: "2026-01-05", endDate: "2026-01-09", days: 5, reason: "Nghỉ Tết về quê", status: "approved", approverId: "e9", createdAt: "2025-12-20", updatedAt: "2025-12-21" },
  { id: "lr13", employeeId: "e10", type: "annual", startDate: "2026-02-01", endDate: "2026-02-05", days: 5, reason: "Nghỉ phép đầu năm", status: "approved", approverId: "e12", createdAt: "2026-01-25", updatedAt: "2026-01-26" },
  { id: "lr14", employeeId: "e1", type: "annual", startDate: "2026-05-10", endDate: "2026-05-12", days: 3, reason: "Đám cưới bạn thân", status: "draft", createdAt: "2026-04-14", updatedAt: "2026-04-14" },
  { id: "lr15", employeeId: "e5", type: "annual", startDate: "2026-06-01", endDate: "2026-06-03", days: 3, reason: "Du lịch hè", status: "pending", approverId: "e6", createdAt: "2026-04-15", updatedAt: "2026-04-15" },
  { id: "lr16", employeeId: "e11", type: "sick", startDate: "2026-03-20", endDate: "2026-03-21", days: 2, reason: "Đau dạ dày", status: "approved", approverId: "e12", createdAt: "2026-03-19", updatedAt: "2026-03-19" },
  { id: "lr17", employeeId: "e3", type: "annual", startDate: "2026-04-28", endDate: "2026-04-30", days: 3, reason: "Nghỉ phép năm", status: "pending", approverId: "e13", createdAt: "2026-04-14", updatedAt: "2026-04-14" },
  { id: "lr18", employeeId: "e6", type: "business", startDate: "2026-04-22", endDate: "2026-04-23", days: 2, reason: "Đi công tác TP.HCM", status: "pending", approverId: "e13", createdAt: "2026-04-13", updatedAt: "2026-04-13" },
  { id: "lr19", employeeId: "e9", type: "annual", startDate: "2026-05-05", endDate: "2026-05-07", days: 3, reason: "Nghỉ phép", status: "pending", approverId: "e13", createdAt: "2026-04-14", updatedAt: "2026-04-14" },
  { id: "lr20", employeeId: "e12", type: "sick", startDate: "2026-04-01", endDate: "2026-04-02", days: 2, reason: "Cảm cúm", status: "approved", approverId: "e13", createdAt: "2026-03-31", updatedAt: "2026-04-01" },
];

export const defaultLeaveConfig: LeaveConfig = {
  defaultAnnualDays: 12,
  leaveCycleType: "yearly",
  leaveTypes: [
    { type: "annual", label: "Phép năm", enabled: true },
    { type: "sick", label: "Nghỉ bệnh", enabled: true },
    { type: "unpaid", label: "Nghỉ không lương", enabled: true },
    { type: "maternity", label: "Nghỉ thai sản", enabled: true },
    { type: "business", label: "Nghỉ công tác", enabled: true },
  ],
  approvalChain: [
    { leaveType: "annual", approvers: ["LD.PCM", "GD.PGD"] },
    { leaveType: "sick", approvers: ["LD.PCM"] },
    { leaveType: "unpaid", approvers: ["LD.PCM", "GD.PGD"] },
    { leaveType: "maternity", approvers: ["LD.PCM", "GD.PGD"] },
    { leaveType: "business", approvers: ["LD.PCM"] },
  ],
};
