import { describe, expect, it } from "vitest";
import { EditLeaveRequestSchema } from "./leave-my-page"; // We might need to export it first

describe("EditLeaveRequestSchema", () => {
  const today = "2026-06-03";
  const approvedDates = new Set(["2026-06-10", "2026-06-11"]);

  it("should validate valid input", () => {
    const schema = EditLeaveRequestSchema(approvedDates, today);
    const result = schema.safeParse({
      leaveTypeId: "1",
      startDate: "2026-06-05",
      endDate: "2026-06-07",
      reason: "Sickness",
    });
    expect(result.success).toBe(true);
  });

  it("should fail if startDate is in the past", () => {
    const schema = EditLeaveRequestSchema(approvedDates, today);
    const result = schema.safeParse({
      leaveTypeId: "1",
      startDate: "2026-06-01",
      endDate: "2026-06-02",
      reason: "Sickness",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["startDate"],
            message: "Không được chọn ngày trong quá khứ",
          }),
        ]),
      );
    }
  });

  it("should fail if endDate is before startDate", () => {
    const schema = EditLeaveRequestSchema(approvedDates, today);
    const result = schema.safeParse({
      leaveTypeId: "1",
      startDate: "2026-06-05",
      endDate: "2026-06-04",
      reason: "Sickness",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["endDate"],
            message: "Ngày bắt đầu phải trước hoặc trùng ngày kết thúc",
          }),
        ]),
      );
    }
  });

  it("should fail if date range overlaps with approved dates", () => {
    const schema = EditLeaveRequestSchema(approvedDates, today);
    const result = schema.safeParse({
      leaveTypeId: "1",
      startDate: "2026-06-09",
      endDate: "2026-06-12",
      reason: "Sickness",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["startDate"],
            message: "Khoảng ngày nghỉ trùng với đơn đã được duyệt",
          }),
        ]),
      );
    }
  });

  it("should fail if reason is only whitespace", () => {
    const schema = EditLeaveRequestSchema(approvedDates, today);
    const result = schema.safeParse({
      leaveTypeId: "1",
      startDate: "2026-06-05",
      endDate: "2026-06-07",
      reason: "   ",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["reason"],
            message: "Lý do nghỉ không được chỉ chứa khoảng trắng",
          }),
        ]),
      );
    }
  });
});
