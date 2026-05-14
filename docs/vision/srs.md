# Software Requirements Specification (SRS) - QLNP-TTCDS

**Version:** 1.1 | **Date:** 2026-05-14 | **Author:** Generated from codebase analysis

---

## 1. Introduction

### 1.1 Purpose
SRS này mô tả đầy đủ yêu cầu chức năng và phi chức năng của Hệ Thống Quản Lý Nghỉ Phép (QLNP-TTCDS) dành cho Trung Tâm Chuyển Đổi Số. Mục đích chính: thay thế quy trình xin nghỉ phép thủ công bằng hệ thống số hóa toàn diện.

### 1.2 Scope
- **In scope:** Tạo đơn nghỉ phép, phê duyệt đa cấp, theo dõi lịch nghỉ, tổng hợp báo cáo, giám sát vi phạm (vượt định mức ngày nghỉ), cấu hình hệ thống
- **Out of scope:** Chấm công, bảng lương, tích hợp calendar bên thứ 3 (Google/Microsoft), mobile app native, SSO/LDAP integration

### 1.3 Definitions & Acronyms

| Term | Definition |
|------|------------|
| CB.PCM | Cán bộ phòng chuyên môn - nhân viên thường |
| LD.PCM | Lãnh đạo phòng chuyên môn - trưởng/phó phòng |
| GD.PGD | Giám đốc / Phó giám đốc - lãnh đạo cao nhất |
| QTHT | Quản trị hệ thống - IT admin |
| RLS | Row Level Security (PostgreSQL) |
| Business days | Ngày làm việc (T2-T6), dùng để tính số ngày nghỉ |
| Định mức | 12 ngày/cán bộ/năm |

---

## 2. Overall Description

### 2.1 System Architecture
- **Platform:** Single Page Application (SPA) React 18 + Vite 5
- **Backend:** .NET 9 + FastEndpoints + Vertical Slice Pattern (VSP) + EF Core 9 + SQL Server
- **Architecture Pattern:** Vertical Slice Pattern — code tổ chức theo use case (Me, CreateLeaveRequest, ApproveLeaveRequest...) thay vì layer ngang (Controllers/Services/Repositories). Mỗi feature là một slice khép kín chứa Endpoint + Request + Response + Validator nếu cần, và handler logic ngay trong endpoint
- **API Framework:** FastEndpoints — REPR pattern (Request-EndPoint-Response), mỗi endpoint là 1 class kế thừa `Endpoint<TRequest, TResponse>`
- **Styling:** Tailwind CSS 3 + shadcn/ui (Radix UI)
- **State Management:** Zustand 5 (client) + TanStack React Query 5 (server cache)
- **Auth:** SSO/gateway-based. Frontend nhận token host qua postMessage, API resolve current user qua gateway headers bằng `CurrentUserMiddleware`; dev mode có fallback admin local

### 2.2 User Roles & Access Matrix

| Feature | CB.PCM | LD.PCM | GD.PGD | QTHT |
|---------|--------|--------|--------|------|
| Dashboard + Calendar | R/W own | R/W dept | R all | R all |
| Tạo đơn nghỉ phép | W own | W own | — | — |
| Xem đơn của mình | R own | R own | — | — |
| Sửa/Hủy đơn (pending) | W own | W own | — | — |
| Phê duyệt cấp phòng | — | W dept | W all | W all |
| Phê duyệt cấp giám đốc | — | — | W all | W all |
| Tổng hợp (Summary) | — | — | R all | — |
| Báo cáo (Reports) | — | — | R all | — |
| Vi phạm (Violations) | — | — | R all | — |
| Cấu hình hệ thống | — | — | — | R/W |

### 2.3 Operating Environment
- Browser: Chrome, Firefox, Edge (last 2 versions)
- Devices: Desktop + Tablet + Mobile (responsive)
- Language: Tiếng Việt (UI + data)

---

## 3. Functional Requirements

### FR-01: Authentication (SSO/Gateway)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01.1 | Frontend nhận token host qua `postMessage({ type: "auth", token })` khi chạy trong iframe | P0 |
| FR-01.2 | Token host lưu trong AuthContext/localStorage và tự động gắn Authorization header cho API calls | P0 |
| FR-01.3 | Auth state lưu trong AuthContext, tự redirect về /login hoặc màn hình chờ SSO nếu chưa resolve được user | P0 |
| FR-01.4 | Hiển thị thông tin user: họ tên, phòng ban, chức vụ, role trong header | P1 |
| FR-01.5 | Logout xóa token + state, redirect về login/màn hình chờ SSO | P0 |
| FR-01.6 | API chỉ resolve user tồn tại trong `USER_MASTER` và role hợp lệ trong `UserRoles` | P0 |
| FR-01.7 | `CurrentUserMiddleware` đọc gateway headers cấu hình được: `X-User-Id`, `X-User-Name`, `X-User-FullName` | P0 |
| FR-01.8 | Dev mode fallback trả user admin local khi `DevMode:Enabled=true` | P1 |

**Verification:** Test iframe postMessage token, `/api/auth/me` với gateway headers hợp lệ/thiếu, DevMode bật/tắt, logout clear token.

---

### FR-02: Dashboard (Trang chủ)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-02.1 | Hiển thị 4 KPI cards: ngày phép còn lại, đơn chờ duyệt, đơn đã duyệt, tổng ngày đã nghỉ | P0 |
| FR-02.2 | Số liệu được tính theo role — CB.PCM thấy của mình, LD.PCM thấy của phòng, GD.PGD/QTHT thấy toàn hệ thống | P0 |
| FR-02.3 | Hiển thị 8 hoạt động gần đây nhất (tên NV, loại phép, ngày, trạng thái) | P1 |
| FR-02.4 | Quick action buttons: Tạo đơn, Phê duyệt (kèm badge count), Xem lịch | P1 |
| FR-02.5 | Ngày phép còn lại hardcoded = 12 - tổng ngày đã nghỉ được duyệt | P0 |

**Verification:** Truy cập với từng role, kiểm tra số liệu KPI khớp với dữ liệu thực tế trong DB.

---

### FR-03: Tạo Đơn Nghỉ Phép (LeaveNew)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-03.1 | Form: chọn loại phép (dropdown từ `LeaveTypes` active), ngày start/end, lý do, người phê duyệt | P0 |
| FR-03.2 | Tính số ngày nghỉ = business days (T2-T6) giữa start_date và end_date, tối thiểu 1 | P0 |
| FR-03.3 | Validation: start <= end, start >= today, lý do không rỗng, phải chọn loại phép, phải chọn người duyệt | P0 |
| FR-03.4 | Phát hiện trùng lịch: check ngày nghỉ mới có overlap với đơn đã approved không | P0 |
| FR-03.5 | Danh sách người phê duyệt lọc từ `LeaveConfigs` theo loại phép đã chọn: hiển thị approver role + cùng phòng ban nếu LD.PCM | P0 |
| FR-03.6 | Submit tạo đơn với status "pending", redirect về /leave/my | P0 |
| FR-03.7 | Không cho chọn ngày quá khứ | P1 |

**Verification:** Test tạo đơn hợp lệ, trùng lịch, thiếu field bắt buộc, ngày quá khứ.

---

### FR-04: Danh Sách Đơn Của Tôi (LeaveMy)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-04.1 | Hiển thị tất cả đơn của user hiện tại dạng bảng: STT, loại phép, start/end, số ngày, lý do, trạng thái, ngày gửi, thao tác | P0 |
| FR-04.2 | Filter theo trạng thái: Tất cả, Chờ duyệt, LĐ đã duyệt, GĐ đã duyệt, Từ chối, Đã hủy | P1 |
| FR-04.3 | Sửa đơn (chỉ khi status = "pending"): mở dialog, cho phép sửa loại phép, ngày, lý do, người duyệt, có validation + check trùng lịch, lưu và reset status về "pending" | P0 |
| FR-04.4 | Hủy đơn (chỉ khi status = "pending"): set status = "cancelled" | P0 |
| FR-04.5 | Các đơn không còn "pending" không hiển thị nút thao tác | P1 |

**Verification:** Test filter, sửa/hủy đơn pending, verify không sửa được đơn đã duyệt.

---

### FR-05: Phê Duyệt Đơn (Approval)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-05.1 | Hiển thị danh sách đơn "pending", lọc theo role: LD.PCM chỉ thấy đơn cùng phòng (không phải của mình), GD.PGD/QTHT thấy tất cả | P0 |
| FR-05.2 | Bảng: STT, họ tên, phòng ban, loại phép, từ/đến ngày, số ngày, lý do, ngày gửi, thao tác | P0 |
| FR-05.3 | Tìm kiếm theo tên cán bộ | P1 |
| FR-05.4 | Phê duyệt: set status = "approved_leader" (nếu LD.PCM) hoặc "approved_director" (nếu GD.PGD), ghi approved_by | P0 |
| FR-05.5 | Từ chối: mở dialog nhập lý do, set status = "rejected" + rejected_reason | P0 |
| FR-05.6 | Xem chi tiết đơn: dialog hiển thị đầy đủ thông tin | P1 |

**Verification:** Test phê duyệt từng cấp, từ chối có lý do, verify LD.PCM không thấy đơn phòng khác.

---

### FR-06: Lịch Nghỉ Phép (Calendar)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-06.1 | 2 chế độ xem: Calendar grid và List view, toggle qua lại | P1 |
| FR-06.2 | Calendar: hiển thị tháng, các ô ngày có màu nền nếu có người nghỉ, tên viết tắt người nghỉ, tối đa 2 người/ngày (+N nếu >2) | P1 |
| FR-06.3 | List: bảng danh sách tất cả đơn active (không cancelled/rejected), sắp xếp theo ngày bắt đầu | P1 |
| FR-06.4 | Lọc theo phòng ban | P1 |
| FR-06.5 | Điều hướng tháng bằng nút Previous/Next | P1 |
| FR-06.6 | Màu sắc phân biệt: approved (xanh lá) vs pending (vàng/cam) | P1 |

**Verification:** Test chuyển view, chuyển tháng, filter phòng ban, verify màu sắc.

---

### FR-07: Tổng Hợp Lịch Nghỉ (Summary)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-07.1 | Lọc theo năm (tự detect từ dữ liệu) và loại phép | P0 |
| FR-07.2 | Bảng tổng hợp theo phòng ban: tên phòng, tổng CB (clickable), tổng ngày phép đã duyệt (clickable) | P0 |
| FR-07.3 | Click tổng CB: dialog hiển thị danh sách cán bộ trong phòng + tổng ngày phép từng người + nút xem chi tiết từng người | P1 |
| FR-07.4 | Click tổng ngày: dialog hiển thị tất cả đơn approved của phòng: phòng ban, cán bộ, loại phép, ngày, số ngày | P1 |
| FR-07.5 | Click chi tiết từng cán bộ: dialog hiển thị các đơn của người đó | P1 |
| FR-07.6 | Biểu đồ tròn (PieChart): phân bổ ngày nghỉ theo loại phép | P1 |
| FR-07.7 | Chỉ hiển thị đơn approved (leader hoặc director) | P0 |

**Verification:** Test filter, click hierarchy (phòng -> CB -> đơn), verify số liệu khớp.

---

### FR-08: Báo Cáo Thống Kê (Reports)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-08.1 | KPI cards: Tổng ngày nghỉ đã duyệt, Tỷ lệ duyệt (%), Đơn bị từ chối | P0 |
| FR-08.2 | Biểu đồ cột (BarChart): ngày nghỉ theo phòng ban | P1 |
| FR-08.3 | Biểu đồ tròn (PieChart): phân bổ theo loại phép | P1 |
| FR-08.4 | Export CSV: tất cả đơn (họ tên, phòng ban, loại phép, ngày, số ngày, trạng thái), UTF-8 BOM | P0 |

**Verification:** Test export CSV mở được trong Excel, verify số liệu charts khớp với DB.

---

### FR-09: Giám Sát Vi Phạm (Violations)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-09.1 | Định mức: 12 ngày/cán bộ/năm | P0 |
| FR-09.2 | Filter: theo kỳ (năm/quý/tháng), có selector năm + quý hoặc tháng tùy kỳ chọn | P0 |
| FR-09.3 | Tìm kiếm theo tên cán bộ hoặc phòng ban | P1 |
| FR-09.4 | 4 KPI cards: số CB vượt mức, số phòng ban có vi phạm, tổng ngày vượt toàn cơ quan, kỳ thống kê hiện tại | P0 |
| FR-09.5 | Biểu đồ tròn: phân loại vượt mức theo lý do nghỉ | P1 |
| FR-09.6 | Biểu đồ cột: số ngày vượt mức theo phòng ban | P1 |
| FR-09.7 | Bảng cấp phòng ban: tên phòng, tổng CB, CB vượt mức, tổng ngày đã duyệt, định mức (= tổng CB × 12), vượt, nút xem chi tiết | P0 |
| FR-09.8 | Bảng cấp cá nhân: tên, phòng ban, định mức, đã sử dụng, vượt, phân loại theo lý do (badges), nút xem chi tiết | P0 |
| FR-09.9 | Dialog chi tiết cá nhân: thông tin + bảng các đơn (loại phép, ngày, số ngày, lý do) | P1 |
| FR-09.10 | Dialog chi tiết phòng ban: tổng quan + phân loại theo lý do + danh sách CB vượt mức | P1 |
| FR-09.11 | Chỉ tính đơn approved (leader/director), không tính pending/rejected/cancelled | P0 |

**Verification:** Test với dữ liệu có người vượt và không vượt, verify filter kỳ, kiểm tra công thức tính tổng ngày vượt.

---

### FR-10: Cấu Hình Hệ Thống (Config)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-10.1 | Chỉ QTHT mới có quyền ghi; role khác chỉ xem | P0 |
| FR-10.2 | **Tab Cấu hình chung:** chu kỳ tính phép (yearly/monthly), số ngày phép mặc định theo role (4 roles × input number), nút Lưu | P0 |
| FR-10.3 | **Tab Loại phép:** bảng (tên, mã, số ngày MĐ, mô tả, trạng thái toggle, nút sửa), nút Thêm, dialog CRUD | P0 |
| FR-10.4 | Toggle is_active cho loại phép (ẩn/hiện trong form tạo đơn) | P1 |
| FR-10.5 | **Tab Cấp phê duyệt:** bảng (loại phép, cấp duyệt, vai trò duyệt, nút sửa/xóa), nút Thêm, dialog CRUD | P0 |
| FR-10.6 | Approval config hỗ trợ approval_level 1,2,3... và approver_role: LD.PCM, GD.PGD, QTHT | P0 |
| FR-10.7 | Upsert logic: nếu config_key đã tồn tại thì update, chưa có thì insert | P1 |

**Verification:** Test CRUD từng tab, verify QTHT sửa được, role khác bị disable.

---

## 4. Data Requirements

### 4.1 Entity-Relationship Summary

```
DM_DONVI    1---* USER_MASTER
USER_MASTER 1---1 UserRoles
USER_MASTER 1---* LeaveRequests
USER_MASTER 1---* LeaveBalances
LeaveTypes  1---* LeaveRequests
LeaveTypes  1---* LeaveBalances
LeaveTypes  1---* LeaveConfigs
USER_MASTER 1---* LeaveRequests (ApprovedBy)
```

### 4.2 Database Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `DM_DONVI` | Phòng ban hệ thống, read-only | DonViID, MaDonVi, TenDonVi, DonViCapChaID |
| `USER_MASTER` | Người dùng hệ thống, read-only | User_MasterID, UserName, HoTen, PhongBanID, DonViID, Used |
| `UserRoles` | Vai trò QLNP theo user hệ thống | UserId (FK USER_MASTER), Role |
| `LeaveTypes` | Loại phép | Id, Name, Code (unique), DefaultDays, IsActive |
| `LeaveRequests` | Đơn nghỉ phép | Id, UserId (FK USER_MASTER), LeaveTypeId, StartDate, EndDate, TotalDays, Status, ApprovedBy (FK USER_MASTER) |
| `LeaveBalances` | Số dư phép | Id, UserId, LeaveTypeId, Year, TotalDays, UsedDays, UNIQUE(UserId, LeaveTypeId, Year) |
| `LeaveConfigs` | Cấu hình cấp duyệt | Id, LeaveTypeId, ApprovalLevel, ApproverRole |

### 4.3 Auth & Security Model

- Auth: SSO/gateway-based — host website xác thực người dùng, frontend nhận token host qua postMessage, API nhận current-user headers từ reverse proxy/gateway
- Current user: `CurrentUserMiddleware` đọc `X-User-Id`, `X-User-Name`, `X-User-FullName`, lookup `USER_MASTER` + `UserRoles`, đưa `CurrentUser` vào `HttpContext.Items`
- Password: QLNP không lưu hoặc xác minh password người dùng; password thuộc hệ thống SSO/gateway
- Authorization: Role-based trong từng FastEndpoints endpoint — kiểm tra current user + role trước khi thực thi business logic
- Middleware: `CurrentUserMiddleware` resolve user trước khi FastEndpoints xử lý request
- SQL Server: Không RLS; toàn bộ authorization ở tầng application (FastEndpoints)
- Input validation: FluentValidation tích hợp sẵn trong FastEndpoints pipeline — validate tự động trước khi vào handler

### 4.4 Data Validation Rules

| Rule | Where Applied |
|------|---------------|
| start_date <= end_date | FluentValidation (backend) + Zod (frontend) |
| start_date >= today | FluentValidation (backend) + Zod (frontend) |
| reason not empty | FluentValidation (backend) + Zod (frontend) |
| total_days >= 1 | Business logic in handler + frontend calculation |
| No overlap with approved dates | Backend query check trong handler |
| Status check constraint | Database level (CHECK constraint) |
| Unique UserId+LeaveTypeId+Year | Database unique index |
| Current user required | CurrentUserMiddleware + endpoint guard |
| Role-based endpoint access | FastEndpoints endpoint guard + role checks |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| Metric | Target |
|--------|--------|
| Initial page load | < 3s |
| Form submit response | < 1s |
| Calendar month render | < 500ms |

### 5.2 Reliability

| Metric | Target |
|--------|--------|
| Availability | 99% trong giờ hành chính |
| Data consistency | Không có orphan records (FK constraints) |
| Concurrent edits | Không handle (last-write-wins) |

### 5.3 Security

| Requirement | Status |
|-------------|--------|
| Auth required for all pages | Implemented (AuthGuard wrapper) |
| Role-based UI rendering | Implemented (conditional button/route visibility) |
| Password handling | QLNP không lưu password; xác thực thuộc SSO/gateway |
| Gateway authentication | CurrentUserMiddleware resolve user từ gateway headers |
| Role-based API authorization | Endpoint-level guard + role checks per slice |
| Input validation | FluentValidation trong FastEndpoints pipeline (auto-validate) |
| HTTPS | Dependent on hosting / reverse proxy |
| Input sanitization | EF Core parameterized queries + FluentValidation rules |

### 5.4 Usability

| Requirement | Target |
|-------------|--------|
| UI language | Tiếng Việt 100% |
| Responsive | Mobile-first (Tailwind responsive classes) |
| Learning curve | < 15 phút làm quen |
| Error feedback | Toast notifications (sonner) |

---

## 6. Verification & Testing Strategy

### 6.1 Verification Matrix

| FR | Test Type | Verification Method | Pass Criteria |
|----|-----------|---------------------|---------------|
| FR-01 | Integration + Manual | GET /api/auth/me với gateway headers hợp lệ/thiếu, postMessage token, DevMode fallback | Current user đúng, lỗi auth khi thiếu context |
| FR-02 | Integration | Load dashboard per role | KPI số liệu khớp DB query |
| FR-03 | Unit + Manual | Submit form with valid/invalid data, overlap check | Validation errors đúng, overlap detected |
| FR-04 | Integration | Edit/cancel own pending request | Status updated, DB reflect change |
| FR-05 | Integration | Approve/reject by LD.PCM, GD.PGD | Status transitions đúng, scope filter đúng |
| FR-06 | Manual | Navigate calendar, filter dept | Đúng ngày nghỉ hiển thị |
| FR-07 | Integration | Filter year/type, click drill-down | Số liệu khớp aggregate SQL |
| FR-08 | Manual | Export CSV, open in Excel | UTF-8 hiển thị đúng, đủ cột |
| FR-09 | Integration | Verify violation calculation, filter period | Overage = total_used - 12, per user |
| FR-10 | Integration | CRUD leave types, approval configs, general settings | Đúng persist trong DB |

### 6.2 Test Data Requirements
- Tối thiểu 3 phòng ban từ `DM_DONVI`
- Mỗi role ít nhất 1 user trong `USER_MASTER` + `UserRoles`
- Đơn với tất cả status: pending, approved_leader, approved_director, rejected, cancelled
- Ít nhất 1 user vượt 12 ngày/năm để test violations
- Data edge cases: đơn 1 ngày, đơn nhiều ngày, đơn cuối năm (Dec -> Jan)

### 6.3 Known Gaps (post-migration)

| Gap | Severity | Recommendation |
|-----|----------|----------------|
| Không có CSRF protection | **MEDIUM** | Add CSRF token cho mutation endpoints |
| Không có rate limiting ở gateway auth | **MEDIUM** | Thực hiện rate limit tại reverse proxy/gateway hoặc FastEndpoints PreProcessor cho mutation endpoints |
| Không có audit log | **LOW** | Log approval/rejection actions với timestamp + actor |
| Không có pagination server-side | **LOW** | Data lớn sẽ chậm load; add pagination trong handler |
| approved_by field dùng chung cho cả người duyệt được chọn và người thực tế duyệt | **MEDIUM** | Tách thành `requested_approver_id` + `actual_approver_id` |

---

## 7. Appendix

### 7.1 Route Map

| Path | Component | Access Guard |
|------|-----------|--------------|
| `/login` | LoginPage | Public |
| `/` | DashboardPage | AuthGuard |
| `/leave/new` | LeaveNewPage | AuthGuard (render only CB/LD) |
| `/leave/my` | LeaveMyPage | AuthGuard (render only CB/LD) |
| `/approval` | ApprovalPage | AuthGuard (render only LD/GD/QTHT) |
| `/calendar` | CalendarPage | AuthGuard (all) |
| `/summary` | SummaryPage | AuthGuard (render only GD) |
| `/reports` | ReportsPage | AuthGuard (render only GD) |
| `/violations` | ViolationsPage | AuthGuard (render only GD) |
| `/config` | ConfigPage | AuthGuard (render only QTHT) |
| `*` | NotFound | Public |

### 7.2 State Transitions

```
Pending ──[LD.PCM approve]──> Approved_Leader ──[GD.PGD approve]──> Approved_Director
   │                              │                                        │
   └──[Any reject]──> Rejected    └──[GD.PGD reject]──> Rejected           │
   │                                                                        │
   └──[Cancel]──> Cancelled                                                 │
```

### 7.3 FastEndpoints + VSP Backend Structure

```
packages/api/
├── Program.cs                         # AddFastEndpoints + EF Core + middleware
├── Middleware/
│   ├── CurrentUser.cs
│   └── CurrentUserMiddleware.cs       # Gateway headers + dev fallback
├── Data/
│   ├── AppDbContext.cs                # EF Core SQL Server context
│   └── Migrations/
├── Entities/
│   ├── UserMaster.cs                  # USER_MASTER read-only
│   ├── DmDonvi.cs                     # DM_DONVI read-only
│   ├── UserRole.cs
│   ├── LeaveType.cs
│   ├── LeaveBalance.cs
│   ├── LeaveRequest.cs
│   └── LeaveConfig.cs
└── Features/
    ├── Auth/Me/
    ├── LeaveTypes/{List,Create,Update,Delete}/
    ├── LeaveRequests/{List,Create,Update,Approve,Reject,Cancel}/
    ├── LeaveBalances/{List,My}/
    └── Config/{Get,Update,UserRole}/
```

**Rules:**
- No traditional MVC controllers for business APIs.
- No repository layer unless a slice has repeated query complexity that justifies extraction.
- Each slice owns its request/response DTOs, validation, authorization checks, EF Core query, and response mapping.

### 7.4 References
- `./docs/project-overview-pdr.md` — Product Development Requirements
- `./docs/system-architecture.md` — System Architecture (TO-BE)
- `./docs/code-standards.md` — Code Standards
- `./docs/vision/brd.md` — Business Requirements Document (migration plan)
- `./README.md` — Quick start guide
