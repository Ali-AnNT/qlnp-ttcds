import type { LeaveStatus } from "../constants/app-roles";

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
export function getApprovalStatusLabel(
  status: string,
  approvedLevel: number,
  maxLevel: number,
): string {
  if (status === "approved") return "Đã duyệt";
  if (status === "rejected") return "Từ chối";
  if (status === "cancelled") return "Đã hủy";
  if (status === "pending" && approvedLevel > 0) {
    const levelLabel =
      APPROVAL_LEVEL_LABELS[approvedLevel] ?? `Cấp ${approvedLevel}`;
    return maxLevel > approvedLevel
      ? `${levelLabel} (cấp ${approvedLevel}/${maxLevel})`
      : levelLabel;
  }
  if (status === "pending") return "Chờ duyệt";
  return status;
}

/**
 * Returns Tailwind badge classes for approval status.
 */
export function getApprovalStatusColor(
  status: string,
  approvedLevel: number,
  maxLevel: number,
): string {
  if (status === "approved")
    return "bg-success/10 text-success border-success/30";
  if (status === "rejected") return "bg-red-100 text-red-700 border-red-300";
  if (status === "cancelled")
    return "bg-gray-100 text-gray-500 border-gray-300";
  if (status === "pending" && approvedLevel > 0 && approvedLevel < maxLevel)
    return "bg-blue-100 text-blue-700 border-blue-300";
  if (status === "pending")
    return "bg-yellow-100 text-yellow-700 border-yellow-300";
  return "bg-gray-100 text-gray-500 border-gray-300";
}