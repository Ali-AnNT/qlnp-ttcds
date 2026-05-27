# Use Cases: Quản lý nghỉ phép (UC26–UC32)

> Use cases bổ sung theo hợp đồng. Định dạng Lean UC: mục tiêu, kịch bản, quy tắc nghiệp vụ, traceability.

---

## UC26: Gửi đơn xin nghỉ phép

| Thuộc tính | Giá trị |
|---|---|
| **ID** | UC26 |
| **Tên** | Gửi đơn xin nghỉ phép |
| **Tác nhân** | CB.PCM, LD.PCM |
| **Mục tiêu** | Tạo, chỉnh sửa, gửi, hủy đơn xin nghỉ phép |
| **Trạng thái** | ✅ implemented |

### KS chính (Main Success Scenario)

1. CB.PCM chọn "Tạo đơn mới" từ trang `/leave/new`
2. Hệ thống hiển thị form: loại phép, ngày bắt đầu, ngày kết thúc, lý do
3. CB.PCM điền thông tin → nhấn Gửi
4. Hệ thống tính số ngày nghỉ (business days, T2-T6) → kiểm tra trùng lịch
5. Hệ thống tạo đơn (status=pending), ghi audit log
6. Hệ thống thông báo thành công, chuyển đến `/leave/my`

### KS phụ (Alternative Flows)

- **3a. Chỉnh sửa đơn chưa duyệt**: CB.PCM sửa nội dung → lưu → quay bước 4
- **3b. Hủy đơn chưa duyệt**: CB.PCM hủy → status=cancelled
- **4a. Trùng lịch**: Hệ thống cảnh báo nhưng vẫn cho phép gửi (warning, không block)
- **4b. Khoảng thời gian không có ngày làm việc**: Hệ thống báo lỗi (TotalDays < 1)
- **5a. Dữ liệu không hợp lệ**: Hệ thống báo lỗi 409

### Business Rules

- **BR-01**: Chỉ tính ngày làm việc (T2-T6) khi tính TotalDays
- **BR-02**: Trùng lịch kiểm tra với các đơn đã approved (status = approved)
- **BR-03**: Chỉ CB.PCM/LD.PCM có quyền tạo đơn
- **BR-04**: Chỉ người tạo mới được hủy đơn (owner check)
- **BR-05**: Chỉ hủy được đơn ở trạng thái pending. Hủy đơn đã approved sẽ hoàn trả ngày phép (UsedDays −= TotalDays)

### Trace

| Layer | Artifact |
|---|---|
| **Route** | `/leave/new`, `/leave/my` |
| **API** | `POST /api/leave-requests`, `PUT /api/leave-requests/{id}`, `POST /api/leave-requests/{id}/cancel` |
| **Feature** | `LeaveRequests/Create`, `LeaveRequests/Update`, `LeaveRequests/Cancel`, `LeaveRequests/My` |
| **Entity** | `LeaveRequest`, `LeaveBalance`, `LeaveRequestAudit` |
| **Page** | `LeaveNewPage.tsx`, `LeaveMyPage.tsx` |

---

## UC27: Phê duyệt / từ chối đơn nghỉ phép

| Thuộc tính | Giá trị |
|---|---|
| **ID** | UC27 |
| **Tên** | Phê duyệt / từ chối đơn nghỉ phép |
| **Tác nhân** | LD.PCM, GD.PGD |
| **Mục tiêu** | Duyệt hoặc từ chối đơn nghỉ phép — theo cấu hình 1 hoặc 2 cấp duyệt cho mỗi loại phép |
| **Trạng thái** | ✅ implemented |

### KS chính (Main Success Scenario)

1. LD.PCM hoặc GD.PGD mở trang `/approval`
2. Hệ thống hiển thị danh sách đơn ở trạng thái pending
3. Hệ thống xác định cấp phê duyệt từ LeaveConfig.ApprovalLevel của loại nghỉ phép:
   - **1 cấp** (chỉ ApprovalLevel=1): LD.PCM cùng phòng hoặc GD.PGD duyệt → status = approved
   - **2 cấp** (ApprovalLevel=1 + ApprovalLevel=2): LD.PCM cùng phòng duyệt → status = approved_leader, sau đó GD.PGD duyệt → status = approved
4. Khi duyệt → tự động trừ ngày phép (UsedDays += TotalDays)
5. Hệ thống ghi audit log, thông báo kết quả

### KS phụ (Alternative Flows)

- **3a. LD.PCM từ chối đơn cấp 1**: Nhập lý do → status = rejected
- **3b. GD.PGD từ chối đơn cấp 2**: Nhập lý do → status = rejected
- **3c. LD.PCM duyệt đơn ngoài phòng**: Hệ thống trả về 403 Forbidden
- **3d. LD.PCM duyệt đơn của chính mình**: Hệ thống trả về 403 Forbidden
- **3e. Vượt định mức ngày phép**: Hệ thống báo lỗi 422 khi cập nhật balance

### Business Rules

- **BR-06**: Cấp phê duyệt được xác định bởi LeaveConfig.ApprovalLevel theo loại nghỉ phép
- **BR-07**: Cấp 1 — LD.PCM duyệt đơn của nhân viên cùng phòng (PhongBanId match), không duyệt đơn của chính mình
- **BR-08**: Cấp 2 — GD.PGD duyệt đơn bất kỳ, không kiểm tra phòng
- **BR-09**: Khi duyệt (bất kỳ cấp) → tự động trừ ngày phép (UpsertBalanceAsync)
- **BR-10**: State machine: pending → approved_leader | approved | rejected; approved_leader → approved | rejected | cancelled; approved → cancelled (hoàn trả UsedDays); pending → cancelled

### Trace

| Layer | Artifact |
|---|---|
| **Route** | `/approval` |
| **API** | `POST /api/leave-requests/{id}/approve`, `POST /api/leave-requests/{id}/reject` |
| **Feature** | `LeaveRequests/Approve`, `LeaveRequests/Reject` |
| **Entity** | `LeaveRequest`, `LeaveConfig`, `LeaveBalance`, `LeaveRequestAudit` |
| **Page** | `ApprovalPage.tsx` |

---

## UC28: Theo dõi đơn nghỉ phép của cán bộ

| Thuộc tính | Giá trị |
|---|---|
| **ID** | UC28 |
| **Tên** | Theo dõi đơn nghỉ phép của cán bộ |
| **Tác nhân** | GD.PGD, LD.PCM, CB.PCM |
| **Mục tiêu** | Xem danh sách, trạng thái, lịch sử đơn và số ngày phép còn lại |
| **Trạng thái** | ✅ implemented |

### KS chính (Main Success Scenario)

1. CB.PCM mở `/leave/my` → xem danh sách đơn của mình, lọc theo trạng thái
2. Hệ thống hiển thị danh sách + tổng ngày phép còn lại (LeaveBalance)
3. LD.PCM mở `/leave/my` → xem đơn của mình + `/calendar` lịch phòng
4. GD.PGD mở `/calendar` → xem lịch toàn trung tâm, lọc theo phòng ban

### KS phụ (Alternative Flows)

- **1a. Xem chi tiết đơn**: Click đơn → xem đầy đủ thông tin (loại phép, ngày, lý do, trạng thái, người duyệt)
- **1b. Chỉnh sửa đơn chưa duyệt**: CB.PCM/LD.PCM sửa nội dung → quay UC26 bước 4
- **1c. Xóa đơn**: Không hỗ trợ xóa vĩnh viễn — chỉ hủy (status = cancelled)
- **2a. Xem ngày phép**: Tổng ngày phép = TotalDays, đã dùng = UsedDays, còn lại = TotalDays − UsedDays

### Business Rules

- **BR-10**: CB.PCM chỉ xem đơn của mình; LD.PCM xem đơn phòng mình; GD.PGD xem tất cả
- **BR-11**: LeaveBalance lazy-seed: tự động tạo balance khi chưa có cho user/year/leaveType
- **BR-12**: Không xóa vĩnh viễn — chỉ chuyển status sang cancelled

### Trace

| Layer | Artifact |
|---|---|
| **Route** | `/leave/my`, `/calendar` |
| **API** | `GET /api/leave-requests/my`, `GET /api/leave-requests`, `GET /api/leave-balances/my`, `GET /api/leave-balances` |
| **Feature** | `LeaveRequests/My`, `LeaveRequests/List`, `LeaveBalances/My`, `LeaveBalances/List` |
| **Entity** | `LeaveRequest`, `LeaveBalance`, `LeaveType` |
| **Page** | `LeaveMyPage.tsx`, `CalendarPage.tsx` |

---

## UC29: Theo dõi tổng hợp lịch nghỉ phép của trung tâm

| Thuộc tính | Giá trị |
|---|---|
| **ID** | UC29 |
| **Tên** | Theo dõi tổng hợp lịch nghỉ phép của trung tâm |
| **Tác nhân** | GD.PGD |
| **Mục tiêu** | Xem tổng hợp lịch nghỉ phép theo phòng ban, thống kê loại phép |
| **Trạng thái** | ⚠️ partial |

### KS chính (Main Success Scenario)

1. GD.PGD mở `/summary`
2. Hệ thống hiển thị bảng tổng hợp theo phòng ban: số lượng đơn, tổng ngày nghỉ
3. GD.PGD click phòng ban → xem chi tiết từng nhân viên
4. Hệ thống hiển thị biểu đồ tròn phân bổ theo loại nghỉ phép
5. Lọc theo năm, loại phép

### KS phụ (Alternative Flows)

- **2a. Lọc theo phòng ban**: Hiển thị lịch nghỉ phép của phòng ban cụ thể
- **3a. Xem thông tin cán bộ**: Click nhân viên → xem lịch sử nghỉ phép chi tiết
- **4a. Không có API chuyên biệt**: Summary page hiện tại dùng data từ LeaveRequests/List + LeaveBalances/List

### Business Rules

- **BR-13**: Chỉ GD.PGD được xem tổng hợp toàn trung tâm
- **BR-14**: Lọc theo phòng ban dựa trên DM_DONVI.PhongBanId

### Trace

| Layer | Artifact |
|---|---|
| **Route** | `/summary` |
| **API** | `GET /api/leave-requests`, `GET /api/leave-balances`, `GET /api/departments` |
| **Feature** | `LeaveRequests/List`, `LeaveBalances/List`, `Departments/List` (no dedicated Summary endpoint) |
| **Entity** | `LeaveRequest`, `LeaveBalance`, `LeaveType`, `DM_DONVI` |
| **Page** | `SummaryPage.tsx` |

---

## UC30: Cấu hình quy định nghỉ phép

| Thuộc tính | Giá trị |
|---|---|
| **ID** | UC30 |
| **Tên** | Cấu hình quy định nghỉ phép |
| **Tác nhân** | QTHT |
| **Mục tiêu** | Thiết lập ngày phép mặc định, chu kỳ, loại phép, cấp phê duyệt |
| **Trạng thái** | ✅ implemented |

### KS chính (Main Success Scenario)

1. QTHT mở `/config`
2. Hệ thống hiển thị 3 tab: Cấu hình chung, Loại nghỉ phép (CRUD), Cấp phê duyệt
3. Tab Cấu hình chung: QTHT chỉnh chu kỳ năm, số ngày mặc định theo vai trò → lưu
4. Tab Loại nghỉ phép: QTHT tạo/sửa/xóa loại phép (tên, mã, số ngày mặc định, mô tả, isActive)
5. Tab Cấp phê duyệt: QTHT cấu hình cho từng loại phép: cấp duyệt (1 = LD.PCM, 2 = GD.PGD), vai trò người duyệt

### KS phụ (Alternative Flows)

- **4a. Xóa loại phép đang được sử dụng**: Hệ thống báo lỗi (FK constraint từ LeaveRequests/LeaveBalances)
- **4b. Mã loại phép (Code) là duy nhất**: Validate unique constraint
- **5a. Cấu hình cấp phê duyệt**: 1 cấp (chỉ ApprovalLevel=1) → LD.PCM/GD.PGD duyệt một lần → approved. 2 cấp (ApprovalLevel=1 + 2) → LD.PCM duyệt → approved_leader, GD.PGD duyệt → approved

### Business Rules

- **BR-15**: Chỉ QTHT được quyền cấu hình (role check: `QLNP.QTHT`)
- **BR-16**: LeaveType.Code là unique (unique index)
- **BR-17**: LeaveConfig.ApprovalLevel ≥ 1
- **BR-18**: Xóa LeaveType chỉ khi không có LeaveRequest/LeaveBalance tham chiếu

### Trace

| Layer | Artifact |
|---|---|
| **Route** | `/config` |
| **API** | `GET/PUT /api/config`, `GET/POST /api/leave-types`, `PUT/DELETE /api/leave-types/{id}` |
| **Feature** | `Config/Get`, `Config/Update`, `LeaveTypes/List`, `LeaveTypes/Create`, `LeaveTypes/Update`, `LeaveTypes/Delete` |
| **Entity** | `LeaveConfig`, `LeaveType` |
| **Page** | `ConfigPage.tsx` |

---

## UC31: Thống kê báo cáo nghỉ phép

| Thuộc tính | Giá trị |
|---|---|
| **ID** | UC31 |
| **Tên** | Thống kê báo cáo nghỉ phép |
| **Tác nhân** | GD.PGD |
| **Mục tiêu** | Xem báo cáo tổng quan, theo phòng ban, loại phép, và xuất Excel |
| **Trạng thái** | ⚠️ partial |

### KS chính (Main Success Scenario)

1. GD.PGD mở `/reports`
2. Hệ thống hiển thị KPI cards: tổng đơn, tổng ngày nghỉ, số nhân viên nghỉ
3. Biểu đồ cột theo phòng ban, biểu đồ tròn theo loại phép
4. GD.PGD lọc báo cáo theo tháng/quý, trạng thái đơn
5. GD.PGD nhấn "Xuất Excel" → hệ thống tải file `.xlsx`

### KS phụ (Alternative Flows)

- **2a. Lọc theo trạng thái**: Đã duyệt, chưa duyệt, bị từ chối
- **3a. Click vào phòng ban**: Drill-down xem chi tiết nhân viên trong phòng
- **5a. Xuất Excel**: Backend tạo file `.xlsx` qua ClosedXML, trả về stream

### Business Rules

- **BR-19**: Chỉ GD.PGD được xem báo cáo (role check: `QLNP.GD.PGD`)
- **BR-20**: File Excel tên format: `bao-cao-nghi-phep-{yyyyMMdd}.xlsx`
- **BR-21**: Dữ liệu báo cáo lấy từ LeaveRequests + LeaveBalances + DM_DONVI

### Trace

| Layer | Artifact |
|---|---|
| **Route** | `/reports` |
| **API** | `GET /api/reports/export` |
| **Feature** | `Reports/Export` (ExcelBuilder, ClosedXML) |
| **Entity** | `LeaveRequest`, `LeaveBalance`, `LeaveType`, `DM_DONVI` |
| **Page** | `ReportsPage.tsx` |

---

## UC32: Theo dõi số lượng ngày nghỉ phép vượt mức quy định

| Thuộc tính | Giá trị |
|---|---|
| **ID** | UC32 |
| **Tên** | Theo dõi vượt mức quy định |
| **Tác nhân** | GD.PGD |
| **Mục tiêu** | Phát hiện cán bộ/phòng ban có số ngày nghỉ vượt mức, phân loại theo lý do |
| **Trạng thái** | ❌ not-started |

### KS chính (Main Success Scenario)

1. GD.PGD mở `/violations`
2. Hệ thống hiển thị bảng cán bộ vượt mức: tên, phòng ban, số ngày vượt, loại phép
3. GD.PGD lọc theo tháng/quý
4. Biểu đồ phân loại theo lý do nghỉ (bệnh, thai sản, công tác...)
5. Bảng tổng hợp theo phòng ban: tổng ngày vượt mức của cả phòng

### KS phụ (Alternative Flows)

- **2a. Click cán bộ**: Xem chi tiết lịch sử nghỉ phép của cán bộ đó
- **3a. Lọc theo phòng ban**: Chỉ hiển thị cán bộ trong phòng cụ thể
- **5a. Xuất báo cáo**: (chưa có API)

### Business Rules

- **BR-22**: Vượt mức = UsedDays > TotalDays trong LeaveBalance
- **BR-23**: GD.PGD xem tất cả; không có phân quyền theo phòng
- **BR-24**: Mặc định ngưỡng = 12 ngày/năm (từ LeaveConfig hoặc hardcode)

### Trace

| Layer | Artifact |
|---|---|
| **Route** | `/violations` |
| **API** | (chưa có — cần tạo `GET /api/violations`) |
| **Feature** | (chưa có — cần tạo `Violations/List`) |
| **Entity** | `LeaveBalance`, `LeaveConfig`, `DM_DONVI` |
| **Page** | `ViolationsPage.tsx` |

---

## Implementation Status

| UC | Tên | Trạng thái | Ghi chú |
|----|-----|-----------|---------|
| UC26 | Gửi đơn xin nghỉ phép | ✅ implemented | Create/Update/Cancel/My endpoints |
| UC27 | Phê duyệt / từ chối | ✅ implemented | Config-driven 1/2 cấp duyệt, status approved_leader/approved |
| UC28 | Theo dõi đơn nghỉ phép | ✅ implemented | My/List/Calendar + LeaveBalances |
| UC29 | Tổng hợp lịch nghỉ phép | ⚠️ partial | Page exists, no dedicated API |
| UC30 | Cấu hình quy định | ✅ implemented | Config CRUD + LeaveTypes CRUD |
| UC31 | Thống kê báo cáo | ⚠️ partial | Export Excel exists, KPI/charts frontend-side |
| UC32 | Vượt mức quy định | ❌ not-started | Page stub only, no backend API |