---
phase: 1
title: "Setup JWT Infrastructure"
status: completed
priority: P0
effort: "1h"
dependencies: []
---

# Phase 1: Setup JWT Infrastructure

## Overview

Install JwtBearer package, configure `AddAuthentication` + `AddJwtBearer` in Program.cs, add JWT config section to appsettings. Remove `CurrentUserMiddleware` registration and gateway header config.

## Requirements

- Functional: JWT token validated on every request (unless AllowAnonymous)
- Non-functional: Token validation happens before endpoint execution (middleware pipeline)

## Architecture

```
Request → UseAuthentication() → JwtBearerHandler validates token
       → ClaimsPrincipal populated with JWT claims
       → UseAuthorization() → endpoint-level [Authorize] / AllowAnonymous
       → Endpoint handler receives User property
```

## Related Code Files

- **Modify:** `packages/api/QLNP.Api.csproj` — add JwtBearer package
- **Modify:** `packages/api/Program.cs` — AddAuthentication, AddJwtBearer, UseAuth pipeline
- **Modify:** `packages/api/appsettings.json` — add JwtConfig section, remove GatewayHeaders
- **Modify:** `packages/api/appsettings.Development.json` — JWT dev config

## Implementation Steps

### Step 1 — Add JwtBearer package

```bash
cd /home/vif/qlnp-ttcds/packages/api
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
```

### Step 2 — Add JWT config to appsettings.json

Replace `GatewayHeaders` section with:

```json
"Jwt": {
  "Issuer": "mobile",
  "Audience": "mobile",
  "SigningKey": "YOUR_SIGNING_KEY_HERE"
}
```

> Signing key will be provided by the SSO team. For dev, use a known key. Key can be overridden via env var `Jwt__SigningKey`.

### Step 3 — Update appsettings.Development.json

```json
{
  "Jwt": {
    "Issuer": "mobile",
    "Audience": "mobile",
    "SigningKey": "DEV_ONLY_SECRET_KEY_AT_LEAST_32_CHARS!"
  }
}
```

### Step 4 — Update Program.cs

```csharp
using FastEndpoints;
using FastEndpoints.Swagger;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QLNP.Api.Data;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddFastEndpoints()
    .SwaggerDocument(o =>
    {
        o.DocumentSettings = s =>
        {
            s.Title = "QLNP API";
            s.Version = "v1";
        };
    });

builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT Authentication
var jwtConfig = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtConfig["Issuer"],
            ValidAudience = jwtConfig["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtConfig["SigningKey"]!))
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

var frameAncestors = app.Configuration["Security:FrameAncestors"] ?? "'self'";
app.Use(async (ctx, next) =>
{
    ctx.Response.Headers.Append("Content-Security-Policy", $"frame-ancestors {frameAncestors}");
    await next(ctx);
});

app.UseFastEndpoints()
    .UseSwaggerGen();

app.Run();
```

Key changes:
- Remove `AddScoped<CurrentUserMiddleware>()`
- Remove `UseMiddleware<CurrentUserMiddleware>()`
- Add `UseAuthentication()` + `UseAuthorization()` BEFORE FastEndpoints
- `SymmetricSecurityKey` — if signing key is asymmetric, switch to `SecurityKey` subclass accordingly

### Step 5 — Build verification

```bash
cd /home/vif/qlnp-ttcds/packages/api
dotnet build
```

Must pass with 0 errors.

## Success Criteria

- [ ] `dotnet build` passes
- [ ] `Microsoft.AspNetCore.Authentication.JwtBearer` in `.csproj`
- [ ] `appsettings.json` has `Jwt` section (Issuer, Audience, SigningKey)
- [ ] `Program.cs` has `AddAuthentication` + `AddJwtBearer` + `UseAuthentication` + `UseAuthorization`
- [ ] No reference to `CurrentUserMiddleware` or `GatewayHeaders` in Program.cs

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| Signing key type mismatch (symmetric vs asymmetric) | Medium | Start with symmetric; ask user for actual key type |
| Token issuer/audience doesn't match config | Low | Configurable via appsettings, easy to fix |
| FastEndpoints requires extra auth config | Low | FastEndpoints 8.x works with standard ASP.NET auth |

## Unresolved Questions

- Actual signing key value (placeholder for now)
- Signing key type: symmetric (HMAC) or asymmetric (RSA/ECDSA)? Will determine `SecurityKey` subclass.
