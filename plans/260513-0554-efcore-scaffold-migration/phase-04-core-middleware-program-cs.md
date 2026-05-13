---
phase: 4
title: "Core Middleware & Program.cs"
status: pending
priority: P0
effort: "1h"
dependencies: ["3"]
---

# Phase 4: Core Middleware & Program.cs

## Overview

CurrentUserMiddleware: extract user info từ gateway headers → HttpContext.Items. Program.cs: FastEndpoints + EF Core + middleware pipeline.

## Related Code Files

| Action | File |
|--------|------|
| Create | `packages/api/Middleware/CurrentUserMiddleware.cs` |
| Create | `packages/api/Middleware/CurrentUser.cs` |
| Modify | `packages/api/Program.cs` |

## Key Design

```csharp
public record CurrentUser(long UserId, string UserName, string FullName, string Role);

public class CurrentUserMiddleware : IMiddleware
{
    // Đọc header names từ appsettings "GatewayHeaders"
    // Query user_roles + USER_MASTER để lấy role
    // Gán HttpContext.Items["CurrentUser"]
    // Fallback dev mode: user mặc định nếu không có headers
}
```

```csharp
// Program.cs
builder.Services.AddFastEndpoints();
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<CurrentUserMiddleware>();

app.UseMiddleware<CurrentUserMiddleware>();
app.UseFastEndpoints();
```

## Implementation Steps

1. Tạo `CurrentUser.cs` record (trong Middleware/)
2. Tạo `CurrentUserMiddleware.cs`: IMiddleware, constructor DI (IConfiguration + AppDbContext)
3. Cấu hình Program.cs: FastEndpoints registration, DbContext DI, middleware ordering
4. Xóa weather forecast boilerplate
5. `dotnet build` — verify

## Success Criteria

- [ ] CurrentUserMiddleware compile, DI hoạt động
- [ ] Program.cs dùng FastEndpoints + EF Core + middleware
- [ ] Không còn weather forecast code
- [ ] `dotnet build` success
