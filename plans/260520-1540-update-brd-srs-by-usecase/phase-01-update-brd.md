---
phase: 1
title: Update BRD
status: completed
priority: P2
effort: 1h
dependencies: []
---

# Phase 1: Update BRD

## Overview

Cập nhật `docs/vision/brd.md` để bổ sung các yêu cầu nghiệp vụ từ use case thực tế mà BRD hiện tại chưa bao phủ.

## Requirements

- Functional: Bổ sung BR cho LĐ.PCM sửa đơn, approver cập nhật đơn, export Excel, filter nâng cao
- Non-functional: Giữ nguyên cấu trúc BRD, chỉ thêm/sửa nội dung tại các section liên quan

## Architecture

Incremental update — thêm/sửa tại chỗ trong BRD hiện tại, không viết lại.

## Related Code Files

- Modify: `docs/vision/brd.md`

## Implementation Steps

1. **Section 3.1 - Business Requirements table:**
   - BR-001: Thêm "LĐ.PCM có thể chỉnh sửa đơn trong phòng khi chưa duyệt"
   - Thêm BR-007: "Approver (LĐ.PCM, GĐ/PGĐ) có thể cập nhật thông tin đơn nghỉ phép trong quá trình phê duyệt, kèm audit log"
   - Thêm BR-008: "Hỗ trợ xuất báo cáo nghỉ phép ra file Excel (.xlsx) có formatting"

2. **Section 5.1 - Auth:** Không đổi

3. **Section 5.5 - Leave Requests (Core):**
   - FR-042 (Cập nhật đơn): Mở rộng mô tả — thêm "LĐ.PCM có thể sửa đơn pending trong phòng mình quản lý"
   - FR-045 (Hủy đơn): Giữ nguyên "cancel" (soft), không thêm hard-delete. Clarify: CB.PCM hủy đơn của mình, LĐ.PCM hủy đơn pending trong phòng

4. **Section 5.6 - Leave Balances:** Không đổi

5. **Section 5.5 - Leave Requests (tiếp):**
   - Thêm FR-046: "LĐ.PCM, GĐ/PGĐ có thể cập nhật nội dung đơn (ngày, lý do) khi phê duyệt, lưu audit log"
   - Thêm FR-047: "Xem lịch sử đơn nghỉ phép: CB.PCM xem của mình, LĐ.PCM xem của phòng, GĐ/PGĐ xem tất cả"

6. **Section 5.4 - Leave Types:** Không đổi

7. **Appendix B - API Endpoints Summary:**
   - Thêm `PUT /api/leave-requests/{id}/update-by-approver` cho approver cập nhật đơn
   - Thêm `GET /api/leave-requests/history` cho history view
   - Cập nhật export endpoint: `GET /api/reports/export` thay cho CSV

8. **Section 7 - Business Rules:**
   - BRULE-007: Mở rộng — "Chỉ sửa được khi status = pending. LĐ.PCM có thể sửa đơn pending trong phòng mình quản lý ngoài owner (CB.PCM)"
   - Thêm BRULE-010: "Mọi thay đổi nội dung đơn (sửa bởi owner hoặc cập nhật bởi approver) phải được ghi nhận audit log: ai sửa, trường gì, giá trị cũ/mới, thời điểm"
   - Thêm BRULE-011: "Hệ thống lưu lịch sử đầy đủ các đơn nghỉ phép theo role: CB.PCM xem của mình, LĐ.PCM xem của phòng, GĐ/PGĐ xem tất cả"

9. **Section 9 - Acceptance Criteria:**
   - Thêm AC-017: "LĐ.PCM sửa đơn pending trong phòng → status vẫn pending, audit log ghi nhận thay đổi"
   - Thêm AC-018: "Approver cập nhật nội dung đơn khi phê duyệt → audit log ghi nhận"
   - Thêm AC-019: "Export báo cáo ra Excel (.xlsx) mở được trong Excel, có bold header, auto-width, filter"
   - Thêm AC-020: "History view hiển thị đúng theo role: CB.PCM thấy của mình, LĐ.PCM thấy của phòng, GĐ/PGĐ thấy tất cả"
   - Thêm AC-021: "Báo cáo lọc theo trạng thái (đã duyệt, chưa duyệt, bị từ chối) trả về kết quả đúng"

## Success Criteria

- [ ] BR-001 updated with LĐ.PCM edit scope
- [ ] BR-007 (approver update + audit log) added
- [ ] BR-008 (Excel export) added
- [ ] FR-042 expanded for LĐ.PCM
- [ ] FR-046 (approver update) added
- [ ] FR-047 (history view) added
- [ ] Appendix B updated with new endpoints
- [ ] BRULE-007 expanded
- [ ] BRULE-010 (audit log) added
- [ ] BRULE-011 (history tracking) added
- [ ] AC-017 through AC-021 added

## Risk Assessment

- Low risk: Document-only changes, no code impact
- Ensure consistent terminology between BRD and SRS

## Next Steps

- Phase 2 depends on Phase 1 completion (BRD provides input for SRS)
