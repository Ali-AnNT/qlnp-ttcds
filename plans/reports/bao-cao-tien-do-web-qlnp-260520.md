# BÁO CÁO: TÌNH TRẠNG WEB QLNP-TTCDS

**Ngày báo cáo:** 2026-05-20
**Mã dự án:** qlnp-ttcds
**Phiên bản hệ thống:** v0.3.0
**Deadline mục tiêu:** 2026-06-05

---

## TÓM TẮT

Tiến độ dự án **~85%**. Backend đã implement 20/20 endpoint và build sạch (0 error/0 warning). Frontend hoàn tất 11 page UI, Supabase đã gỡ sạch hoàn toàn.

Tuy nhiên, tích hợp frontend-backend còn **3 khe hở nghiêm trọng** liên quan đến multi-role DTO mismatch, approval workflow cấp 2 bị thiếu UI, và endpoint cập nhật UserRole chưa có.

---

## 1. TIẾN ĐỘ TỔNG QUAN

```
[████████████████████░░░░]  ~85%
```

| Lớp | Đã hoàn thành | Còn lại |
|-----|---------------|---------|
| **Backend (.NET 10)** | 20/20 endpoint `.cs` files | 0 endpoint chưa code; thiếu PUT UserRole |
| **Frontend (React 18)** | 11 pages, 48 shadcn components, API layer | Fix DTO mismatch, hardcode data, role filter |
| **Auth** | JWT Bearer + ICurrentUserProvider + postMessage embed | Dev token input UI |
| **Tích hợp E2E** | Chưa chạy | Cần verify full flow tạo đơn → duyệt 2 cấp |
| **Docs/Sync** | Partial | Changelog, roadmap cần update |

---

## 2. MODULE ĐÃ HOÀN THÀNH

### Backend (packages/api)

| Feature | Endpoints | Trạng thái |
|---------|-----------|------------|
| Auth/Me | GET /api/auth/me | Done (JWT claims + dev fallback) |
| LeaveTypes | GET/POST/PUT/DELETE /api/leave-types | Done (QTHT role-guarded) |
| LeaveRequests | GET /api/leave-requests | Done (role-filtered, eager loading) |
| LeaveRequests | POST /api/leave-requests | Done (business days + overlap check) |
| LeaveRequests | PUT /api/leave-requests/{id} | Done (pending-only, owner check) |
| LeaveRequests | POST /api/leave-requests/{id}/approve | Done (state machine: pending→approved_leader→approved_director) |
| LeaveRequests | POST /api/leave-requests/{id}/reject | Done (LD.PCM/GD.PGD dual-role auto-select) |
| LeaveRequests | POST /api/leave-requests/{id}/cancel | Done (owner-only, status guard) |
| LeaveBalances | GET /api/leave-balances | Done (GD.PGD/QTHT/LD.PCM) |
| LeaveBalances | GET /api/leave-balances/my | Done (per-user) |
| Config | GET /api/config | Done (read-all) |
| Config | PUT /api/config | Done (QTHT, replace-all) |
| Config | GET /api/config/user-role/{userId} | Done (read-only) |
| Departments | GET /api/departments, /api/departments/{id} | Done (list + detail) |

- **Build status:** `dotnet build` → 0 Warning(s), 0 Error(s).
- **Supabase dependency:** `grep -r "supabase" packages/` = 0 kết quả.

### Frontend (packages/web)

| Page | Route | Trạng thái |
|------|-------|------------|
| LoginPage | /login | Done (embed detect + "waiting for SSO") |
| DashboardPage | / | Done (UI sẵn, còn hardcode metric) |
| LeaveNewPage | /leave/new | Done (form + validation + overlap detection) |
| LeaveMyPage | /leave/my | Done (list + filter + edit/cancel) |
| ApprovalPage | /approval | Done (UI sẵn, filter cần sửa) |
| CalendarPage | /calendar | Done |
| SummaryPage | /summary | Done |
| ReportsPage | /reports | Done (KPI + charts + CSV export) |
| ViolationsPage | /violations | Done (KPI + charts + drill-down dialogs) |
| ConfigPage | /config | Done (3-tab UI, saveGeneralConfig mock) |

---

## 3. TASK CÒN LẠI (ĐẾN 05/06)

| # | Task | Mức độ | Owner gợi ý | Ưu tiên |
|---|------|--------|-------------|---------|
| 3.1 | **AuthUser DTO mismatch** — đổi `role: string` → `roles: string[]`, refactor toàn bộ page filter | Medium | Frontend | **P0 — CRITICAL** |
| 3.2 | **Approval cấp 2 missing UI** — thêm bảng `approved_leader` cho GD.PGD trong ApprovalPage | Medium | Frontend | **P0 — CRITICAL** |
| 3.3 | **PUT /api/config/user-role/{id}** — implement endpoint cập nhật role user | Low | Backend | P1 |
| 3.4 | **Dev token input UI** — LoginPage thêm form nhập JWT thủ công khi `import.meta.env.DEV` | Low | Frontend | P1 |
| 3.5 | **Fix Dashboard hardcode `12`** — metric "ngày phép còn lại" lấy từ `LeaveBalance.TotalDays` | Low | Frontend | P1 |
| 3.6 | **Fix ConfigPage saveGeneralConfig** — thay mock bằng API call thực (nếu endpoint tồn tại) | Low | Frontend | P2 |
| 3.7 | **Xóa `packages/web/supabase/`** | Low | DevOps/Build | P2 |
| 3.8 | **Integration test E2E** — script chạy full flow: tạo đơn → duyệt cấp 1 → duyệt cấp 2 → verify Dashboard/Violations | High | QA/Dev | **P0 — CRITICAL** |
| 3.9 | **Docs sync** — cập nhật project-roadmap.md, project-changelog.md | Low | Docs | P2 |

---

## 4. RỦI RO PHÂN TÍCH

| # | Rủi ro | Mức độ | Mô tả kỹ thuật | Khi nào trigger? |
|---|--------|--------|---------------|------------------|
| **R1** | AuthUser `role` vs `roles` mismatch | **HIGH** | Backend trả `roles: List<string>`. Frontend `AuthUser` dùng `role: string`. Check `user.role === "CB.PCM"` fail với user multi-role. | Production, khi user có >=2 role |
| **R2** | GD.PGD không thấy đơn `approved_leader` | **HIGH** | ApprovalPage chỉ filter `status === "pending"`. GD.PGD cần approve cấp 2 từ `approved_leader` — không có UI. | Khi LD.PCM duyệt xong, GD.PGD vào trang approval |
| **R3** | Không cập nhật UserRoles từ ConfigPage | **MEDIUM** | `Config/UserRole/Endpoint.cs` chỉ implement GET. ConfigPage cần CRUD role nhưng backend không có PUT. | QTHT mở tab cấu hình, sửa role user |
| **R4** | Dashboard metric sai | **LOW** | `12 - totalDaysUsed` hardcode thay vì `LeaveBalance.TotalDays - UsedDays`. | Khi `LeaveType.DefaultDays` != 12 |
| **R5** | ConfigPage saveGeneralConfig no-op | **LOW** | `saveGeneralConfig` là TODO mock, không gọi API. | QTHT bấm "Lưu cấu hình chung" |

### Ma trận ảnh hưởng

```
        Impact
        High │  R1    R2
             │
      Medium │  R3
             │
         Low │  R4    R5
             └────────────────
               Low    Med    High
                        Probability
```

---

## 5. KHUYẾN NGHỊ HÀNH ĐỘNG

### Tuần 1 (19/05 – 25/05): Fix khe hở tích hợp

1. **[P0] Sửa AuthUser DTO** — đổi interface `AuthUser` thành `roles: string[]`. Refactor `ApprovalPage`, `DashboardPage`, `AppSidebar`, `ConfigPage` (thay `user.role === "X"` bằng `user.roles.includes("X")`).
2. **[P0] Thêm approval cấp 2 UI** — trong `ApprovalPage`, thêm tab hoặc filter riêng cho `status === "approved_leader"` hiển thị với GD.PGD/QTHT.
3. **[P0] Chạy integration test E2E** — viết script hoặc test manual: tạo đơn (CB.PCM) → duyệt cấp 1 (LD.PCM) → duyệt cấp 2 (GD.PGD) → verify `LeaveBalance.UsedDays` tăng và ViolationsPage tính đúng.

### Tuần 2 (26/05 – 02/06): Hoàn thiện + dọn dẹp

4. **[P1] Implement PUT /api/config/user-role/{id}** (backend) + wire ConfigPage frontend.
5. **[P1] Dev token input UI** — thêm input JWT vào LoginPage khi `import.meta.env.DEV`.
6. **[P1] Fix Dashboard hardcode** — `metrics[0].value` lấy từ `LeaveBalance.TotalDays - UsedDays`.
7. **[P2] Xóa `packages/web/supabase/`** + verify build clean.
8. **[P2] Cập nhật docs** — sync roadmap, changelog.

### Nguyên tắc

- **Không thêm feature mới.** Tập trung fix bug tích hợp.
- **Chạy `dotnet build` + `pnpm build` sau mỗi PR.**
- **Rule của thumb:** nếu không verify được bằng `curl`/manual test trên real DB, coi như chưa done.

---

**Tình trạng kết luận:** Backend đã solid. Frontend UI đầy đủ. Khoảng cách còn lại nằm ở **layer tích hợp (integration layer)** — DTO alignment, role-filter logic, và end-to-end verification. Nếu 3 task P0 được xử lý trong tuần này, dự án có thể đạt 95%+ trước 05/06.
