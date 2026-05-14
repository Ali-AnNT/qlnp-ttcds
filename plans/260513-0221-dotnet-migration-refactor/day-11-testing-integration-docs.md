---
day: 11
phase: Testing + Integration + Docs
status: pending
effort: 1 day
priority: P0
---

# Day 11: Testing, Integration, Documentation

## Context

**Depends on:** Day 9 (embed mode + Supabase removed)

## Overview

Run full integration test, fix bugs, cập nhật documentation, final review.

## Tasks

### 10.1 Run Existing Tests

- [ ] `bun run test` — chạy vitest suite
- [ ] Fix broken tests: mock API calls thay vì Supabase
- [ ] Cập nhật `src/test/setup.ts` — mock `src/api/client.ts` thay vì Supabase
- [ ] Thêm integration test cơ bản: login flow, create leave request

### 10.2 End-to-End Manual Test

- [ ] Test flow đầy đủ:
  1. Login với CB.PCM → xem dashboard
  2. Tạo đơn xin nghỉ → thấy trong My Leaves
  3. Login LD.PCM → phê duyệt đơn
  4. Login GD.PGD → phê duyệt cấp 2
  5. Xem Summary, Reports, Violations
  6. QTHT: cấu hình approval workflow
  7. Embed mode: mở trong iframe test page

### 10.3 Build Verification

- [ ] `bun run build` — production build không lỗi
- [ ] `dotnet build` — backend build không lỗi
- [ ] Check bundle size: ensure no Supabase in bundle
- [ ] Test production build preview: `bun run preview`

### 10.4 Environment + Config

- [ ] `.env.example` cập nhật:
  - `VITE_API_URL=http://localhost:5000`
  - `VITE_HOST_ORIGIN=https://host-website.com`
- [ ] `backend/appsettings.Development.json` — local dev config
- [ ] `backend/appsettings.json` — production template
- [ ] `.gitignore` — ensure backend/bin, backend/obj excluded

### 10.5 Documentation Update

- [ ] `docs/codebase-summary.md` — cập nhật architecture mới (.NET + SQL Server)
- [ ] `docs/system-architecture.md` — vẽ lại data flow
- [ ] `docs/deployment-guide.md` — thêm hướng dẫn deploy .NET backend
- [ ] `docs/project-roadmap.md` — cập nhật progress
- [ ] `README.md` — cập nhật tech stack, quick start (bỏ Supabase, thêm .NET)

### 10.6 Final Review

- [ ] Code review: check security (BCrypt, JWT validation, SQL injection via Dapper params)
- [ ] Check CORS config
- [ ] Verify API error handling: tất cả endpoints trả về JSON errors
- [ ] Check TypeScript strict: không `any` type không cần thiết
- [ ] Final commit với conventional commit message

## Delivery Criteria

- [ ] `bun run test` — all passing
- [ ] `bun run build` — no errors
- [ ] `dotnet build` — no errors
- [ ] Docs updated
- [ ] Full manual test pass
- [ ] Ready for PR

## Documentation Target

| Doc File | Action |
|----------|--------|
| `docs/codebase-summary.md` | Rewrite architecture section |
| `docs/system-architecture.md` | Update data flow diagram |
| `docs/deployment-guide.md` | Add .NET backend deploy |
| `docs/project-roadmap.md` | Mark milestone complete |
| `docs/code-standards.md` | Add .NET/C# conventions |
| `README.md` | Update tech stack + quick start |

## Unresolved Questions to Answer

- SQL Server instance connection string?
- Host JWKS endpoint URL (for token validation)?
- Cần SSL certificate cho JWT signing?
