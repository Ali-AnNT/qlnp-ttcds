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
