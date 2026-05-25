# Use Case Progress Checklist — QLNP-TTCDS

> Sinh từ `usecase.md`. Check `[x]` khi flow/feature hoạt động đúng. Cập nhật mỗi lần code change.

---

## UC-01: Gửi đơn xin nghỉ phép `CB.PCM`

### Basic Flow — Tạo và gửi đơn

- [x] BF-01.1: Truy cập `/leave/new` hiển thị form tạo đơn
- [x] BF-01.2: Form gồm loại phép, ngày bắt đầu, ngày kết thúc, lý do, người phê duyệt
- [x] BF-01.3: Chọn loại phép từ `LeaveTypes` đang active
- [x] BF-01.4: Chọn ngày (start >= today, start <= end)
- [x] BF-01.5: Tự động tính số ngày nghỉ (T2–T6, tối thiểu 1 ngày)
- [x] BF-01.6: Nhập lý do nghỉ (không để trống)
- [ ] BF-01.7: Chọn người phê duyệt từ danh sách lọc theo `LeaveConfigs`
- [x] BF-01.8: Kiểm tra trùng lịch (không overlap đơn đã approved)
- [x] BF-01.9: Nhấn "Gửi đơn" → lưu `pending`, redirect `/leave/my`
- [x] BF-01.10: Thông báo thành công

### Alternative Flows

- [x] A-01.1: Chỉnh sửa đơn khi status = `pending` (`/leave/my` → "Sửa")
- [x] A-01.2: Validation khi sửa (start <= end, start >= today, không trùng lịch)
- [ ] A-01.3: Audit log ghi nhận khi sửa (trường thay đổi, cũ/mới, người, thời điểm)
- [x] A-01.4: Hủy đơn khi status = `pending` → `cancelled`
- [ ] A-01.5: Hủy đơn khi status = `approved_leader` (BRULE-006)
- [x] A-01.6: Xem lại đơn đã gửi (`/leave/my` + filter trạng thái)
- [ ] A-01.7: Filter theo khoảng thời gian, loại phép trên `/leave/my`
- [ ] A-01.8: Xem lịch sử đơn + audit log tại `/leave/history`

### Exception Flows

- [x] E-01.1: Validation thất bại → lỗi chi tiết trên từng trường
- [x] E-01.2: Trùng lịch → lỗi "Trùng lịch với đơn đã được duyệt"
- [x] E-01.3: Không có quyền sửa/hủy đơn đã xử lý → ẩn/khóa nút

### Business Rules

- [x] BRULE-001: Số ngày nghỉ chỉ tính T2–T6
- [x] BRULE-002: Không cho phép tạo đơn nếu trùng lịch đã approved
- [x] BRULE-007: Chỉ sửa/hủy khi `pending`, CB.PCM chỉ sửa đơn của mình

**UC-01 Progress: 15/25** `████████░░░░░░░░░░░░ 60%`

---

## UC-02: Phê duyệt / Từ chối đơn nghỉ phép `LĐ.PCM, GĐ/PGĐ`

### Basic Flow — Phê duyệt đơn

- [x] BF-02.1: Truy cập `/approval` hiển thị danh sách đơn pending
- [ ] BF-02.2: LĐ.PCM chỉ thấy đơn cùng phòng; GĐ/PGĐ thấy pending + `approved_leader`
- [x] BF-02.3: Tìm kiếm theo tên cán bộ
- [x] BF-02.4: Chọn đơn → hiển thị dialog chi tiết
- [x] BF-02.5: Nhấn "Phê duyệt" → cập nhật trạng thái (LĐ → `approved_leader`, GĐ → `approved_director`)
- [x] BF-02.6: Ghi `approved_by` và thời điểm
- [x] BF-02.7: Nếu `approved_director` → tự động trừ `LeaveBalances.UsedDays`
- [x] BF-02.8: Thông báo thành công, làm mới danh sách

### Alternative Flows

- [x] A-02.1: Từ chối đơn → nhập lý do → `rejected` + `rejected_reason`
- [ ] A-02.2: Cập nhật nội dung đơn khi phê duyệt (sửa ngày/lý do trước khi duyệt)
- [ ] A-02.3: Audit log khi approver cập nhật nội dung đơn
- [ ] A-02.4: Xem chi tiết đơn + tab "Lịch sử thay đổi" (audit log)

### Exception Flows

- [ ] E-02.1: LĐ.PCM duyệt đơn phòng khác → 403
- [x] E-02.2: Đơn đã reject/cancel/approved_director → ẩn nút duyệt/từ chối

### Business Rules

- [x] BRULE-003: Phê duyệt 2 cấp (pending → LĐ → approved_leader → GĐ → approved_director)
- [x] BRULE-004: LĐ.PCM chỉ thấy đơn phòng mình; GĐ/PGĐ thấy tất cả
- [ ] BRULE-010: Mọi thay đổi nội dung đơn phải ghi audit log

**UC-02 Progress: 10/16** `████████░░░░░░░░░░░░ 63%`

---

## UC-03: Theo dõi đơn nghỉ phép của cán bộ `CB.PCM, LĐ.PCM, GĐ/PGĐ`

### Basic Flow — Xem danh sách đơn

- [x] BF-03.1: CB.PCM truy cập `/leave/my`; LĐ/GĐ truy cập `/approval`
- [x] BF-03.2: Phạm vi dữ liệu theo role (CB = của mình, LĐ = phòng, GĐ = tất cả)
- [x] BF-03.3: Bảng danh sách đơn với tiêu chí lọc
- [x] BF-03.4: Xem trạng thái, số ngày, lý do, ngày gửi

### Alternative Flows

- [x] A-03.1: Tìm kiếm + filter trạng thái/loại phép
- [x] A-03.2: CB.PCM chỉnh sửa đơn `pending` của mình
- [ ] A-03.3: LĐ.PCM chỉnh sửa đơn `pending` của cán bộ trong phòng
- [x] A-03.4: CB.PCM hủy đơn `pending` của mình
- [ ] A-03.5: LĐ.PCM hủy đơn `pending` của cán bộ trong phòng
- [x] A-03.6: Xem số dư ngày phép (Dashboard / form tạo đơn)
- [ ] A-03.7: Phân quyền số dư theo role (CB = của mình, LĐ = phòng, GĐ = tất cả)
- [ ] A-03.8: Lịch sử nghỉ phép + audit log tại `/leave/history`
- [ ] A-03.9: Xem đơn đã duyệt (`approved_leader`/`approved_director`)

### Exception Flows

- [x] E-03.1: Không có dữ liệu → "Không có dữ liệu"
- [x] E-03.2: Không có quyền sửa/hủy → ẩn/khóa thao tác

### Business Rules

- [x] BRULE-004: Phân quyền theo role
- [ ] BRULE-007: LĐ.PCM sửa đơn pending trong phòng (không chỉ owner)

**UC-03 Progress: 10/17** `████████░░░░░░░░░░░░ 59%`

---

## UC-04: Theo dõi tổng hợp lịch nghỉ phép `GĐ/PGĐ`

### Basic Flow — Xem tổng hợp

- [x] BF-04.1: Truy cập `/summary` → bảng tổng hợp theo phòng ban
- [x] BF-04.2: Chọn năm + loại phép để lọc
- [x] BF-04.3: Click "tổng CB" → dialog danh sách cán bộ trong phòng
- [x] BF-04.4: Click "xem chi tiết" cán bộ → dialog đơn approved
- [x] BF-04.5: Click "tổng ngày" → dialog tất cả đơn approved của phòng
- [x] BF-04.6: Biểu đồ tròn phân bổ ngày nghỉ theo loại phép

### Alternative Flows

- [ ] A-04.1: Tìm kiếm theo tên cán bộ / phòng ban trên summary
- [x] A-04.2: Xem lịch nghỉ Calendar (`/calendar`) + lọc phòng ban + prev/next
- [x] A-04.3: Click tên phòng → danh sách đơn approved của phòng
- [ ] A-04.4: Xem số dư ngày phép từng cán bộ trong dialog
- [ ] A-04.5: Lịch sử nghỉ phép tại `/leave/history`
- [x] A-04.6: Thống kê loại phép trên biểu đồ tròn

### Exception Flows

- [x] E-04.1: Không có dữ liệu → bảng rỗng + "Không có dữ liệu"

### Business Rules

- [x] BRULE-001: Chỉ tính đơn `approved_leader`/`approved_director`
- [x] BRULE-004: GĐ/PGĐ có quyền xem tất cả

**UC-04 Progress: 10/14** `████████░░░░░░░░░░░░ 71%`

---

## UC-05: Cấu hình quy định nghỉ phép `QTHT`

### Basic Flow — Cấu hình chung

- [x] BF-05.1: Truy cập `/config` → giao diện 3 tab
- [ ] BF-05.2: Tab "Cấu hình chung": thiết lập chu kỳ tính phép + số ngày mặc định theo role
- [ ] BF-05.3: Lưu cấu hình chung → persist vào backend (upsert logic)
- [x] BF-05.4: Thông báo thành công

### Alternative Flows

- [x] A-05.1: Tab "Loại phép" → bảng CRUD loại phép
- [x] A-05.2: Thêm loại phép mới → dialog CRUD
- [x] A-05.3: Toggle `is_active` ẩn/hiện loại phép
- [ ] A-05.4: Xóa loại phép (nếu chưa có đơn liên quan)
- [x] A-05.5: Sửa loại phép
- [x] A-05.6: Tab "Cấp phê duyệt" → bảng cấu hình cấp duyệt
- [x] A-05.7: Thêm/sửa/xóa cấu hình cấp phê duyệt

### Exception Flows

- [x] E-05.1: Không phải QTHT → read-only hoặc redirect + thông báo
- [ ] E-05.2: Validation thất bại (số ngày âm, mã trùng, thiếu trường)

### Business Rules

- [ ] BRULE-005: Định mức ngày phép từ `LeaveType.DefaultDays`, không hardcode
- [ ] Chỉ QTHT mới có quyền ghi cấu hình (server enforce)

**UC-05 Progress: 9/15** `████████░░░░░░░░░░░░ 60%`

---

## UC-06: Thống kê báo cáo nghỉ phép `GĐ/PGĐ`

### Basic Flow — Xem báo cáo

- [x] BF-06.1: Truy cập `/reports` → KPI cards (tổng ngày, tỷ lệ duyệt, đơn từ chối)
- [x] BF-06.2: Biểu đồ cột ngày nghỉ theo phòng ban
- [x] BF-06.3: Biểu đồ tròn phân bổ theo loại phép
- [ ] BF-06.4: Lọc báo cáo theo trạng thái đơn (đã duyệt, chưa duyệt, bị từ chối)
- [ ] BF-06.5: Chọn kỳ báo cáo (tháng/quý/năm) qua period selector
- [ ] BF-06.6: Tính toán lại số liệu theo kỳ đã chọn

### Alternative Flows

- [x] A-06.1: Hover/click biểu đồ cột → tooltip chi tiết phòng
- [x] A-06.2: Biểu đồ tròn tỷ lệ loại phép
- [x] A-06.3: Xuất Excel `.xlsx` (bold header, auto-width, auto-filter, UTF-8)
- [ ] A-06.4: Báo cáo theo tháng/quý (aggregate + cập nhật biểu đồ/KPI)

### Exception Flows

- [x] E-06.1: Không có dữ liệu → KPI = 0, biểu đồ rỗng
- [ ] E-06.2: Xuất file lỗi → thông báo "Xuất file thất bại"

### Business Rules

- [x] BRULE-001: Báo cáo tính theo ngày làm việc
- [ ] Chỉ GĐ/PGĐ mới có quyền xem báo cáo (server enforce)

**UC-06 Progress: 8/14** `████████░░░░░░░░░░░░ 57%`

---

## UC-07: Theo dõi vượt mức quy định `GĐ/PGĐ`

### Basic Flow — Xem danh sách vượt mức

- [x] BF-07.1: Truy cập `/violations` → 4 KPI cards
- [x] BF-07.2: Biểu đồ tròn phân loại vượt mức theo lý do nghỉ
- [x] BF-07.3: Biểu đồ cột số ngày vượt theo phòng ban
- [x] BF-07.4: Bảng cấp phòng ban (tên, tổng CB, CB vượt, định mức, vượt)
- [x] BF-07.5: Bảng cấp cá nhân (tên, phòng, định mức, đã dùng, vượt, badges lý do)
- [x] BF-07.6: Period selector (năm/quý/tháng)

### Alternative Flows

- [x] A-07.1: Tìm kiếm cán bộ/phòng ban
- [x] A-07.2: Xem chi tiết cá nhân → dialog đơn + loại phép + lý do
- [x] A-07.3: Xem chi tiết phòng ban → dialog tổng quan + CB vượt mức
- [x] A-07.4: Badges phân loại lý do trên bảng cá nhân
- [x] A-07.5: KPI "Tổng ngày vượt toàn cơ quan"
- [x] A-07.6: Filter kỳ tháng/quý

### Exception Flows

- [x] E-07.1: Không có vi phạm → KPI = 0, bảng rỗng
- [ ] E-07.2: Định mức chưa cấu hình → thông báo "Vui lòng cấu hình định mức"

### Business Rules

- [x] BRULE-005: Định mức từ `LeaveBalance.TotalDays` (nguồn `LeaveType.DefaultDays`)
- [x] Chỉ tính đơn `approved`
- [x] Overage = total_used - TotalDays per user

**UC-07 Progress: 13/15** `████████░░░░░░░░░░░░ 87%`

---

## Cross-Cutting Concerns

- [ ] Audit Log entity + table + API (yêu cầu UC-01, UC-02, UC-03)
- [ ] Route `/leave/history` (yêu cầu UC-01, UC-03, UC-04)
- [x] Backend Reports API (`/api/reports/*`)
- [ ] Backend Violations API (`/api/violations/*`)
- [x] Excel export thư viện (ClosedXML/EPPlus)
- [ ] Approver selection dropdown trong form tạo đơn
- [ ] LĐ.PCM chỉnh sửa/hủy đơn pending của cấp dưới trên ApprovalPage

---

## Summary

| UC | Tên | Done | Total | Progress |
|----|-----|------|-------|----------|
| UC-01 | Gửi đơn xin nghỉ phép | 15 | 25 | 60% |
| UC-02 | Phê duyệt / Từ chối đơn | 10 | 16 | 63% |
| UC-03 | Theo dõi đơn | 10 | 17 | 59% |
| UC-04 | Tổng hợp lịch nghỉ | 10 | 14 | 71% |
| UC-05 | Cấu hình quy định | 9 | 15 | 60% |
| UC-06 | Thống kê báo cáo | 8 | 14 | 57% |
| UC-07 | Vượt mức quy định | 13 | 15 | 87% |
| **Cross** | **Cross-cutting** | **2** | **7** | **29%** |
| **TOTAL** | | **76** | **133** | **57%** |

> Cập nhật lần cuối: 2026-05-25