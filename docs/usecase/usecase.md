# Use Case Specification — QLNP-TTCDS

**Version:** 1.1 | **Date:** 2026-05-21

---

## UC-01: Gửi đơn xin nghỉ phép

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case ID** | UC-01 |
| **Tên Use case** | Gửi đơn xin nghỉ phép |
| **Tác nhân chính** | CB.PCM (Cán bộ phòng chuyên môn) |
| **Tác nhân phụ** | LĐ.PCM, GĐ/PGĐ (người phê duyệt) |
| **Mô tả** | CB.PCM tạo mới, chỉnh sửa, hủy, gửi và theo dõi đơn xin nghỉ phép của mình. Hệ thống hỗ trợ tính số ngày nghỉ theo ngày làm việc, kiểm tra trùng lịch và lưu trữ lịch sử thay đổi. |

### Pre-conditions
- CB.PCM đã đăng nhập thành công qua SSO/gateway.
- CB.PCM có vai trò "CB.PCM" trong hệ thống.
- Dữ liệu loại phép (`LeaveTypes`) và cấu hình phê duyệt (`LeaveConfigs`) đã được khởi tạo.

### Post-conditions
**Thành công:**
- Đơn nghỉ phép được tạo/lưu với trạng thái phù hợp (`pending`, `cancelled`).
- Số ngày nghỉ được tính toán đúng theo ngày làm việc (T2–T6).
- Nếu có thay đổi nội dung, audit log được ghi nhận (trường thay đổi, giá trị cũ/mới, người thực hiện, thời điểm).

**Thất bại:**
- Đơn không được lưu.
- Hệ thống hiển thị thông báo lỗi phù hợp (validation, trùng lịch, không có quyền).

### Basic Flow (Luồng chính) — Tạo và gửi đơn nghỉ phép
1. CB.PCM truy cập chức năng "Tạo đơn nghỉ phép" (route: `/leave/new`).
2. Hệ thống hiển thị form tạo đơn gồm: loại phép, ngày bắt đầu, ngày kết thúc, lý do nghỉ, người phê duyệt.
3. CB.PCM chọn loại phép từ danh sách `LeaveTypes` đang active.
4. CB.PCM chọn ngày bắt đầu và ngày kết thúc (start >= today, start <= end).
5. Hệ thống tự động tính số ngày nghỉ = số ngày làm việc (T2–T6) trong khoảng đã chọn, tối thiểu 1 ngày.
6. CB.PCM nhập lý do nghỉ (không để trống).
7. CB.PCM chọn người phê duyệt từ danh sách được lọc theo `LeaveConfigs` (approver role + cùng phòng ban nếu là LĐ.PCM).
8. Hệ thống kiểm tra trùng lịch: đơn mới không được overlap với đơn đã approved (`approved_leader`/`approved_director`) của cùng người.
9. CB.PCM nhấn "Gửi đơn".
10. Hệ thống lưu đơn với trạng thái `pending`, redirect về `/leave/my`.
11. Hệ thống hiển thị thông báo thành công.

### Alternative Flows (Luồng thay thế)

**A-1. Chỉnh sửa đơn nghỉ phép (chỉ khi status = `pending`)**
1. Tại bước 1 của Basic Flow, CB.PCM chọn chức năng "Xem đơn của tôi" (`/leave/my`).
2. Hệ thống hiển thị danh sách đơn của CB.PCM.
3. CB.PCM chọn đơn có trạng thái `pending` và nhấn "Sửa".
4. Hệ thống mở dialog chỉnh sửa với các trường: loại phép, ngày, lý do, người duyệt.
5. CB.PCM thay đổi thông tin và nhấn "Lưu".
6. Hệ thống chạy lại validation (start <= end, start >= today, không trùng lịch).
7. Hệ thống lưu thay đổi, giữ nguyên trạng thái `pending`, ghi audit log.
8. Quay lại danh sách đơn.

**A-2. Hủy đơn nghỉ phép (chỉ khi status = `pending`)**
1. Tại bước 1 của Basic Flow, CB.PCM chọn chức năng "Xem đơn của tôi" (`/leave/my`).
2. CB.PCM chọn đơn có trạng thái `pending` và nhấn "Hủy".
3. Hệ thống xác nhận hành động.
4. Hệ thống cập nhật trạng thái đơn thành `cancelled`.
5. Quay lại danh sách đơn; đơn đã hủy vẫn hiển thị trong lịch sử.

**A-3. Xem lại đơn đã gửi**
1. CB.PCM truy cập `/leave/my`.
2. Hệ thống hiển thị bảng tất cả đơn của CB.PCM: STT, loại phép, ngày, số ngày, lý do, trạng thái, ngày gửi, thao tác.
3. CB.PCM có thể filter theo trạng thái: Tất cả, Chờ duyệt, LĐ đã duyệt, GĐ đã duyệt, Từ chối, Đã hủy.
4. Các đơn không còn `pending` không hiển thị nút sửa/hủy.

**A-4. Xem lịch sử các đơn đã gửi**
1. CB.PCM truy cập `/leave/history`.
2. Hệ thống hiển thị lịch sử các đơn của CB.PCM, bao gồm cả audit log thay đổi (sửa bởi owner, cập nhật bởi approver).
3. CB.PCM có thể filter theo khoảng thời gian, trạng thái, loại phép.

### Exception Flows (Luồng ngoại lệ)

**E-1. Validation thất bại**
- Tại bước 5–7 của Basic Flow: nếu start > end, start < today, lý do rỗng, hoặc chưa chọn loại phép/người duyệt.
- Hệ thống hiển thị lỗi validation chi tiết trên từng trường và không cho submit.

**E-2. Trùng lịch**
- Tại bước 8 của Basic Flow: nếu khoảng ngày nghỉ overlap với đơn đã approved (`approved_leader`/`approved_director`).
- Hệ thống hiển thị lỗi "Trùng lịch với đơn đã được duyệt" và không cho submit.

**E-3. Không có quyền sửa/hủy**
- Tại A-1 hoặc A-2: nếu đơn không còn ở trạng thái `pending`.
- Hệ thống ẩn/khóa nút thao tác và hiển thị thông báo "Không thể sửa/hủy đơn đã được xử lý".

### Business Rules
- BRULE-001: Số ngày nghỉ chỉ tính ngày làm việc (T2–T6), không tính T7, CN.
- BRULE-002: Không cho phép tạo đơn nếu trùng lịch với đơn đã approved.
- BRULE-007: Chỉ sửa/hủy được khi status = `pending`. CB.PCM chỉ sửa đơn của mình.

---

## UC-02: Phê duyệt / Từ chối đơn nghỉ phép

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case ID** | UC-02 |
| **Tên Use case** | Phê duyệt / Từ chối đơn nghỉ phép |
| **Tác nhân chính** | LĐ.PCM, GĐ/PGĐ |
| **Tác nhân phụ** | CB.PCM (người gửi đơn) |
| **Mô tả** | Lãnh đạo phòng chuyên môn (LĐ.PCM) và Giám đốc/Phó giám đốc (GĐ/PGĐ) tìm kiếm, xem danh sách, phê duyệt, từ chối và cập nhật nội dung đơn nghỉ phép của cán bộ theo phân quyền cấp bậc. |

### Pre-conditions
- Người dùng đã đăng nhập thành công với vai trò LĐ.PCM hoặc GĐ/PGĐ.
- Đơn nghỉ phép cần xử lý đang ở trạng thái phù hợp (`pending` đối với LĐ.PCM; `approved_leader` đối với GĐ/PGĐ).

### Post-conditions
**Thành công:**
- Trạng thái đơn được cập nhật (`approved_leader`, `approved_director`, `rejected`).
- `approved_by` ghi nhận người phê duyệt thực tế.
- Nếu GĐ/PGĐ duyệt (`approved_director`), `LeaveBalances.UsedDays` tự động cập nhật.
- Nếu có cập nhật nội dung, audit log ghi nhận đầy đủ.

**Thất bại:**
- Trạng thái đơn không thay đổi.
- Hệ thống hiển thị lỗi quyền hạn hoặc trạng thái không hợp lệ.

### Basic Flow (Luồng chính) — Phê duyệt đơn
1. Người dùng (LĐ.PCM/GĐ/PGĐ) truy cập chức năng "Phê duyệt đơn" (`/approval`).
2. Hệ thống hiển thị danh sách đơn `pending`, lọc theo role:
   - LĐ.PCM: chỉ thấy đơn của cán bộ cùng phòng (không bao gồm đơn của mình).
   - GĐ/PGĐ: thấy tất cả đơn `pending` và `approved_leader`.
3. Người dùng có thể tìm kiếm theo tên cán bộ.
4. Người dùng chọn đơn cần duyệt.
5. Hệ thống hiển thị dialog chi tiết đơn (hoặc inline action).
6. Người dùng nhấn "Phê duyệt".
7. Hệ thống cập nhật trạng thái:
   - LĐ.PCM → `approved_leader`.
   - GĐ/PGĐ → `approved_director`.
8. Hệ thống ghi `approved_by` và thời điểm.
9. Nếu `approved_director`, hệ thống tự động trừ `LeaveBalances.UsedDays`.
10. Hệ thống thông báo thành công và làm mới danh sách.

### Alternative Flows (Luồng thay thế)

**A-1. Từ chối đơn**
1. Tại bước 5 của Basic Flow, người dùng chọn "Từ chối".
2. Hệ thống mở dialog nhập lý do từ chối (không bắt buộc nhưng khuyến nghị).
3. Người dùng nhập lý do và xác nhận.
4. Hệ thống cập nhật trạng thái thành `rejected`, lưu `rejected_reason`.
5. Thông báo từ chối được hiển thị; đơn rời khỏi danh sách chờ duyệt.

**A-2. Cập nhật nội dung đơn khi phê duyệt**
1. Tại bước 5 của Basic Flow, người dùng chọn "Cập nhật nội dung" (chỉ khi đơn ở trạng thái `pending` hoặc `approved_leader`).
2. Hệ thống mở dialog cho phép sửa: ngày bắt đầu, ngày kết thúc, lý do.
3. Người dùng thay đổi thông tin và nhấn "Lưu & Duyệt".
4. Hệ thống validation (start <= end, business days >= 1).
5. Hệ thống lưu thay đổi vào `LeaveRequests`, đồng thời ghi audit log: người sửa, trường thay đổi, giá trị cũ, giá trị mới, thời điểm.
6. Tiếp tục với bước 7 của Basic Flow (cập nhật trạng thái phê duyệt).

**A-3. Xem chi tiết đơn và audit log**
1. Người dùng chọn "Xem chi tiết" trên một đơn trong danh sách.
2. Hệ thống hiển thị dialog với đầy đủ thông tin đơn.
3. Trong dialog, hiển thị tab/panel "Lịch sử thay đổi" gồm: danh sách các thay đổi, ai sửa, khi nào, giá trị cũ → mới.

### Exception Flows (Luồng ngoại lệ)

**E-1. Không đủ quyền**
- Tại bước 2: LĐ.PCM cố gắng duyệt đơn của phòng khác hoặc đơn của chính mình.
- Hệ thống không hiển thị đơn đó trong danh sách; nếu truy cập trực tiếp, trả lỗi 403.

**E-2. Trạng thái không hợp lệ để duyệt**
- Đơn đã ở trạng thái `rejected`, `cancelled` hoặc `approved_director`.
- Hệ thống ẩn nút duyệt/từ chối và hiển thị trạng thái cuối.

### Business Rules
- BRULE-003: Phê duyệt 2 cấp — `pending` → LĐ.PCM → `approved_leader` → GĐ/PGĐ → `approved_director`. Nếu `LeaveConfigs` chỉ có 1 level thì `pending` → `approved_director` luôn.
- BRULE-004: LĐ.PCM chỉ thấy/sửa đơn của phòng mình quản lý; GĐ/PGĐ thấy tất cả.
- BRULE-010: Mọi thay đổi nội dung đơn (sửa bởi owner hoặc cập nhật bởi approver) phải ghi audit log đầy đủ.

---

## UC-03: Theo dõi đơn nghỉ phép của cán bộ

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case ID** | UC-03 |
| **Tên Use case** | Theo dõi đơn nghỉ phép của cán bộ |
| **Tác nhân chính** | CB.PCM, LĐ.PCM, GĐ/PGĐ |
| **Mô tả** | Cán bộ, lãnh đạo phòng và giám đốc tìm kiếm, xem danh sách đơn nghỉ phép theo các tiêu chí; lãnh đạo phòng và cán bộ có thể chỉnh sửa hoặc hủy đơn pending; xem số dư ngày phép và lịch sử. |

### Pre-conditions
- Người dùng đã đăng nhập thành công.
- Dữ liệu đơn nghỉ phép và số dư phép đã tồn tại trong hệ thống.

### Post-conditions
**Thành công:**
- Danh sách đơn được hiển thị đúng theo phạm vi quyền của role.
- Thao tác sửa/hủy được thực hiện và ghi nhận.
- Số dư ngày phép được hiển thị chính xác.

**Thất bại:**
- Hệ thống hiển thị danh sách rỗng hoặc lỗi truy cập nếu không đủ quyền.

### Basic Flow (Luồng chính) — Xem danh sách đơn
1. Người dùng truy cập chức năng theo dõi đơn (tùy role: `/leave/my`, `/approval`, `/leave/history`).
2. Hệ thống xác định phạm vi dữ liệu theo role:
   - CB.PCM: chỉ đơn của mình.
   - LĐ.PCM: đơn của cán bộ trong phòng mình quản lý.
   - GĐ/PGĐ: tất cả đơn trong toàn trung tâm.
3. Hệ thống hiển thị bảng danh sách đơn theo tiêu chí tìm kiếm/lọc.
4. Người dùng có thể xem trạng thái đơn, số ngày nghỉ, lý do, ngày gửi.

### Alternative Flows (Luồng thay thế)

**A-1. Tìm kiếm và lọc đơn**
1. Người dùng nhập từ khóa (tên cán bộ) hoặc chọn filter trạng thái/loại phép/thời gian.
2. Hệ thống cập nhật danh sách theo điều kiện lọc.

**A-2. Chỉnh sửa đơn (LĐ.PCM và CB.PCM)**
1. LĐ.PCM hoặc CB.PCM chọn đơn có trạng thái `pending`.
2. LĐ.PCM có thể sửa đơn của cán bộ trong phòng; CB.PCM chỉ sửa đơn của mình.
3. Hệ thống mở dialog sửa đơn, chạy validation, lưu thay đổi và ghi audit log.
4. Đơn giữ nguyên trạng thái `pending` sau khi sửa.

**A-3. Hủy đơn (soft-cancel)**
1. LĐ.PCM hoặc CB.PCM chọn đơn `pending` và nhấn "Hủy".
2. Hệ thống xác nhận và cập nhật trạng thái thành `cancelled`.
3. Đơn vẫn được lưu trữ trong lịch sử, không xóa vĩnh viễn.

**A-4. Xem tổng số ngày phép còn lại / đã sử dụng**
1. Người dùng xem thông tin số dư ngày phép trên Dashboard hoặc trong form tạo đơn.
2. Hệ thống tính: `Ngày còn lại = LeaveBalance.TotalDays - LeaveBalance.UsedDays`.
3. Số liệu theo role: CB.PCM thấy của mình; LĐ.PCM thấy của phòng; GĐ/PGĐ thấy toàn hệ thống.

**A-5. Xem lịch sử nghỉ phép**
1. GĐ/PGĐ và LĐ.PCM truy cập lịch sử đơn của cán bộ trong phạm vi quyền.
2. Hệ thống hiển thị toàn bộ đơn đã gửi kèm audit log thay đổi.

**A-6. Xem các đơn đã được duyệt**
1. LĐ.PCM và CB.PCM xem các đơn có trạng thái `approved_leader` hoặc `approved_director` trong phạm vi quyền.
2. Hệ thống hiển thị danh sách đơn đã duyệt, không cho phép sửa/hủy.

### Exception Flows (Luồng ngoại lệ)

**E-1. Không có dữ liệu**
- Không có đơn nào phù hợp với điều kiện lọc.
- Hệ thống hiển thị thông báo "Không có dữ liệu".

**E-2. Không có quyền sửa/hủy**
- Người dùng chọn đơn không thuộc phạm vi quyền hoặc đơn không còn `pending`.
- Hệ thống ẩn/khóa thao tác.

### Business Rules
- BRULE-004: Phân quyền theo role — CB.PCM: xem đơn của mình; LĐ.PCM: xem đơn của phòng; GĐ/PGĐ: xem tất cả.
- BRULE-007: LĐ.PCM có thể sửa đơn pending trong phòng mình quản lý (không chỉ owner). CB.PCM chỉ sửa đơn của mình.

---

## UC-04: Theo dõi tổng hợp lịch nghỉ phép của trung tâm

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case ID** | UC-04 |
| **Tên Use case** | Theo dõi tổng hợp lịch nghỉ phép của trung tâm |
| **Tác nhân chính** | GĐ/PGĐ |
| **Mô tả** | Giám đốc/Phó giám đốc tìm kiếm, xem tổng hợp lịch nghỉ phép toàn trung tâm, thống kê loại phép, xem chi tiết theo phòng ban và cá nhân, xem lịch sử nghỉ phép. |

### Pre-conditions
- Người dùng đã đăng nhập với vai trò GĐ/PGĐ.
- Dữ liệu đơn nghỉ phép đã được phê duyệt (`approved_leader` hoặc `approved_director`).

### Post-conditions
**Thành công:**
- Tổng hợp lịch nghỉ phép được hiển thị theo phòng ban, cá nhân và loại phép.
- Người dùng có thể drill-down từ phòng ban → cá nhân → chi tiết đơn.

**Thất bại:**
- Hệ thống hiển thị thông báo lỗi nếu không có dữ liệu phù hợp.

### Basic Flow (Luồng chính) — Xem tổng hợp lịch nghỉ phép
1. GĐ/PGĐ truy cập chức năng "Tổng hợp lịch nghỉ" (`/summary`).
2. Hệ thống hiển thị bảng tổng hợp theo phòng ban: tên phòng, tổng CB, tổng ngày phép đã duyệt.
3. GĐ/PGĐ chọn năm và loại phép để lọc.
4. Hệ thống cập nhật bảng theo điều kiện lọc; chỉ tính đơn `approved`.
5. GĐ/PGĐ click vào "tổng CB" của một phòng.
6. Hệ thống mở dialog hiển thị danh sách cán bộ trong phòng + tổng ngày phép từng người + nút xem chi tiết.
7. GĐ/PGĐ click "xem chi tiết" một cán bộ.
8. Hệ thống mở dialog hiển thị các đơn approved của cán bộ đó.
9. GĐ/PGĐ click vào "tổng ngày" của một phòng (tại bước 4).
10. Hệ thống mở dialog hiển thị tất cả đơn approved của phòng đó.
11. GĐ/PGĐ xem biểu đồ tròn (PieChart) phân bổ ngày nghỉ theo loại phép.

### Alternative Flows (Luồng thay thế)

**A-1. Tìm kiếm đơn**
1. GĐ/PGĐ nhập từ khóa tìm kiếm (tên cán bộ, phòng ban).
2. Hệ thống lọc danh sách theo từ khóa.

**A-2. Xem lịch nghỉ phép toàn trung tâm**
1. GĐ/PGĐ chuyển sang chế độ xem Calendar (`/calendar`).
2. Hệ thống hiển thị lịch tháng với các ô ngày có màu nền nếu có người nghỉ (approved = xanh lá, pending = vàng/cam).
3. GĐ/PGĐ điều hướng tháng bằng Previous/Next.
4. GĐ/PGĐ lọc theo phòng ban.

**A-3. Xem lịch nghỉ phép của phòng ban**
1. Tại bảng tổng hợp, GĐ/PGĐ click vào tên phòng ban.
2. Hệ thống hiển thị danh sách đơn approved của phòng đó.

**A-4. Xem thông tin nghỉ phép của cán bộ**
1. Tại dialog danh sách cán bộ (bước 6), GĐ/PGĐ xem tổng quan số ngày phép đã dùng, còn lại của từng cán bộ.

**A-5. Xem lịch sử nghỉ phép của cán bộ**
1. GĐ/PGĐ truy cập `/leave/history` với quyền xem tất cả.
2. Hệ thống hiển thị toàn bộ lịch sử đơn và audit log của cán bộ được chọn.

**A-6. Thống kê loại phép**
1. Hệ thống hiển thị thống kê phân bổ ngày nghỉ theo loại phép (phép năm, nghỉ bệnh, thai sản, công tác...) trên biểu đồ tròn.

### Exception Flows (Luồng ngoại lệ)

**E-1. Không có dữ liệu**
- Không có đơn approved trong năm/loại phép đã chọn.
- Hệ thống hiển thị bảng rỗng và thông báo "Không có dữ liệu".

### Business Rules
- BRULE-001: Số liệu chỉ tính đơn `approved_leader` hoặc `approved_director`.
- BRULE-004: GĐ/PGĐ có quyền xem tất cả dữ liệu toàn trung tâm.

---

## UC-05: Cấu hình quy định nghỉ phép

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case ID** | UC-05 |
| **Tên Use case** | Cấu hình quy định nghỉ phép |
| **Tác nhân chính** | QTHT (Quản trị hệ thống) |
| **Mô tả** | Quản trị hệ thống thiết lập số ngày phép mặc định, chu kỳ tính phép, các loại phép được phép đăng ký và cấu hình cấp phê duyệt cho từng loại phép. |

### Pre-conditions
- QTHT đã đăng nhập với vai trò "QTHT".
- Chỉ QTHT mới có quyền ghi; role khác chỉ xem (read-only).

### Post-conditions
**Thành công:**
- Cấu hình được lưu vào `LeaveConfigs`, `LeaveTypes` và bảng cấu hình chung.
- Upsert logic: nếu config_key đã tồn tại thì update, chưa có thì insert.

**Thất bại:**
- Hệ thống hiển thị lỗi validation hoặc từ chối nếu không phải QTHT.

### Basic Flow (Luồng chính) — Cấu hình hệ thống
1. QTHT truy cập chức năng "Cấu hình hệ thống" (`/config`).
2. Hệ thống hiển thị giao diện cấu hình gồm 3 tab.
3. QTHT chọn tab "Cấu hình chung".
4. QTHT thiết lập chu kỳ tính phép (yearly/monthly) và số ngày phép mặc định theo role (4 roles × input number).
5. QTHT nhấn "Lưu".
6. Hệ thống lưu cấu hình, thông báo thành công.

### Alternative Flows (Luồng thay thế)

**A-1. Quản lý loại phép**
1. QTHT chọn tab "Loại phép".
2. Hệ thống hiển thị bảng: tên, mã, số ngày mặc định, mô tả, trạng thái.
3. QTHT nhấn "Thêm" để mở dialog CRUD.
4. QTHT nhập thông tin loại phép mới và nhấn "Lưu".
5. Hệ thống thêm loại phép vào `LeaveTypes`.
6. QTHT có thể toggle `is_active` để ẩn/hiện loại phép trong form tạo đơn.
7. QTHT có thể sửa/xóa loại phép (không xóa nếu đã có đơn liên quan).

**A-2. Cấu hình cấp phê duyệt**
1. QTHT chọn tab "Cấp phê duyệt".
2. Hệ thống hiển thị bảng: loại phép, cấp duyệt (1,2,3...), vai trò duyệt (LD.PCM, GD.PGD, QTHT).
3. QTHT nhấn "Thêm" để mở dialog CRUD.
4. QTHT chọn loại phép, cấp duyệt, vai trò duyệt và nhấn "Lưu".
5. Hệ thống lưu vào `LeaveConfigs`.
6. QTHT có thể sửa/xóa cấu hình cấp duyệt.

### Exception Flows (Luồng ngoại lệ)

**E-1. Không đủ quyền**
- Người dùng không phải QTHT truy cập `/config`.
- Hệ thống hiển thị giao diện read-only (nếu có quyền xem) hoặc redirect về Dashboard với thông báo "Không có quyền truy cập".

**E-2. Validation thất bại**
- Số ngày phép âm, mã loại phép trùng, hoặc thiếu trường bắt buộc.
- Hệ thống hiển thị lỗi chi tiết và không lưu.

### Business Rules
- BRULE-005: Định mức ngày phép lấy từ `LeaveType.DefaultDays`, không hardcode.
- Chỉ QTHT mới có quyền ghi cấu hình.

---

## UC-06: Thống kê báo cáo nghỉ phép

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case ID** | UC-06 |
| **Tên Use case** | Thống kê báo cáo nghỉ phép |
| **Tác nhân chính** | GĐ/PGĐ |
| **Mô tả** | Giám đốc/Phó giám đốc xem tổng quan, số liệu báo cáo nghỉ phép của toàn bộ cán bộ theo phòng ban, loại phép, thời gian (tháng/quý), lọc theo trạng thái đơn và xuất báo cáo ra file Excel. |

### Pre-conditions
- GĐ/PGĐ đã đăng nhập thành công.
- Hệ thống có dữ liệu đơn nghỉ phép để thống kê.

### Post-conditions
**Thành công:**
- Báo cáo được hiển thị với KPI cards, biểu đồ và bảng dữ liệu.
- File Excel được xuất thành công với định dạng đúng (bold header, auto-width, auto-filter, UTF-8).

**Thất bại:**
- Hệ thống hiển thị thông báo lỗi nếu xuất file thất bại hoặc không có dữ liệu.

### Basic Flow (Luồng chính) — Xem báo cáo
1. GĐ/PGĐ truy cập chức năng "Báo cáo" (`/reports`).
2. Hệ thống hiển thị KPI cards: Tổng ngày nghỉ đã duyệt, Tỷ lệ duyệt (%), Đơn bị từ chối.
3. Hệ thống hiển thị biểu đồ cột (BarChart): ngày nghỉ theo phòng ban.
4. Hệ thống hiển thị biểu đồ tròn (PieChart): phân bổ theo loại phép.
5. GĐ/PGĐ lọc báo cáo theo trạng thái đơn: đã duyệt, chưa duyệt, bị từ chối.
6. GĐ/PGĐ chọn kỳ báo cáo (tháng/quý/năm) qua period selector.
7. Hệ thống tính toán lại số liệu theo kỳ đã chọn.

### Alternative Flows (Luồng thay thế)

**A-1. Xem số liệu theo phòng ban**
1. Tại biểu đồ cột, GĐ/PGĐ hover/click vào cột của một phòng.
2. Hệ thống hiển thị tooltip/chi tiết số ngày nghỉ của phòng đó.

**A-2. Xem số liệu theo loại phép**
1. Tại biểu đồ tròn, GĐ/PGĐ xem tỷ lệ phân bổ các loại phép (phép năm, nghỉ bệnh, không lương...).

**A-3. Xuất báo cáo ra Excel**
1. GĐ/PGĐ nhấn "Xuất Excel".
2. Hệ thống tạo file `.xlsx` với các cột: họ tên, phòng ban, loại phép, ngày, số ngày, trạng thái.
3. File có header in đậm (bold), cột tự động căn chỉnh độ rộng (auto-width), bật auto-filter, encoding UTF-8.
4. Hệ thống trigger download file về máy người dùng.

**A-4. Xem báo cáo theo tháng/quý**
1. GĐ/PGĐ chọn "Theo tháng" hoặc "Theo quý" từ selector.
2. Hệ thống aggregate số liệu theo kỳ đã chọn và cập nhật biểu đồ/KPI.

### Exception Flows (Luồng ngoại lệ)

**E-1. Không có dữ liệu**
- Không có đơn nào trong kỳ/trạng thái đã chọn.
- Hệ thống hiển thị KPI = 0 và biểu đồ rỗng.

**E-2. Xuất file lỗi**
- Lỗi server hoặc dữ liệu quá lớn.
- Hệ thống hiển thị thông báo "Xuất file thất bại, vui lòng thử lại".

### Business Rules
- BRULE-001: Báo cáo tính theo ngày làm việc nếu liên quan đến số ngày nghỉ.
- Chỉ GĐ/PGĐ mới có quyền xem báo cáo toàn hệ thống.

---

## UC-07: Theo dõi số lượng ngày nghỉ phép vượt mức quy định

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case ID** | UC-07 |
| **Tên Use case** | Theo dõi số lượng ngày nghỉ phép vượt mức quy định của cán bộ và phòng ban |
| **Tác nhân chính** | GĐ/PGĐ |
| **Mô tả** | Giám đốc/Phó giám đốc tìm kiếm, xem danh sách cán bộ và phòng ban có số ngày nghỉ phép vượt quá định mức, phân loại theo lý do nghỉ, xem chi tiết cá nhân/phòng ban và tổng hợp theo tháng/quý. |

### Pre-conditions
- GĐ/PGĐ đã đăng nhập thành công.
- Định mức ngày phép đã được cấu hình (`LeaveType.DefaultDays`).

### Post-conditions
**Thành công:**
- Danh sách cán bộ/phòng ban vượt mức được hiển thị chính xác.
- Số liệu vượt mức = `Tổng ngày đã duyệt - Định mức`.
- Phân loại vượt mức theo lý do nghỉ được hiển thị trên biểu đồ.

**Thất bại:**
- Hệ thống hiển thị thông báo lỗi nếu dữ liệu không đủ.

### Basic Flow (Luồng chính) — Xem danh sách vượt mức
1. GĐ/PGĐ truy cập chức năng "Giám sát vi phạm" (`/violations`).
2. Hệ thống hiển thị 4 KPI cards: số CB vượt mức, số phòng ban có vi phạm, tổng ngày vượt toàn cơ quan, kỳ thống kê hiện tại.
3. Hệ thống hiển thị biểu đồ tròn: phân loại vượt mức theo lý do nghỉ.
4. Hệ thống hiển thị biểu đồ cột: số ngày vượt mức theo phòng ban.
5. Hệ thống hiển thị bảng cấp phòng ban: tên phòng, tổng CB, CB vượt mức, tổng ngày đã duyệt, định mức (= tổng CB × `LeaveType.DefaultDays`), số ngày vượt, nút xem chi tiết.
6. Hệ thống hiển thị bảng cấp cá nhân: tên, phòng ban, định mức, đã sử dụng, vượt, phân loại theo lý do (badges), nút xem chi tiết.
7. GĐ/PGĐ chọn kỳ thống kê (năm/quý/tháng) qua selector.
8. Hệ thống tính toán lại và cập nhật bảng/biểu đồ.

### Alternative Flows (Luồng thay thế)

**A-1. Tìm kiếm cán bộ/phòng ban**
1. GĐ/PGĐ nhập tên cán bộ hoặc chọn phòng ban trong ô tìm kiếm.
2. Hệ thống lọc bảng cá nhân/phòng ban theo điều kiện.

**A-2. Xem số ngày vượt mức của từng cá nhân**
1. Tại bảng cá nhân, GĐ/PGĐ click "Xem chi tiết" một cán bộ.
2. Hệ thống mở dialog hiển thị: thông tin cá nhân + bảng các đơn (loại phép, ngày, số ngày, lý do).

**A-3. Xem số ngày vượt mức của từng phòng ban**
1. Tại bảng phòng ban, GĐ/PGĐ click "Xem chi tiết" một phòng.
2. Hệ thống mở dialog hiển thị: tổng quan phòng + phân loại theo lý do + danh sách CB vượt mức trong phòng.

**A-4. Xem phân loại theo lý do nghỉ**
1. Hệ thống hiển thị badges phân loại trên bảng cá nhân: bệnh, thai sản, công tác...
2. Biểu đồ tròn phân bổ tỷ lệ vượt mức theo từng lý do.

**A-5. Xem tổng số ngày vượt mức toàn cơ quan**
1. Tại KPI card "Tổng ngày vượt toàn cơ quan", GĐ/PGĐ xem tổng hợp tất cả các phòng ban.

**A-6. Xem vượt mức trong tháng/quý**
1. GĐ/PGĐ chọn filter kỳ (tháng hoặc quý) từ selector.
2. Hệ thống tính toán lại số ngày vượt mức chỉ trong kỳ đã chọn.

### Exception Flows (Luồng ngoại lệ)

**E-1. Không có vi phạm**
- Không có cán bộ/phòng ban nào vượt mức trong kỳ đã chọn.
- Hệ thống hiển thị KPI = 0 và bảng rỗng.

**E-2. Định mức chưa được cấu hình**
- `LeaveType.DefaultDays` chưa được thiết lập.
- Hệ thống hiển thị thông báo "Vui lòng cấu hình định mức ngày phép trước khi xem vi phạm".

### Business Rules
- BRULE-005: Định mức từ `LeaveBalance.TotalDays` (nguồn truth: `LeaveType.DefaultDays`), không hardcode 12.
- Chỉ tính đơn `approved` (leader/director), không tính `pending`/`rejected`/`cancelled`.
- Overage = total_used - LeaveBalance.TotalDays, per user.
