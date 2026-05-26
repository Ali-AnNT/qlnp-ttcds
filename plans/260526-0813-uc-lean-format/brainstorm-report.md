# Brainstorm Report: UC26-UC32 Lean Format Restructure

**Date:** 2026-05-26  
**Scope:** UC26-UC32 (contract supplement use cases)  
**Format:** Lean UC table format with full traceability  

## Problem

Current `usecase.md` / `uc.md` contain UC26-UC32 as raw contract text ("Em gửi thông tin UCXX còn thiếu theo hợp đồng") with no structure: no preconditions, no numbered steps, no alt flows, no business rules, no code traceability. Two identical files exist.

## Agreed Format

Each UC follows this structure:

```markdown
## UCXX: Ten use case

| Thuoc tinh | Gia tri |
|---|---|
| **ID** | UCXX |
| **Ten** | Ten use case |
| **Tac nhan** | Role1, Role2 |
| **Muc tieu** | 1-sentence goal |
| **Trang thai** | implemented \| partial \| not-started |

### KS chinh (Main Success Scenario)
1. Actor does X
2. System does Y
3. ...

### KS phu (Alternative Flows)
- **Na. Condition**: action → result
- ...

### Business Rules
- **BR-XX**: Rule description

### Trace
| Layer | Artifact |
|---|---|
| **Route** | `/path` |
| **API** | `VERB /api/endpoint` |
| **Feature** | `FeatureFolder/SubFolder` |
| **Entity** | `EntityName` |
| **Page** | `PageName.tsx` |
```

## Design Decisions

1. **Single file**: All UC26-UC32 in one `docs/usecase/usecase.md` (replace current content). Delete `uc.md` (duplicate).
2. **Vietnamese + English headers**: Section headers in Vietnamese with English in parentheses — matches contract language while being dev-readable.
3. **Status field**: `implemented | partial | not-started` — tracks implementation progress per UC, replaces deleted `usecase-checklist.md`.
4. **Traceability table**: Maps each UC to Route, API, Feature folder, Entity, Page — derived from actual codebase scan.
5. **Business rules**: Numbered BR-XX extracted from code logic (status machine, role checks, overlap check, business day calc).
6. **KS = Kịch bản**: Vietnamese term for "scenario" used consistently.

## UC26-UC32 Detail

### UC26: Gửi đơn xin nghỉ phép

| Thuoc tinh | Gia tri |
|---|---|
| **ID** | UC26 |
| **Ten** | Gửi đơn xin nghỉ phép |
| **Tac nhan** | CB.PCM, LD.PCM |
| **Muc tieu** | Tạo, chỉnh sửa, gửi, hủy đơn xin nghỉ phép |
| **Trang thai** | implemented |

#### KS chinh
1. CB.PCM chọn "Tạo đơn mới" từ trang `/leave/new`
2. Hệ thống hiển thị form: loại phép, ngày bắt đầu, ngày kết thúc, lý do
3. CB.PCM điền thông tin → nhấn Gửi
4. Hệ thống tính số ngày nghỉ (business days, T2-T6) → kiểm tra trùng lịch
5. Hệ thống tạo đơn (status=pending), ghi audit log
6. Hệ thống thông báo thành công, chuyển đến `/leave/my`

#### KS phu
- **3a. Chỉnh sửa đơn chưa duyệt**: CB.PCM sửa nội dung → lưu → quay bước 4
- **3b. Hủy đơn chưa duyệt**: CB.PCM hủy → status=cancelled
- **4a. Trùng lịch**: Hệ thống cảnh báo但仍 cho phép gửi (warning, không block)
- **4b. Khoảng thời gian không có ngày làm việc**: Hệ thống báo lỗi (TotalDays < 1)
- **5a. Dữ liệu không hợp lệ**: Hệ thống báo lỗi 409

#### Business Rules
- **BR-01**: Chỉ tính ngày làm việc (T2-T6) khi tính TotalDays
- **BR-02**: Trùng lịch kiểm tra với các đơn đã approved (status ∈ {approved_leader, approved_director})
- **BR-03**: Chỉ CB.PCM/LD.PCM có quyền tạo đơn
- **BR-04**: Chỉ người tạo mới được hủy đơn (owner check)
- **BR-05**: Chỉ hủy được đơn ở trạng thái pending hoặc approved_leader

#### Trace
| Layer | Artifact |
|---|---|
| **Route** | `/leave/new`, `/leave/my` |
| **API** | `POST /api/leave-requests`, `PUT /api/leave-requests/{id}`, `POST /api/leave-requests/{id}/cancel` |
| **Feature** | `LeaveRequests/Create`, `LeaveRequests/Update`, `LeaveRequests/Cancel`, `LeaveRequests/My` |
| **Entity** | `LeaveRequest`, `LeaveBalance`, `LeaveRequestAudit` |
| **Page** | `LeaveNewPage.tsx`, `LeaveMyPage.tsx` |

---

### UC27: Phê duyệt / từ chối đơn nghỉ phép

| Thuoc tinh | Gia tri |
|---|---|
| **ID** | UC27 |
| **Ten** | Phê duyệt / từ chối đơn nghỉ phép |
| **Tac nhan** | LD.PCM, GD.PGD |
| **Muc tieu** | LD.PCM phê duyệt cấp phòng, GD.PGD phê duyệt cấp giám đốc hoặc từ chối đơn |
| **Trang thai** | implemented |

#### KS chinh
1. LD.PCM/GD.PGD mở trang `/approval`
2. Hệ thống hiển thị danh sách đơn chờ xử lý
3. LD.PCM (cùng phòng, không phải đơn của mình) phê duyệt → status = approved_leader
4. GD.PGD phê duyệt → status = approved_director, cập nhật LeaveBalance
5. Hệ thống ghi audit log, thông báo kết quả

#### KS phu
- **3a. LD.PCM từ chối đơn pending**: Nhập lý do → status = rejected
- **4a. GD.PGD từ chối đơn approved_leader**: Nhập lý do → status = rejected
- **3b. LD.PCM duyệt đơn ngoài phòng**: Hệ thống trả về 403 Forbidden
- **3c. LD.PCM duyệt đơn của chính mình**: Hệ thống trả về 403 Forbidden
- **4b. Vượt định mức ngày phép**: Hệ thống báo lỗi 422 khi cập nhật balance

#### Business Rules
- **BR-06**: LD.PCM chỉ duyệt đơn của nhân viên cùng phòng (PhongBanId match), không duyệt đơn của chính mình
- **BR-07**: GD.PGD duyệt đơn ở status approved_leader, không kiểm tra phòng
- **BR-08**: Khi GD.PGD duyệt → tự động trừ ngày phép (UpsertBalanceAsync)
- **BR-09**: State machine: pending → approved_leader → approved_director; pending/approved_leader → rejected; pending/approved_leader → cancelled

#### Trace
| Layer | Artifact |
|---|---|
| **Route** | `/approval` |
| **API** | `POST /api/leave-requests/{id}/approve`, `POST /api/leave-requests/{id}/reject` |
| **Feature** | `LeaveRequests/Approve`, `LeaveRequests/Reject` |
| **Entity** | `LeaveRequest`, `LeaveConfig`, `LeaveBalance`, `LeaveRequestAudit` |
| **Page** | `ApprovalPage.tsx` |

---

### UC28: Theo dõi đơn nghỉ phép của cán bộ

| Thuoc tinh | Gia tri |
|---|---|
| **ID** | UC28 |
| **Ten** | Theo dõi đơn nghỉ phép của cán bộ |
| **Tac nhan** | GD.PGD, LD.PCM, CB.PCM |
| **Muc tieu** | Xem danh sách, trạng thái, lịch sử đơn và số ngày phép còn lại |
| **Trang thai** | implemented |

#### KS chinh
1. CB.PCM mở `/leave/my` → xem danh sách đơn của mình, lọc theo trạng thái
2. Hệ thống hiển thị danh sách + tổng ngày phép còn lại (LeaveBalance)
3. LD.PCM mở `/leave/my` → xem đơn của mình + `/calendar` lịch phòng
4. GD.PGD mở `/calendar` → xem lịch toàn trung tâm, lọc theo phòng ban

#### KS phu
- **1a. Xem chi tiết đơn**: Click đơn → xem đầy đủ thông tin (loại phép, ngày, lý do, trạng thái, người duyệt)
- **1b. Chỉnh sửa đơn chưa duyệt**: CB.PCM/LD.PCM sửa nội dung → quay UC26 bước 4
- **1c. Xóa đơn**: Không hỗ trợ xóa vĩnh viễn — chỉ hủy (status = cancelled)
- **2a. Xem ngày phép**: Tổng ngày phép = TotalDays, đã dùng = UsedDays, còn lại = TotalDays - UsedDays

#### Business Rules
- **BR-10**: CB.PCM chỉ xem đơn của mình; LD.PCM xem đơn phòng mình; GD.PGD xem tất cả
- **BR-11**: LeaveBalance lazy-seed: tự động tạo balance khi chưa có cho user/year/leaveType
- **BR-12**: Không xóa vĩnh viễn — chỉ chuyển status sang cancelled

#### Trace
| Layer | Artifact |
|---|---|
| **Route** | `/leave/my`, `/calendar` |
| **API** | `GET /api/leave-requests/my`, `GET /api/leave-requests`, `GET /api/leave-balances/my`, `GET /api/leave-balances` |
| **Feature** | `LeaveRequests/My`, `LeaveRequests/List`, `LeaveBalances/My`, `LeaveBalances/List` |
| **Entity** | `LeaveRequest`, `LeaveBalance`, `LeaveType` |
| **Page** | `LeaveMyPage.tsx`, `CalendarPage.tsx` |

---

### UC29: Theo dõi tổng hợp lịch nghỉ phép của trung tâm

| Thuoc tinh | Gia tri |
|---|---|
| **ID** | UC29 |
| **Ten** | Theo dõi tổng hợp lịch nghỉ phép của trung tâm |
| **Tac nhan** | GD.PGD |
| **Muc tieu** | Xem tổng hợp lịch nghỉ phép theo phòng ban, thống kê loại phép |
| **Trang thai** | partial |

#### KS chinh
1. GD.PGD mở `/summary`
2. Hệ thống hiển thị bảng tổng hợp theo phòng ban: số lượng đơn, tổng ngày nghỉ
3. GD.PGD click phòng ban → xem chi tiết từng nhân viên
4. Hệ thống hiển thị biểu đồ tròn phân bổ theo loại nghỉ phép
5. Lọc theo năm, loại phép

#### KS phu
- **2a. Lọc theo phòng ban**: Hiển thị lịch nghỉ phép của phòng ban cụ thể
- **3a. Xem thông tin cán bộ**: Click nhân viên → xem lịch sử nghỉ phép chi tiết
- **4a. Không có API chuyên biệt**: Summary page hiện tại dùng data từ LeaveRequests/List + LeaveBalances/List

#### Business Rules
- **BR-13**: Chỉ GD.PGD được xem tổng hợp toàn trung tâm
- **BR-14**: Lọc theo phòng ban dựa trên DM_DONVI.PhongBanId

#### Trace
| Layer | Artifact |
|---|---|
| **Route** | `/summary` |
| **API** | `GET /api/leave-requests`, `GET /api/leave-balances`, `GET /api/departments` |
| **Feature** | `LeaveRequests/List`, `LeaveBalances/List`, `Departments/List` (no dedicated Summary endpoint) |
| **Entity** | `LeaveRequest`, `LeaveBalance`, `LeaveType`, `DM_DONVI` |
| **Page** | `SummaryPage.tsx` |

---

### UC30: Cấu hình quy định nghỉ phép

| Thuoc tinh | Gia tri |
|---|---|
| **ID** | UC30 |
| **Ten** | Cấu hình quy định nghỉ phép |
| **Tac nhan** | QTHT |
| **Muc tieu** | Thiết lập ngày phép mặc định, chu kỳ, loại phép, cấp phê duyệt |
| **Trang thai** | implemented |

#### KS chinh
1. QTHT mở `/config`
2. Hệ thống hiển thị 3 tab: Cấu hình chung, Loại nghỉ phép (CRUD), Cấp phê duyệt
3. Tab Cấu hình chung: QTHT chỉnh chu kỳ năm, số ngày mặc định theo vai trò → lưu
4. Tab Loại nghỉ phép: QTHT tạo/sửa/xóa loại phép (tên, mã, số ngày mặc định, mô tả, isActive)
5. Tab Cấp phê duyệt: QTHT cấu hình cho từng loại phép: cấp duyệt (1 hoặc 2), vai trò người duyệt

#### KS phu
- **4a. Xóa loại phép đang được sử dụng**: Hệ thống báo lỗi (FK constraint từ LeaveRequests/LeaveBalances)
- **4b. Mã loại phép (Code) là duy nhất**: Validate unique constraint
- **5a. Cấu hình 1 cấp**: pending → approved_director (bỏ qua LD.PCM)
- **5b. Cấu hình 2 cấp**: pending → approved_leader → approved_director (qua LD.PCM rồi GD.PGD)

#### Business Rules
- **BR-15**: Chỉ QTHT được quyền cấu hình (role check: `QLNP.QTHT`)
- **BR-16**: LeaveType.Code là unique (unique index)
- **BR-17**: LeaveConfig.ApprovalLevel ≥ 1
- **BR-18**: Xóa LeaveType chỉ khi không có LeaveRequest/LeaveBalance tham chiếu

#### Trace
| Layer | Artifact |
|---|---|
| **Route** | `/config` |
| **API** | `GET/PUT /api/config`, `GET/POST /api/leave-types`, `PUT/DELETE /api/leave-types/{id}` |
| **Feature** | `Config/Get`, `Config/Update`, `LeaveTypes/List`, `LeaveTypes/Create`, `LeaveTypes/Update`, `LeaveTypes/Delete` |
| **Entity** | `LeaveConfig`, `LeaveType` |
| **Page** | `ConfigPage.tsx` |

---

### UC31: Thống kê báo cáo nghỉ phép

| Thuoc tinh | Gia tri |
|---|---|
| **ID** | UC31 |
| **Ten** | Thống kê báo cáo nghỉ phép |
| **Tac nhan** | GD.PGD |
| **Muc tieu** | Xem báo cáo tổng quan, theo phòng ban, loại phép, và xuất Excel |
| **Trang thai** | partial |

#### KS chinh
1. GD.PGD mở `/reports`
2. Hệ thống hiển thị KPI cards: tổng đơn, tổng ngày nghỉ, số nhân viên nghỉ
3. Biểu đồ cột theo phòng ban, biểu đồ tròn theo loại phép
4. GD.PGD lọc báo cáo theo tháng/quý, trạng thái đơn
5. GD.PGD nhấn "Xuất Excel" → hệ thống tải file `.xlsx`

#### KS phu
- **2a. Lọc theo trạng thái**: Đã duyệt, chưa duyệt, bị từ chối
- **3a. Click vào phòng ban**: Drill-down xem chi tiết nhân viên trong phòng
- **5a. Xuất Excel**: Backend tạo file `.xlsx` qua ClosedXML, trả về stream

#### Business Rules
- **BR-19**: Chỉ GD.PGD được xem báo cáo (role check: `QLNP.GD.PGD`)
- **BR-20**: File Excel tên format: `bao-cao-nghi-phep-{yyyyMMdd}.xlsx`
- **BR-21**: Dữ liệu báo cáo lấy từ LeaveRequests + LeaveBalances + DM_DONVI

#### Trace
| Layer | Artifact |
|---|---|
| **Route** | `/reports` |
| **API** | `GET /api/reports/export` |
| **Feature** | `Reports/Export` (ExcelBuilder, ClosedXML) |
| **Entity** | `LeaveRequest`, `LeaveBalance`, `LeaveType`, `DM_DONVI` |
| **Page** | `ReportsPage.tsx` |

---

### UC32: Theo dõi số lượng ngày nghỉ phép vượt mức quy định

| Thuoc tinh | Gia tri |
|---|---|
| **ID** | UC32 |
| **Ten** | Theo dõi vượt mức quy định |
| **Tac nhan** | GD.PGD |
| **Muc tieu** | Phát hiện cán bộ/phòng ban có số ngày nghỉ vượt mức, phân loại theo lý do |
| **Trang thai** | not-started |

#### KS chinh
1. GD.PGD mở `/violations`
2. Hệ thống hiển thị bảng cán bộ vượt mức: tên, phòng ban, số ngày vượt, loại phép
3. GD.PGD lọc theo tháng/quý
4. Biểu đồ phân loại theo lý do nghỉ (bệnh, thai sản, công tác...)
5. Bảng tổng hợp theo phòng ban: tổng ngày vượt mức của cả phòng

#### KS phu
- **2a. Click cán bộ**: Xem chi tiết lịch sử nghỉ phép của cán bộ đó
- **3a. Lọc theo phòng ban**: Chỉ hiển thị cán bộ trong phòng cụ thể
- **5a. Xuất báo cáo**: (chưa có API)

#### Business Rules
- **BR-22**: Vượt mức = UsedDays > TotalDays trong LeaveBalance
- **BR-23**: GD.PGD xem tất cả; không có phân quyền theo phòng
- **BR-24**: Mặc định ngưỡng = 12 ngày/năm (từ LeaveConfig hoặc hardcode)

#### Trace
| Layer | Artifact |
|---|---|
| **Route** | `/violations` |
| **API** | (chưa có API chuyên biệt — cần tạo) |
| **Feature** | (chưa có — cần tạo `Violations/List`) |
| **Entity** | `LeaveBalance`, `LeaveConfig`, `DM_DONVI` |
| **Page** | `ViolationsPage.tsx` |

---

## Implementation Status Summary

| UC | Ten | Trang thai | Notes |
|----|-----|-----------|-------|
| UC26 | Gửi đơn xin nghỉ phép | ✅ implemented | Create/Update/Cancel/My endpoints |
| UC27 | Phê duyệt/từ chối | ✅ implemented | Approve/Reject với role-based state machine |
| UC28 | Theo dõi đơn nghỉ phép | ✅ implemented | My/List/Calendar + LeaveBalances |
| UC29 | Tổng hợp lịch nghỉ phép | ⚠️ partial | Page exists, no dedicated API |
| UC30 | Cấu hình quy định | ✅ implemented | Config CRUD + LeaveTypes CRUD |
| UC31 | Thống kê báo cáo | ⚠️ partial | Export Excel exists, KPI/charts frontend-side |
| UC32 | Vượt mức quy định | ❌ not-started | Page stub only, no backend API |

## Next Steps

1. Write the final `docs/usecase/usecase.md` using this format
2. Delete `docs/usecase/uc.md` (duplicate)
3. Consider recreating `docs/usecase/usecase-checklist.md` with status tracking per UC (replaces deleted checklist)