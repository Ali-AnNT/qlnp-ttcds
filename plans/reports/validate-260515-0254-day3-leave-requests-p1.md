# Validation Report: Day 3 — LeaveRequests P1

**Plan:** `plans/260515-0233-day3-leave-requests-p1/plan.md`  
**Date:** 2026-05-15  
**Status:** REVISED — All criticals addressed, 1 unresolved question

---

## Issues Resolution Summary

| ID | Severity | Issue | Status | Fix Applied |
|----|----------|-------|--------|-------------|
| C1 | CRITICAL | Role strings sai ("nhanvien"/"lanhdao") | **FIXED** | Đổi → `CB.PCM`, `LD.PCM`, `GD.PGD`, `QTHT` theo BRD §2.2. Seed data + LeaveTypes `Roles("quantri")` → `Roles("QTHT")` |
| C2 | CRITICAL | TenPhongBan không tồn tại trên UserMaster | **FIXED** | Đổi DTO field → `DonViName`, join qua `UserMaster.DonVi → DmDonvi.TenDonVi` |
| C3 | CRITICAL | Mapper.cs thiếu | **FIXED** | Thêm `Mapper.cs` vào Create + Update, mapping pattern nhất quán LeaveTypes |
| C4 | CRITICAL | Không có nav prop UserMaster → DmDonvi | **FIXED** | Thêm nav prop + FK config trong Phase 1 |
| M1 | MODERATE | PhongBanId nullable | **ACCEPTED** | Null = không thấy trong LD.PCM view (per user decision) |
| M2 | MODERATE | Status initialization | **ACCEPTED** | Explicit `Status = "pending"` trong mapper |
| M3 | MODERATE | RequestedApproverId nav prop | **FIXED** | Thêm `RequestedApprover` nav prop + FK config |

## Phase Files Updated

- `plan.md` — thêm Key Decisions về role strings
- `phase-01-setup-migration-and-shared.md` — thêm nav props, FK configs, role seed, LeaveTypes role rename
- `phase-02-list-endpoint.md` — DTO field rename, join DmDonvi, role strings
- `phase-03-create-endpoint.md` — Mapper.cs, role strings `"CB.PCM"`/`"LD.PCM"`, DTO mapping qua DonVi
- `phase-04-update-endpoint.md` — Mapper.cs, role strings, DTO mapping

## Unresolved Questions

1. **"quantri" → "QTHT" breaking change?** Existing JWT tokens chứa `role: "quantri"` sẽ không match `Roles("QTHT")`. Cần:
   - Transitional middleware mapping (chấp nhận cả 2 string) HOẶC
   - Re-generate token sau khi deploy
   - Đây là quyết định ops, không blocking cho plan