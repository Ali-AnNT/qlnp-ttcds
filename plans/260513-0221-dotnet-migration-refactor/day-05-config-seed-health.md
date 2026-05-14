---
day: 5
phase: Config Slices + Seed + Health
status: pending
effort: 1 day
priority: P0
source:
  - docs/vision/brd.md
  - docs/vision/srs.md
  - plans/260513-0221-dotnet-migration-refactor/plan.md
---

# Day 5: Config Slices + Seed Data + Password Migration + Health

## Context

**Depends on:** Day 4 (leave slices)
**VSA pattern:** `Features/Config/Get/`, `Features/Config/Update/`, health endpoint

## Overview

Config API theo VSA, seed data mở rộng, password migration script, health check + CORS.

## VSA Structure (Day 5)

```
Features/Config/
├── Get/
│   ├── GetConfigEndpoint.cs           (GET /api/config)
│   └── GetConfigResponse.cs           (list of approval configs)
├── Update/
│   ├── UpdateConfigEndpoint.cs        (PUT /api/config/{id}, [Authorize(QTHT)])
│   ├── UpdateConfigRequest.cs
│   └── UpdateConfigValidator.cs
└── GetGeneral/
    ├── GetGeneralConfigEndpoint.cs    (GET /api/config/general)
    └── GetGeneralConfigResponse.cs    (leave rules: max days, notice period, etc.)

Data/
├── seed.sql                           (full seed data)
└── migrate-passwords.sql              (password migration)
```

## Tasks

### 5.1 Config — Get + Update (Approval Config)

- [ ] `Features/Config/Get/GetConfigResponse.cs`:
  ```csharp
  public sealed record ApprovalConfigDto(
      Guid Id, Guid LeaveTypeId, string LeaveTypeName,
      int ApprovalLevel, string ApproverRole
  );
  ```
- [ ] `Features/Config/Get/GetConfigEndpoint.cs`
  - `Endpoint<EmptyRequest, ApprovalConfigDto[]>`
  - `Configure()`: `Get("/api/config")`, `[Authorize]`
  - `HandleAsync()`: `SELECT lc.*, lt.name AS LeaveTypeName FROM leave_config lc JOIN leave_types lt ON lc.leave_type_id = lt.id`

- [ ] `Features/Config/Update/UpdateConfigRequest.cs` — `record UpdateConfigRequest(Guid LeaveTypeId, int ApprovalLevel, string ApproverRole)`
- [ ] `Features/Config/Update/UpdateConfigValidator.cs`:
  - `ApprovalLevel` — 1 or 2
  - `ApproverRole` — LD.PCM, GD.PGD, or QTHT
- [ ] `Features/Config/Update/UpdateConfigEndpoint.cs`
  - `Endpoint<UpdateConfigRequest, EmptyResponse>`
  - `Configure()`: `Put("/api/config/{id}")`, `[Authorize(Roles = "QTHT")]`
  - `HandleAsync()`: UPDATE leave_config by id

- [ ] `Features/Config/GetGeneral/GetGeneralConfigResponse.cs` — `record GeneralConfigDto(int DefaultLeaveDays, int MinNoticeDays)`
- [ ] `Features/Config/GetGeneral/GetGeneralConfigEndpoint.cs`
  - `Endpoint<EmptyRequest, GeneralConfigDto>`
  - `Configure()`: `Get("/api/config/general")`, `[Authorize]`
  - `HandleAsync()`: query from leave_config table or hardcoded defaults

### 5.2 Health Check

- [ ] Create inline trong Program.cs hoặc `Features/Health/HealthEndpoint.cs`:
  ```csharp
  public sealed class HealthEndpoint : Endpoint<EmptyRequest, object>
  {
      private readonly DbConnectionFactory _db;
  
      public HealthEndpoint(DbConnectionFactory db) => _db = db;
  
      public override void Configure()
      {
          Get("/api/health");
          AllowAnonymous();
      }
  
      public override async Task HandleAsync(CancellationToken ct)
      {
          try
          {
              using var conn = _db.CreateConnection();
              conn.Open();
              await SendAsync(new { 
                  status = "healthy", 
                  version = "1.0.0", 
                  database = "connected",
                  timestamp = DateTime.UtcNow 
              });
          }
          catch
          {
              await SendAsync(new { 
                  status = "degraded", 
                  database = "disconnected" 
              }, StatusCodes.Status503ServiceUnavailable);
          }
      }
  }
  ```

### 5.3 CORS Configuration

- [ ] `Program.cs` — update CORS:
  ```csharp
  builder.Services.AddCors(options =>
  {
      options.AddPolicy("Dev", policy => 
          policy.WithOrigins("http://localhost:5173", "http://localhost:8080")
                .AllowAnyHeader().AllowAnyMethod().AllowCredentials());
      
      options.AddPolicy("Production", policy =>
          policy.WithOrigins("https://host-website.com")  // configurable
                .AllowAnyHeader().AllowAnyMethod().AllowCredentials());
  });
  ```

### 5.4 Seed Data Expansion

- [ ] Update `Data/seed.sql`:
  - 4 phòng ban: Phòng Chuyên môn, Phòng Hành chính, Phòng Kế toán, Ban Giám đốc
  - ~10 employees phân bổ các role: CB.PCM (x6), LD.PCM (x2), GD.PGD (x1), QTHT (x1)
  - 3 loại nghỉ phép: Nghỉ phép năm (code: ANNUAL, 12 ngày), Nghỉ ốm (SICK, 5 ngày), Nghỉ việc riêng (PERSONAL, 3 ngày)
  - 3 approval configs: ANNUAL → level 1 (LD.PCM) + level 2 (GD.PGD); SICK → level 1 (LD.PCM); PERSONAL → level 1 (LD.PCM) + level 2 (GD.PGD)
  - Leave balances cho từng employee năm 2026
  - 5-10 leave requests mẫu (pending, approved_leader, approved_director, rejected, cancelled)
  - Password: tất cả BCrypt hash của "123456" (cost 12)

### 5.5 Password Migration Script

- [ ] Script để migrate từ Supabase plaintext → SQL Server BCrypt:
  - Export users từ Supabase: query `SELECT id, username, password FROM employees`
  - Với mỗi password plaintext → `BCrypt.Net.BCrypt.HashPassword(plaintext, workFactor: 12)`
  - UPDATE vào SQL Server
  - Verify: login thử với password cũ

## Delivery

- [ ] Config API trả về đúng approval workflow
- [ ] QTHT update config → thành công
- [ ] Health endpoint → healthy + db connected
- [ ] Seed data chạy thành công, login được với tất cả users
- [ ] `dotnet build` không lỗi

## Files to Create

| Slice | Files |
|-------|-------|
| Config/Get | `GetConfigEndpoint.cs`, `GetConfigResponse.cs` |
| Config/Update | `UpdateConfigEndpoint.cs`, `UpdateConfigRequest.cs`, `UpdateConfigValidator.cs` |
| Config/GetGeneral | `GetGeneralConfigEndpoint.cs`, `GetGeneralConfigResponse.cs` |
| Health | `HealthEndpoint.cs` |
| Data | `Data/seed.sql` (update), `Data/migrate-passwords.sql` |

## Related Docs

- `docs/vision/srs.md` — §3: FR-10 (System Config)
- `docs/vision/brd.md` — §5.7 Config (FR-060 → FR-061)
- `docs/vision/brd.md` — §4.3 Password migration (AS-IS plaintext → TO-BE BCrypt)
