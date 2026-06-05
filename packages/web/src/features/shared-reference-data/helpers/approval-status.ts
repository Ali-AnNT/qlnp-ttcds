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
    return "lma-bg-success/10 lma-text-success lma-border-success/30";
  if (status === "rejected") return "lma-bg-red-100 lma-text-red-700 lma-border-red-300";
  if (status === "cancelled")
    return "lma-bg-gray-100 lma-text-gray-500 lma-border-gray-300";
  if (status === "pending" && approvedLevel > 0 && approvedLevel < maxLevel)
    return "lma-bg-blue-100 lma-text-blue-700 lma-border-blue-300";
  if (status === "pending")
    return "lma-bg-yellow-100 lma-text-yellow-700 lma-border-yellow-300";
  return "lma-bg-gray-100 lma-text-gray-500 lma-border-gray-300";
}