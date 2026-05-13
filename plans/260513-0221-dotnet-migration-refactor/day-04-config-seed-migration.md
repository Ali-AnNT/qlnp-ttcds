---
day: 4
phase: Config + Seed + Migration
status: pending
effort: 1 day
priority: P0
---

# Day 4: Config API + Seed Data + Password Migration

## Context

**Depends on:** Day 3 (leave APIs)

## Overview

Hoàn thiện Config API, seed data đầy đủ, script migrate password từ Supabase plaintext sang BCrypt.

## Tasks

### 4.1 Config Endpoints

- [ ] `Endpoints/ConfigEndpoints.cs`
  - `GET /api/config` — trả về tất cả cấu hình phê duyệt theo leave_type
  - `PUT /api/config/{id}` — update cấu hình (QTHT only)
  - `GET /api/config/rules` — trả về các quy định: số ngày nghỉ tối đa, thời gian báo trước, etc.

### 4.2 Seed Data Mở Rộng

- [ ] `Data/seed.sql` bổ sung:
  - 4 phòng ban: Phòng CNTT, Phòng Hành chính, Phòng Kế toán, Ban Giám đốc
  - ~10 employees phân bổ các role: CB.PCM (x6), LD.PCM (x2), GD.PGD (x1), QTHT (x1)
  - 3 loại nghỉ phép: Nghỉ phép năm (12 ngày), Nghỉ ốm (5 ngày), Nghỉ việc riêng (3 ngày)
  - Approval config: mỗi loại phép có 2 level (LD → GĐ)
  - Leave balances cho từng employee năm 2026
  - 5-10 leave requests mẫu (pending + approved + rejected)
  - Password: tất cả BCrypt hash của "123456"

### 4.3 Password Migration Script

- [ ] `Data/migrate-passwords.sql` hoặc console app:
  - Export users từ Supabase (plaintext)
  - BCrypt hash từng password
  - INSERT/UPDATE vào SQL Server
- [ ] `Services/PasswordMigrationService.cs` — nếu cần migration runtime

### 4.4 Health Check + CORS

- [ ] `GET /api/health` — return version, db status
- [ ] CORS config cho development: allow localhost:8080
- [ ] CORS cho production: allow subdomain của host

### 4.5 API Testing với curl

- [ ] Viết file `backend/test-scripts.sh` — curl commands cho tất cả endpoints
- [ ] Test flow: login → tạo đơn → approve LD → approve GĐ → check balance

## Delivery

- [ ] Seed data chạy thành công, login được với "123456" cho mọi user
- [ ] Config API trả về đúng approval workflow
- [ ] Test script chạy end-to-end

## Files to Create

| File | Purpose |
|------|---------|
| `Endpoints/ConfigEndpoints.cs` | Config API |
| `Endpoints/HealthEndpoints.cs` | Health check |
| `Data/seed.sql` (update) | Full seed data |
| `Data/migrate-passwords.sql` | Password migration |
| `backend/test-scripts.sh` | curl E2E test |
