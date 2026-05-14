---
title: Kế hoạch 2 tuần — Hoàn tất migration Supabase → .NET + Embed/Token
status: planned
priority: P0
effort: large
branch: feat/efcore-migration-net9-fastendpoints
tags: [dotnet, fastendpoints, supabase-removal, embed, postmessage, gateway-auth]
created: 2026-05-14
start: 2026-05-14
end: 2026-05-27
source:
  - docs/vision/brd.md
  - docs/vision/srs.md
  - plans/reports/scout-260514-0446-brd-and-srs.md
---

# Kế hoạch 2 tuần — Finalize Migration + Embed Token

## Mục tiêu

1. **Bỏ Supabase hoàn toàn**: xóa thư mục `packages/web/supabase/`, gỡ deps còn dư, verify `grep -r "supabase" packages/` = 0
2. **Hoàn thiện backend .NET**: implement 17 FastEndpoints theo VSP (hiện 0/17 file `.cs`)
3. **Embed/Token**: app chạy trong iframe nhận token qua `postMessage`; dev mode có UI nhập token thủ công + fallback admin local

## Tham chiếu

- BRD: [docs/vision/brd.md](../../docs/vision/brd.md) — BR-001 → BR-006, AC-001 → AC-016
- SRS: [docs/vision/srs.md](../../docs/vision/srs.md) — FR-01 → FR-10
- Plan cũ: [plans/260513-0221-dotnet-migration-refactor/plan.md](../260513-0221-dotnet-migration-refactor/plan.md)

## Trạng thái khởi điểm (2026-05-14)

| Hạng mục | Trạng thái | Ghi chú |
|----------|------------|---------|
| API scaffold + EF Core + Entities | ✅ Done | 7 entities, AppDbContext, Migrations |
| System tables (`USER_MASTER`, `DM_DONVI`) read-only | ✅ Done | |
| `CurrentUserMiddleware` + dev fallback | ✅ Done | Cần verify gateway headers parse |
| Frontend `api/client.ts` + AuthContext | ✅ Done | Đã listen postMessage |
| **Backend Endpoint `.cs` files (17 cái)** | ❌ **0%** | Blocker chính |
| Supabase folder cleanup | ❌ Pending | `packages/web/supabase/` còn config + migrations |
| Dev mode token input UI | ❌ Pending | Chưa có form nhập token |
| Tests (unit + integration) | ❌ Pending | |
| Docs sync (`docs/`) | 🟡 Partial | Roadmap cần update |

---

## Tuần 1 — Backend Endpoints + Auth Wiring

### Day 1 (2026-05-14, Thứ 5) — Auth slice + smoke test

**[UPDATED] Approach changed: Gateway headers → JWT Bearer**

- [x] `packages/api/QLNP.Api.csproj` — add `Microsoft.AspNetCore.Authentication.JwtBearer` v10.0.8
- [x] `appsettings.json` / `appsettings.Development.json` — replace `GatewayHeaders` with `Jwt: { Issuer, Audience, SigningKey }`
- [x] `Program.cs` — `AddAuthentication(JwtBearerDefaults).AddJwtBearer(...)` + `UseAuthentication()` + `UseAuthorization()`
- [x] `Middleware/CurrentUser.cs` — update record shape to match JWT claims: `(UserId, DisplayName, UnitId, PhongBanId, DeviceId, Roles, UserIdUBTP, PhongBanIdUBTP, DonViIdUBTP)`
- [x] `Auth/ICurrentUserProvider.cs` + `Auth/CurrentUserProvider.cs` — typed provider reading `ClaimsPrincipal` from JWT
- [x] `Features/Auth/Me/MeEndpoint.cs` — inject `ICurrentUserProvider`; remove `HttpContext.Items["CurrentUser"]` usage
- [x] **Deleted** `Middleware/CurrentUserMiddleware.cs` — no longer needed
- [x] `dotnet build packages/api` — 0 errors, 0 warnings
- [x] Commit: `feat(api): replace gateway header auth with JWT + ICurrentUserProvider` (933511c)
- [x] Docs commit: `docs(planning): add 2-week migration plan + JWT auth plan` (92bfee8)

### Day 2 (2026-05-15, Thứ 6) — LeaveTypes slice (4 endpoints)

- [x] `Features/LeaveTypes/List/ListLeaveTypesEndpoint.cs` — GET `/api/leave-types`
- [x] `Features/LeaveTypes/Create/CreateLeaveTypeEndpoint.cs` — POST, FluentValidation (Name, Code unique, DefaultDays > 0), role guard QTHT
- [x] `Features/LeaveTypes/Update/UpdateLeaveTypeEndpoint.cs` — PUT `/api/leave-types/{id}`
- [x] `Features/LeaveTypes/Delete/DeleteLeaveTypeEndpoint.cs` — DELETE, chặn xóa nếu có `LeaveRequests` tham chiếu
- [x] Commit

### Day 3 (2026-05-18, Thứ 2) — LeaveRequests P1 (List/Create/Update)

- [ ] `Features/LeaveRequests/List/ListLeaveRequestsEndpoint.cs` — role-based filtering (CB.PCM own / LD.PCM dept / GD.PGD all)
- [ ] `Features/LeaveRequests/Create/CreateLeaveRequestEndpoint.cs` — validator: start ≤ end, start ≥ today, reason non-empty; tính business days (Mon-Fri); detect overlap với approved
- [ ] `Features/LeaveRequests/Update/UpdateLeaveRequestEndpoint.cs` — chỉ sửa khi status=pending (BRULE-007)
- [ ] Commit

### Day 4 (2026-05-19, Thứ 3) — LeaveRequests P2 (Approve/Reject/Cancel)

- [ ] `Features/LeaveRequests/Approve/ApproveLeaveRequestEndpoint.cs` — state machine: pending→approved_leader (LD.PCM) / approved_leader→approved_director (GD.PGD); cập nhật `LeaveBalances.UsedDays` khi approved_director (FR-052)
- [ ] `Features/LeaveRequests/Reject/RejectLeaveRequestEndpoint.cs` — set status=rejected + `rejected_reason`
- [ ] `Features/LeaveRequests/Cancel/CancelLeaveRequestEndpoint.cs` — chỉ cancel khi status ∈ {pending, approved_leader} (BRULE-006)
- [ ] Commit

### Day 5 (2026-05-20, Thứ 4) — LeaveBalances + Config slices

- [ ] `Features/LeaveBalances/List/ListLeaveBalancesEndpoint.cs` — GET `/api/leave-balances`, role GD.PGD
- [ ] `Features/LeaveBalances/My/MyLeaveBalanceEndpoint.cs` — GET `/api/leave-balances/my`
- [ ] `Features/Config/Get/GetConfigEndpoint.cs` — đọc cấu hình
- [ ] `Features/Config/Update/UpdateConfigEndpoint.cs` — upsert (FR-10.7), role QTHT
- [ ] `Features/Config/UserRole/UpdateUserRoleEndpoint.cs` — sửa `UserRoles`, role QTHT
- [ ] Commit; `dotnet build` clean; test toàn bộ 17 endpoints qua `.http`

---

## Tuần 2 — Embed/Token, Supabase Cleanup, Tests, Release

### Day 6 (2026-05-21, Thứ 5) — Dev token input UI

- [ ] `packages/web/src/contexts/AuthContext.tsx` — bổ sung `setManualToken(token: string)` method
- [ ] `packages/web/src/pages/LoginPage.tsx` — thêm UI nhập token thủ công khi **không** ở chế độ embed VÀ `import.meta.env.DEV === true`:
  - Input field "JWT/Dev Token"
  - Button "Đăng nhập với token"
  - Lưu vào `localStorage.jwt` → gọi `authApi.me()` → redirect `/`
- [ ] Vẫn giữ logic embed (postMessage listener) như cũ
- [ ] Test thủ công: chạy `pnpm dev`, nhập token dev, vào dashboard OK
- [ ] Commit: `feat(web): add manual token input for dev mode`

### Day 7 (2026-05-22, Thứ 6) — Host integration sample + iframe smoke test

- [ ] Tạo `packages/web/public/embed-host-sample.html` — trang demo host: textarea token + button "Send via postMessage" + iframe trỏ về `/`
- [ ] Verify flow: mở `embed-host-sample.html` → gửi `{ type: "auth", token }` → iframe gọi `/api/auth/me` → dashboard hiển thị
- [ ] Doc cho host team: `docs/embed-integration.md` (≤ 200 dòng) — postMessage contract, gateway headers expected, CSP/X-Frame-Options note
- [ ] Commit

### Day 8 (2026-05-25, Thứ 2) — Supabase removal

- [ ] Xóa `packages/web/supabase/` toàn bộ (config.toml + migrations/)
- [ ] Gỡ deps khỏi `packages/web/package.json`: `@supabase/supabase-js` nếu còn
- [ ] `pnpm install` → `pnpm -F @qlnp/web build` không lỗi
- [ ] Verify: `grep -r "supabase" packages/ --include="*.ts" --include="*.tsx" --include="*.json"` = 0 kết quả (AC: tiêu chí nghiệm thu BRD §9.1)
- [ ] Cập nhật `README.md` — bỏ phần Supabase setup
- [ ] Commit: `chore(web): remove supabase folder and dependencies`

### Day 9 (2026-05-26, Thứ 3) — Integration testing + bug fixes

- [ ] E2E flow theo AC-001 → AC-016:
  - [ ] AC-005 tạo đơn → list
  - [ ] AC-006 trùng lịch → 409
  - [ ] AC-007/008 approve 2 cấp + cộng dồn used_days
  - [ ] AC-009 reject có lý do
  - [ ] AC-010 cancel
  - [ ] AC-011 role filtering (LD.PCM chỉ thấy dept)
  - [ ] AC-014 embed: postMessage → me → dashboard
- [ ] Fix bug DTO mismatch frontend↔backend nếu có
- [ ] Commit

### Day 10 (2026-05-27, Thứ 4) — Tests + docs + release

- [ ] Unit tests: business days calculation, overlap detection, state machine transitions (`packages/api.tests/` hoặc xUnit project)
- [ ] Integration test mẫu cho `CurrentUserMiddleware` (header vs DevMode fallback)
- [ ] Cập nhật `docs/development-roadmap.md` — đánh dấu phase 1 + 2 Complete
- [ ] Cập nhật `docs/project-changelog.md` — entry migration done
- [ ] Cập nhật `docs/system-architecture.md` nếu cần
- [ ] Tag release `v1.0.0-dotnet-migration`; merge `feat/efcore-migration-net9-fastendpoints` → `main`
- [ ] Commit + PR

---

## Checklist nghiệm thu (BRD §9.1)

- [ ] 17/17 FastEndpoints hoạt động, response format consistent
- [ ] `grep -r "supabase" packages/web/src/` = 0
- [ ] `packages/web/supabase/` xóa hoàn toàn
- [ ] QLNP không lưu/verify password (đảm bảo không có endpoint `/login` nhận password)
- [ ] Embed flow: host postMessage → `/api/auth/me` → dashboard hoạt động
- [ ] Dev mode token input UI hoạt động khi `import.meta.env.DEV`
- [ ] Approval 2 cấp đúng state machine; business days đúng (bỏ T7/CN)
- [ ] UI giữ nguyên layout
- [ ] `dotnet build` + `pnpm build` không lỗi

## Rủi ro & Mitigation

| Rủi ro | Mức độ | Mitigation |
|--------|--------|-----------|
| DTO frontend mismatch backend khi build endpoints | High | Day 9 dành riêng cho integration fix; align từng slice ngay khi viết endpoint |
| `CurrentUserMiddleware` parse header sai trong production | Medium | Day 1 verify với mock headers; Day 7 viết doc rõ cho host team |
| LeaveBalances.UsedDays cộng dồn sai khi approve | Medium | Unit test ở Day 10; thử AC-008 ở Day 9 |
| Supabase migrations folder có info hữu ích cho SQL Server migration | Low | Backup folder ra `archive/` trước khi xóa nếu cần tham chiếu |
| Iframe bị block bởi X-Frame-Options | Medium | Day 7 cấu hình ASP.NET `Content-Security-Policy: frame-ancestors` cho host domain |

## Quyết định kỹ thuật (chốt 2026-05-14)

1. **Định mức ngày nghỉ**: KHÔNG hardcode 12. Nguồn truth: `LeaveType.DefaultDays` → seed/upsert vào `LeaveBalance.TotalDays` cho từng user-leaveType-year. Frontend đọc `LeaveBalance.TotalDays - LeaveBalance.UsedDays` (FR-02.5, FR-09 dùng cùng nguồn).
2. **`ApprovedBy` ambiguity**: tách field `RequestedApproverId` + `ActualApproverId` **DEFER** ra sprint sau, NHƯNG sprint này **PHẢI FIX**: khi `Create` đơn lưu approver được chọn vào field tạm `RequestedApproverId` (nullable); khi `Approve`/`Reject` ghi đè `ApprovedBy` = current user (người duyệt thực tế). Tránh nhập nhằng nghĩa.
3. **Endpoint approve/reject**: dùng **sub-resource** `PUT /api/leave-requests/{id}/approve` và `/reject` (theo BRD Appendix B).
4. **CSP `frame-ancestors`**: cấu hình qua env var `Security:FrameAncestors` (CSV domains) trong `appsettings.json`. Sprint này wire sẵn middleware đọc env var; danh sách domain cụ thể chờ Host Team — tạm để `'self'` cho dev.

## Action items phát sinh từ quyết định

- **Day 3 (Create)**: thêm field `RequestedApproverId` (nullable Guid) vào `LeaveRequest` entity + migration nhỏ; lưu khi tạo đơn
- **Day 4 (Approve/Reject)**: ghi `ApprovedBy = currentUser.Id` (không dùng giá trị từ request body)
- **Day 5 (Config + LeaveTypes/Balances)**: thêm logic seed/upsert `LeaveBalance` khi:
  - Tạo `LeaveType` mới → tạo balance cho toàn bộ user-năm hiện tại với `TotalDays = DefaultDays`
  - Job khởi đầu năm (manual endpoint hoặc startup task) → tạo balance năm mới
  - Hoặc lazy: khi `GetMyBalance` không thấy row → tự seed
- **Day 6 (Frontend)**: bỏ hardcode `12` trong FR-02.5 dashboard, FR-09.1 violations → đọc `LeaveBalance.TotalDays`
- **Day 1 hoặc Day 7 (Security)**: middleware/header set `Content-Security-Policy: frame-ancestors ${env:Security:FrameAncestors}` + `X-Frame-Options` tương ứng

## Unresolved Questions

- ~~Domain cụ thể để whitelist trong `Security:FrameAncestors` (chờ Host Website Team)~~ → **Không block sprint** — cơ chế env var `Security:FrameAncestors` đã wire sẵn, Host Team cung cấp domain list bất cứ lúc nào
- Seed `LeaveBalance` cho năm mới: **xu hướng lazy + manual endpoint QTHT** (YAGNI, không dùng background job) — sẽ chốt rõ ở Day 5 khi implement Config/Balances slice
