---
phase: 2
title: Update SRS
status: completed
priority: P2
effort: 1.5h
dependencies:
  - '1'
---

# Phase 2: Update SRS

## Overview

Cập nhật `docs/vision/srs.md` để bổ sung chi tiết kỹ thuật cho các yêu cầu mới từ BRD đã update ở Phase 1.

## Requirements

- Functional: Mở rộng FR-04, FR-05, FR-07, FR-08; thêm FR-11 (Lịch sử đơn); cập nhật Access Matrix, Business Rules
- Non-functional: Giữ nguyên cấu trúc SRS, chỉ thêm/sửa tại chỗ

## Architecture

Incremental update — thêm/sửa tại chỗ trong SRS hiện tại, không viết lại.

## Related Code Files

- Modify: `docs/vision/srs.md`

## Implementation Steps

1. **Section 2.2 - User Roles & Access Matrix:**
   - Thêm row "Sửa đơn phòng (pending)" cho LĐ.PCM
   - Thêm row "Cập nhật nội dung đơn (phê duyệt)" cho LĐ.PCM và GĐ/PGĐ
   - Thêm row "Xem lịch sử đơn" cho CB.PCM (của mình), LĐ.PCM (của phòng), GĐ/PGĐ (tất cả)

2. **FR-04 (Danh Sách Đơn Của Tôi):**
   - FR-04.3: Mở rộng — "Sửa đơn (chỉ khi status = pending): CB.PCM sửa đơn của mình, LĐ.PCM sửa đơn pending trong phòng mình quản lý"
   - Thêm FR-04.6: "History view: tab/filter riêng xem lịch sử tất cả đơn đã gửi, bao gồm audit log các thay đổi"

3. **FR-05 (Phê Duyệt):**
   - Thêm FR-05.7: "Approver (LĐ.PCM, GĐ/PGĐ) có thể cập nhật nội dung đơn (ngày bắt đầu/kết thúc, lý do) khi phê duyệt. Mọi thay đổi lưu audit log: người sửa, trường thay đổi, giá trị cũ, giá trị mới, thời điểm"
   - Thêm FR-05.8: "Hiển thị audit log trong chi tiết đơn: danh sách các thay đổi, ai sửa, khi nào, giá trị cũ → mới"

4. **FR-07 (Tổng Hợp Lịch Nghỉ):**
   - Thêm FR-07.8: "Lọc theo trạng thái đơn: chưa duyệt (pending), đã duyệt (approved_leader + approved_director), bị từ chối (rejected)"

5. **FR-08 (Báo Cáo Thống Kê):**
   - FR-08.4: Đổi "Export CSV" → "Export Excel (.xlsx): bold header, auto-width columns, auto-filter, UTF-8"
   - Thêm FR-08.5: "Lọc báo cáo theo trạng thái đơn: đã duyệt, chưa duyệt, bị từ chối"
   - Thêm FR-08.6: "Báo cáo theo tháng/quý: selector chọn kỳ (tháng, quý, năm), aggregate số liệu theo kỳ đã chọn"

6. **FR-11 (Mới) - Lịch Sử Đơn Nghỉ Phép:**
   - FR-11.1: "CB.PCM xem lịch sử đơn của mình, LĐ.PCM xem của phòng, GĐ/PGĐ xem tất cả — role-based filtering"
   - FR-11.2: "Filter theo: khoảng thời gian (từ ngày → đến ngày), trạng thái (pending/approved_leader/approved_director/rejected/cancelled), loại phép"
   - FR-11.3: "Mỗi lần thay đổi đơn (sửa bởi owner, cập nhật bởi approver) được ghi nhận: trường thay đổi, giá trị cũ, giá trị mới, người thực hiện, thời điểm"
   - FR-11.4: "Route: /leave/history, component: LeaveHistoryPage, access: AuthGuard (all roles, role-filtered)"

7. **Section 4.2 - Database Tables:**
   - Thêm bảng `LeaveRequestAudits`: Id, LeaveRequestId (FK), ChangedBy (FK USER_MASTER), ChangedAt, FieldName, OldValue, NewValue
   - Hoặc thêm vào note: "Audit log có thể implement bằng EF Core shadow properties hoặc bảng riêng tùy implementation"

8. **Section 4.4 - Data Validation Rules:**
   - Thêm rule: "LĐ.PCM chỉ sửa đơn trong phòng mình (PhongBanId match)" — validation ở endpoint level
   - Thêm rule: "Approver cập nhật đơn chỉ khi đơn ở status pending hoặc approved_leader" — validation ở endpoint level

9. **Section 7.1 - Route Map:**
   - Thêm: `/leave/history | LeaveHistoryPage | AuthGuard (all roles, role-filtered)`

10. **Section 7.2 - State Transitions:**
    - Không đổi — cancel vẫn là cancel, không thêm delete state

11. **Section 7.3 - Backend Structure:**
    - Thêm: `Features/LeaveRequests/UpdateByApprover/UpdateByApproverEndpoint.cs`
    - Thêm: `Features/LeaveRequests/History/ListHistoryEndpoint.cs`
    - Thêm: `Entities/LeaveRequestAudit.cs`
    - Thêm: `Features/Reports/Export/ExportEndpoint.cs` (thay CSV)

12. **Section 6.1 - Verification Matrix:**
    - Thêm: "FR-11 | Integration | Load history page per role | CB.PCM thấy đơn của mình, LĐ.PCM thấy đơn phòng, GĐ/PGĐ thấy tất cả"
    - Cập nhật: "FR-08 | Manual + Integration | Export Excel, filter status, period selector | File .xlsx mở được trong Excel, số liệu khớp"

13. **Section 6.3 - Known Gaps:**
    - Thêm: "Audit log chưa có UI dedicated — chỉ hiển thị trong chi tiết đơn" | LOW | "Tạo trang audit log riêng nếu cần"
    - Cập nhật: "Không có pagination server-side" → thêm note "History view và reports cần pagination khi data lớn"

## Success Criteria

- [ ] Access Matrix updated with new rows for LĐ.PCM edit, approver update, history
- [ ] FR-04.3 expanded for LĐ.PCM
- [ ] FR-04.6 (history view) added
- [ ] FR-05.7 (approver update) added
- [ ] FR-05.8 (audit log display) added
- [ ] FR-07.8 (status filter) added
- [ ] FR-08.4 changed from CSV to Excel
- [ ] FR-08.5 (status filter in reports) added
- [ ] FR-08.6 (month/quarter reports) added
- [ ] FR-11 (history page) added with all sub-requirements
- [ ] Database tables note for LeaveRequestAudits added
- [ ] Validation rules updated for LĐ.PCM scope
- [ ] Route map updated with /leave/history
- [ ] Backend structure updated with new endpoints
- [ ] Verification matrix and known gaps updated

## Risk Assessment

- Medium risk: SRS changes may affect implementation plan — ensure backward compatibility with existing code
- Ensure FR numbering is sequential and doesn't conflict with existing IDs
- New database table (LeaveRequestAudits) needs migration consideration

## Next Steps

- Phase 3 will verify BRD/SRS consistency
