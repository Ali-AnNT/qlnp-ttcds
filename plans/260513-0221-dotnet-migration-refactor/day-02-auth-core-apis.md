---
day: 2
phase: Auth Slices (Vertical Slice Architecture)
status: pending
effort: 1 day
priority: P0
source:
  - docs/vision/brd.md
  - docs/vision/srs.md
  - plans/260513-0221-dotnet-migration-refactor/plan.md
---

# Day 2: Auth Slices — Login + Exchange + Me + JWT Middleware

## Context

**Depends on:** Day 1 (scaffold + schema + Dapper setup)
**Master plan ref:** plan.md → Day 2

Align với BRD/SRS và master plan: FastEndpoints REPR pattern, Vertical Slice Architecture, dual-issuer JWT (HS256 own + RS256 host), BCrypt verify. Employee/Department CRUD chuyển sang Day 3.

## Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **Mỗi slice = 1 folder riêng** (Features/Auth/Login/) | REPR pattern: Endpoint + Request + Response + Validator trong 1 folder, dễ maintain, dễ test |
| **Handler trong endpoint HandleAsync()** | Không cần Service layer riêng (YAGNI). FastEndpoints HandleAsync() đủ cho logic auth hiện tại |
| **Dual-issuer JWT** (own HS256 + host RS256) | Day 2 implement cả 2 issuer ngay từ đầu. BRD BRULE-009 yêu cầu |
| **FastEndpoints built-in auth** thay vì custom RoleRequirement | `[Authorize(Roles = "...")]` attribute có sẵn, không cần middleware riêng |
| **Không gộp endpoint trong 1 file** | Mỗi class 1 file theo FastEndpoints convention |
| **Employee/Department → Day 3** | Day 2 chỉ auth. Giữ đúng schedule master plan |

## VSA Structure (Day 2)

```
backend/QlnpApi/
├── Features/Auth/
│   ├── Login/
│   │   ├── LoginEndpoint.cs        (POST /api/auth/login, AllowAnonymous)
│   │   ├── LoginRequest.cs         (record: username, password)
│   │   ├── LoginResponse.cs        (record: token, user info)
│   │   └── LoginValidator.cs       (FluentValidation: username not empty, password not empty)
│   ├── Exchange/
│   │   ├── ExchangeEndpoint.cs     (POST /api/auth/exchange, AllowAnonymous, nhận host JWT)
│   │   ├── ExchangeRequest.cs      (record: hostToken)
│   │   └── ExchangeResponse.cs     (record: token, user info)
│   └── Me/
│       └── MeEndpoint.cs           (GET /api/auth/me, [Authorize])
├── Auth/
│   └── JwtService.cs               (tạo + validate JWT, dual-issuer: HS256 + RS256)
├── Middleware/
│   └── JwtMiddleware.cs            (extract token từ header OR X-User-* headers cho embed)
└── Data/
    └── DbConnectionFactory.cs      (từ Day 1)
```

## Tasks

### 2.1 JwtService — Dual-issuer Token Service

- [ ] `Auth/JwtService.cs`
  - **App issuer (HS256)**: `GenerateAppToken(Employee)` — claims: sub (id), role, username, fullName, departmentId, iss = "app", exp = 8h
  - **Host issuer (RS256)**: `ValidateHostToken(string hostToken)` — validate = public key từ config, verify iss, return employeeId
  - `ValidateToken(string token)` — check iss → route đúng validator, return ClaimsPrincipal
  - Config từ `appsettings.json`: `Jwt:Secret` (app key), `Jwt:HostIssuer`, `Jwt:HostPublicKey` (RS256 public key PEM)

### 2.2 JwtMiddleware — Auth Middleware

- [ ] `Middleware/JwtMiddleware.cs`
  - Extract Bearer token từ `Authorization: Bearer <token>` header
  - Gọi `JwtService.ValidateToken()` → set `HttpContext.Items["UserId"]`, `HttpContext.Items["UserRole"]`
  - **Embed mode fallback**: nếu không có token, check `X-User-Id`, `X-User-Role` headers → dùng trong môi trường embed
  - 401 nếu cả token và embed headers đều không hợp lệ
  - **FastEndpoints**: implement như `PreProcessor<EmptyRequest>` hoặc middleware global

### 2.3 Login Slice — POST /api/auth/login

- [ ] `Features/Auth/Login/LoginRequest.cs`
  ```csharp
  public sealed record LoginRequest(string Username, string Password);
  ```
- [ ] `Features/Auth/Login/LoginResponse.cs`
  ```csharp
  public sealed record LoginResponse(string Token, UserInfo User);
  public sealed record UserInfo(Guid Id, string Username, string FullName, string Role, string DepartmentId, string DepartmentName);
  ```
- [ ] `Features/Auth/Login/LoginValidator.cs`
  - `Username` — not empty
  - `Password` — not empty
  - Dùng `AbstractValidator<LoginRequest>` từ FluentValidation
- [ ] `Features/Auth/Login/LoginEndpoint.cs`
  - `Endpoint<LoginRequest, LoginResponse>`
  - `Configure()`: `Post("/api/auth/login")`, `AllowAnonymous()`
  - `HandleAsync()`:
    1. Query employee by username (Dapper: `SELECT * FROM employees WHERE username = @username AND is_active = 1`)
    2. BCrypt.Verify(password, employee.password_hash)
    3. Sai → `ThrowError("Sai tên đăng nhập hoặc mật khẩu")` → 401
    4. Đúng → `JwtService.GenerateAppToken(employee)` → return LoginResponse

### 2.4 Exchange Slice — POST /api/auth/exchange

- [ ] `Features/Auth/Exchange/ExchangeRequest.cs`
  ```csharp
  public sealed record ExchangeRequest(string HostToken);
  ```
- [ ] `Features/Auth/Exchange/ExchangeResponse.cs`
  ```csharp
  public sealed record ExchangeResponse(string Token, UserInfo User);
  ```
- [ ] `Features/Auth/Exchange/ExchangeEndpoint.cs`
  - `Endpoint<ExchangeRequest, ExchangeResponse>`
  - `Configure()`: `Post("/api/auth/exchange")`, `AllowAnonymous()`
  - `HandleAsync()`:
    1. Gọi `JwtService.ValidateHostToken(request.HostToken)` — verify RS256
    2. Host JWT invalid → `ThrowError("Host token không hợp lệ")` → 401
    3. Extract employeeId từ host JWT claims
    4. Query employee từ DB
    5. `JwtService.GenerateAppToken(employee)` → return ExchangeResponse

### 2.5 Me Slice — GET /api/auth/me

- [ ] `Features/Auth/Me/MeEndpoint.cs`
  - `Endpoint<EmptyRequest, UserInfo>`
  - `Configure()`: `Get("/api/auth/me")`, `[Authorize]`
  - `HandleAsync()`:
    1. Extract userId từ `HttpContext.Items["UserId"]` hoặc `Route("userId")` từ JWT
    2. Query employee by id (Dapper)
    3. Return UserInfo

### 2.6 FastEndpoints Auth Config

- [ ] `Program.cs` — cấu hình FastEndpoints auth:
  ```csharp
  builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
      .AddJwtBearer(options => { /* configure HS256 for own issuer */ });
  builder.Services.AddAuthorization(options => {
      options.AddPolicy("QTHTOnly", policy => policy.RequireRole("QTHT"));
      options.AddPolicy("GDOnly", policy => policy.RequireRole("GD.PGD"));
      // etc.
  });
  ```
- [ ] Register JwtMiddleware trong FastEndpoints pipeline (nếu cần PreProcessor)
- [ ] Dùng FastEndpoints `[Authorize]` attribute — không cần custom RoleRequirement middleware
  ```csharp
  // Endpoint cần auth
  [HttpAuthorization("QTHT")]  // hoặc dùng policy
  public override void Configure() { ... }
  
  // Endpoint public
  public override void Configure() {
      Post("/api/auth/login");
      AllowAnonymous();
  }
  ```

### 2.7 Embed Mode (X-User-Headers)

- [ ] JwtMiddleware check: nếu không có Bearer token → fallback đọc `X-User-Id`, `X-User-Role`, `X-User-Name`
- [ ] Middleware set `HttpContext.Items` tương tự như JWT auth
- [ ] `MeEndpoint` hoạt động được với cả 2 mode

## Delivery Checklist

- [ ] `POST /api/auth/login` với seed user → JWT hợp lệ (HS256, sub, role, exp)
- [ ] `POST /api/auth/login` sai password → 401 + error message
- [ ] `POST /api/auth/login` user bị disable → 401
- [ ] `POST /api/auth/exchange` với host JWT (RS256) → app JWT (HS256)
- [ ] `POST /api/auth/exchange` với host JWT sai → 401
- [ ] `GET /api/auth/me` với JWT hợp lệ → user info
- [ ] `GET /api/auth/me` không token → 401
- [ ] `GET /api/auth/me` với embed headers → user info (khi không có token)
- [ ] JWT hết hạn → 401
- [ ] `dotnet build` không lỗi
- [ ] Có thể test qua curl/Swagger

## Test Scenarios

```bash
# Login thành công
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Login sai pass
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "wrong"}'

# Me với JWT
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"

# Me không token → 401
curl -X GET http://localhost:5000/api/auth/me

# Me với embed headers
curl -X GET http://localhost:5000/api/auth/me \
  -H "X-User-Id: <guid>" \
  -H "X-User-Role: CB.PCM"
```

## Seed Data Requirements

Cần ít nhất (Day 1 seed data):
- 1 employee: username/password (đã BCrypt hash) để test login
- 2-3 employees với role khác nhau (CB.PCM, LD.PCM, GD.PGD, QTHT)
- 1 employee is_active = 0 để test disabled login

## Files to Create

| File | Purpose |
|------|---------|
| `Auth/JwtService.cs` | Dual-issuer JWT generate + validate |
| `Middleware/JwtMiddleware.cs` | Extract token từ header hoặc embed headers |
| `Features/Auth/Login/LoginRequest.cs` | Request DTO |
| `Features/Auth/Login/LoginResponse.cs` | Response DTO |
| `Features/Auth/Login/LoginValidator.cs` | FluentValidation |
| `Features/Auth/Login/LoginEndpoint.cs` | POST /api/auth/login handler |
| `Features/Auth/Exchange/ExchangeRequest.cs` | Request DTO |
| `Features/Auth/Exchange/ExchangeResponse.cs` | Response DTO |
| `Features/Auth/Exchange/ExchangeEndpoint.cs` | POST /api/auth/exchange handler |
| `Features/Auth/Me/MeEndpoint.cs` | GET /api/auth/me handler |

## Related Docs

- `docs/vision/brd.md` — Business Requirements (FR-001 → FR-003, BRULE-008 → BRULE-009)
- `docs/vision/srs.md` — Software Requirements (FR-01: Authentication)
- `docs/system-architecture.md` — TO-BE architecture, dual-issuer flow
- `docs/code-standards.md` — FastEndpoints REPR conventions, C# coding standards
