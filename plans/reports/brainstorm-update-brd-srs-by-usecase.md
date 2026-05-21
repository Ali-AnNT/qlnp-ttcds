# Brainstorm: Update BRD & SRS theo Usecase thực tế

**Date:** 2026-05-20
**Status:** Approved
**Approach:** Incremental upgrade (Approach A)

---

## Problem Statement

BRD và SRS hiện tại không bao phủ đầy đủ các use case thực tế trong `docs/usecase/usecase.md`. Cần cập nhật cả hai tài liệu để đảm bảo alignment 100%.

## Gap Analysis

| Gap | Usecase yêu cầu | BRD/SRS hiện tại | Quyết định |
|-----|-----------------|-------------------|------------|
| LĐ.PCM sửa đơn | LĐ.PCM có thể chỉnh sửa đơn trong phòng | Chỉ CB.PCM (owner) được sửa | Cho phép LĐ.PCM sửa đơn pending trong phòng |
| Xóa vs Hủy đơn | LĐ.PCM/CB.PCM "xóa đơn" | Chỉ có cancel (soft) | Giữ soft-cancel, không hard-delete |
| Approver cập nhật đơn | GĐ/PGĐ, LĐ.PCM cập nhật thông tin đơn | Không có | Cho phép cập nhật + audit log |
| Export format | Xuất Excel | CSV | Đổi sang .xlsx có formatting |
| Filter báo cáo theo trạng thái | Lọc theo trạng thái (đã duyệt, chưa duyệt, bị từ chối) | Không có | Thêm filter theo status |
| Báo cáo tháng/quý | Xem báo cáo theo tháng/quý | Không có | Thêm period filter (monthly/quarterly) |
| Lịch sử đơn | Xem lịch sử các đơn đã gửi | Chỉ filter status | Thêm dedicated history view |
| LĐ.PCM xem đơn phòng | LĐ.PCM tìm kiếm theo tiêu chí | Chỉ filter role-based | Thêm search + filter nâng cao |

## Decisions Made

1. **Hủy (soft-cancel)** - Không hard-delete, giữ audit trail
2. **LĐ.PCM sửa đơn** - Được sửa đơn pending trong phòng, giống CB.PCM sửa đơn của mình
3. **Export Excel (.xlsx)** - Có formatting (bold header, auto-width, filter)
4. **Approver cập nhật đơn** - Cho phép với audit log (ai sửa, trường gì, giá trị cũ/mới)

## Thay đổi chi tiết

### BRD Updates

**Section 3.1 - Business Requirements:**
- BR-001: Bổ sung LĐ.PCM sửa đơn trong phòng
- Thêm BR-007: Approver có thể cập nhật nội dung đơn (kèm audit log)
- Thêm BR-008: Export báo cáo dạng Excel (.xlsx)

**Section 5 - Functional Requirements:**
- FR-04: Mở rộng cho LĐ.PCM sửa đơn pending trong phòng
- FR-05: Thêm approver update capability
- FR-07: Thêm filter theo trạng thái
- FR-08: Đổi CSV → Excel, thêm filter tháng/quý
- Thêm FR-11: Lịch sử đơn nghỉ phép

**Section 7 - Business Rules:**
- BRULE-007: Mở rộng cho LĐ.PCM sửa đơn trong phòng
- Thêm BRULE-010: Audit log cho mọi thay đổi đơn
- Thêm BRULE-011: History tracking cho đơn nghỉ phép

### SRS Updates

**FR-04 (Danh Sách Đơn Của Tôi):**
- FR-04.3: Mở rộng - LĐ.PCM sửa đơn pending trong phòng
- Thêm FR-04.6: History view - tab/filter xem lịch sử đơn đã gửi

**FR-05 (Phê Duyệt):**
- Thêm FR-05.7: Approver cập nhật nội dung đơn (ngày, lý do) với audit log
- Thêm FR-05.8: Audit log hiển thị lịch sử thay đổi (trường, giá trị cũ/mới, người sửa, thời điểm)

**FR-07 (Tổng Hợp):**
- Thêm FR-07.8: Filter theo trạng thái đơn (chưa duyệt, đã duyệt, bị từ chối)

**FR-08 (Báo Cáo):**
- FR-08.4: Đổi CSV → Excel (.xlsx) có formatting
- Thêm FR-08.5: Filter theo trạng thái đơn
- Thêm FR-08.6: Báo cáo theo tháng/quý (period selector)

**FR-11 (Mới) - Lịch Sử Đơn Nghỉ Phép:**
- FR-11.1: CB.PCM xem lịch sử đơn của mình, LĐ.PCM xem của phòng, GĐ/PGĐ xem tất cả
- FR-11.2: Filter theo khoảng thời gian, trạng thái, loại phép
- FR-11.3: Mỗi lần thay đổi đơn (sửa, cập nhật bởi approver) được ghi nhận đầy đủ

**Access Matrix - Cập nhật:**
- LĐ.PCM: thêm "Sửa đơn phòng (pending)"
- GĐ/PGĐ/LĐ.PCM: thêm "Cập nhật nội dung đơn (khi phê duyệt)"

**State Transitions - Không đổi** (cancel vẫn là cancel, không thêm delete state)

### Không thay đổi
- FR-01 (Auth), FR-02 (Dashboard), FR-06 (Calendar), FR-09 (Violations), FR-10 (Config)
- Database schema chính (chỉ thêm bảng AuditLog nếu cần)
- API endpoints chính (chỉ thêm parameters/queries)