import { format, parseISO } from "date-fns";

/** Format a date string (ISO or yyyy-mm-dd) to dd-mm-yyyy */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const d = dateStr.includes("T") ? parseISO(dateStr) : parseISO(dateStr);
    return format(d, "dd-MM-yyyy");
  } catch {
    return dateStr;
  }
}

/**
 * Count business days between start and end, inclusive, based on a set of work days.
 * Returns 0 if start > end or if the range contains no business days.
 * @param workDays Array of day indices (0=Sun, 1=Mon, ..., 6=Sat)
 */
export function countBusinessDays(start: Date, end: Date, workDays: number[] = [1, 2, 3, 4, 5]): number {
  if (start > end) return 0;
  let count = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);
  while (current <= endDate) {
    const day = current.getDay();
    if (workDays.includes(day)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Parse comma-separated work days string (e.g. "1,2,3,4,5") into number array.
 * Defaults to Mon-Fri [1,2,3,4,5] if input is null, empty, or invalid.
 */
export function parseWorkDays(configValue: string | null | undefined): number[] {
  if (!configValue) return [1, 2, 3, 4, 5];
  const days = configValue.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
  return days.length > 0 ? days : [1, 2, 3, 4, 5];
}

