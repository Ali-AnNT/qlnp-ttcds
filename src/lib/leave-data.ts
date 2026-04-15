export type LeaveType = "annual" | "sick" | "personal" | "unpaid";
export type LeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveRequest {
  id: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
  days: number;
}

export interface LeaveBalance {
  type: LeaveType;
  label: string;
  total: number;
  used: number;
  remaining: number;
}

export const leaveTypeLabels: Record<LeaveType, string> = {
  annual: "Nghỉ phép năm",
  sick: "Nghỉ ốm",
  personal: "Nghỉ việc riêng",
  unpaid: "Nghỉ không lương",
};

export const leaveStatusLabels: Record<LeaveStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

export const initialBalances: LeaveBalance[] = [
  { type: "annual", label: "Nghỉ phép năm", total: 12, used: 3, remaining: 9 },
  { type: "sick", label: "Nghỉ ốm", total: 30, used: 2, remaining: 28 },
  { type: "personal", label: "Nghỉ việc riêng", total: 3, used: 1, remaining: 2 },
  { type: "unpaid", label: "Nghỉ không lương", total: 0, used: 0, remaining: 0 },
];

export const sampleRequests: LeaveRequest[] = [
  {
    id: "1",
    type: "annual",
    startDate: "2026-04-20",
    endDate: "2026-04-22",
    reason: "Du lịch gia đình",
    status: "pending",
    createdAt: "2026-04-10",
    days: 3,
  },
  {
    id: "2",
    type: "sick",
    startDate: "2026-03-15",
    endDate: "2026-03-16",
    reason: "Khám bệnh định kỳ",
    status: "approved",
    createdAt: "2026-03-12",
    days: 2,
  },
  {
    id: "3",
    type: "personal",
    startDate: "2026-02-14",
    endDate: "2026-02-14",
    reason: "Việc gia đình",
    status: "rejected",
    createdAt: "2026-02-10",
    days: 1,
  },
];
