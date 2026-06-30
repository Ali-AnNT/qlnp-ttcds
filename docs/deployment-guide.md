# Deployment Guide - QLNP-TTCDS

## Prerequisites

- Node.js 18+ or Bun 1.x
- .NET SDK 10.0
- SQL Server (existing VI_NGHIPHEP database with USER_MASTER, DM_DONVI)
- Docker (for containerized deployment)
- Git

## 1. Database Setup

The app expects an existing SQL Server database `VI_NGHIPHEP` with system tables:
- `USER_MASTER` (user accounts from existing system)
- `DM_DONVI` (department/unit hierarchy)

### Run EF Core Migrations
Create the QLNP application tables:

```bash
cd packages/api
dotnet ef database update
```

This creates the managed QLNP tables: LeaveTypes, LeaveBalances, LeaveRequests, LeaveConfigs, SystemConfigs, LeaveRequestAudits, UserRoles. System tables USER_MASTER and DM_DONVI must already exist and are excluded from migrations.

### Seed Data (automatic)
EF Core seeds 5 leave types on first migration:
- NPN (12 days), NO (30 days), NVR (3 days), NKL (0 days), NTS (180 days)

LeaveConfigs: 9 rows establishing initial N-level approval baseline per leave type.

SystemConfigs: 9 rows for configurable settings:

| ConfigKey | Default | Description |
|-----------|---------|-------------|
| max_annual_leave | 12 | So ngay phep nam toi da |
| min_request_days | 1 | So ngay toi thieu khi tao don |
| max_carry_over | 5 | So ngay phep chuyen sang nam sau |
| leave_cycle | yearly | Chu ky tinh phep |
| default_days_CB.PCM | 14 | Mac dinh CB.PCM |
| default_days_LD.PCM | 14 | Mac dinh LD.PCM |
| default_days_GD.PGD | 16 | Mac dinh GD.PGD |
| default_days_QTHT | 12 | Mac dinh QTHT |
| work_days | 1,2,3,4,5 | Cac ngay lam viec (0=CN, 1=T2... 6=T7) |

LeaveBalances are also seeded at app startup for active USER_MASTER users and lazily when `/leave-balances` endpoints are called. NPN TotalDays uses role-based defaults from SystemConfigs.

## 2. Environment Variables

### Frontend (packages/web)
Create `.env`:

```bash
VITE_API_URL=http://localhost:5000/api
VITE_DEV_MODE=true
VITE_AUTH_RENEW_URL=https://sso.example.gov.vn/DesktopModules/MVC/Account/Login/RefreshToken
```

- `VITE_API_URL`: base URL for the .NET API (default: `http://localhost:5000/api`)
- `VITE_DEV_MODE`: enables dev-mode features (e.g., dev login user selector). Set to `true` for development, omit or `false` for production
- `VITE_AUTH_RENEW_URL`: SSO token renewal endpoint URL. Required for 401-reactive token refresh in production

### Backend (packages/api)
Configure `appsettings.json` or `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=HOST,1439;Database=VI_NGHIPHEP;User Id=USER;Password=PASS;TrustServerCertificate=True"
  },
  "Jwt": {
    "Issuer": "your-issuer",
    "Audience": "your-audience",
    "SigningKey": "YOUR_SECRET_KEY_AT_LEAST_32_CHARACTERS_LONG!"
  },
  "Security": {
    "FrameAncestors": "'self'"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

- `Jwt:SigningKey`: must be at least 32 characters, shared with SSO Portal that issues tokens
- `Jwt:Issuer` / `Jwt:Audience`: must match the values configured in SSO Portal
- `Security:FrameAncestors`: CSP frame-ancestors directive for iframe embedding (use `'self'` for dev, add host domain for production)

### Docker Compose (.env at repo root)
For Docker deployment, create `.env` at the monorepo root:

```bash
CONNECTION_STRING=Server=sqlserver,1433;Database=VI_NGHIPHEP;User Id=sa;Password=YourPassword;TrustServerCertificate=True
VITE_API_URL=http://your-server:8003/api
VITE_DEV_MODE=false
ASPNETCORE_ENVIRONMENT=Production
```

## 3. Local Development

```bash
# From monorepo root
pnpm install

# Start API (http://localhost:5000)
cd packages/api && dotnet run

# Start frontend (http://localhost:8080)
cd packages/web && vite
# or: pnpm dev
```

Visit `http://localhost:8080` to access the app. In dev mode (`VITE_DEV_MODE=true`), API falls back to admin user (userId=1, roles=["QTHT"]) when no JWT is provided.

### Auth Token Renewal (Local Development)
In local development, token renewal is typically not needed (dev mode bypasses JWT). For production-like testing, set `VITE_AUTH_RENEW_URL` to the SSO Portal's refresh endpoint. When a 401 is received, `token-refresh.ts` will:
1. Check dedup lock (concurrent 401s share one refresh)
2. Call `auth-renew.api.ts` -> SSO refresh endpoint
3. Store new tokens via `token-store.ts`
4. Retry the original request

## 4. Build for Production

### Frontend
```bash
cd packages/web
pnpm build
```

Output: `packages/web/dist/` (static SPA).

### Backend
```bash
cd packages/api
dotnet publish -c Release -o publish
```

Output: `packages/api/publish/` (self-contained web app).

## 5. Docker Deployment

### Docker Compose (Recommended)

```bash
# From monorepo root
docker compose up -d
```

This starts:
- `qlnp-api` on port 8003 (maps to container port 8080)
- `qlnp-web` on port 8001 (maps to container port 80)

Configuration:
- API: reads `CONNECTION_STRING` and `ASPNETCORE_ENVIRONMENT` from `.env`
- Web: built with `VITE_API_URL` and `VITE_DEV_MODE` as build args
- Both services read env vars from `.env` file at repo root

### Docker Images (Manual)

```bash
# Build and push API image
make api-dev          # Build + push with :latest tag
make build-prod       # Build production image
make push-prod        # Push production image

# Or manually
cd packages/api && docker build -t qlnp-api:latest .
cd packages/web && docker build -t qlnp-web:latest .
```

The `makefile` provides targets:
- `api-dev`: Build + push API dev image to registry (`git.vietinfo.tech:8092/toanhv/qlnp`)
- `release`: Build + push API release image
- `build-prod`: Build production API image
- `push-prod`: Push production image

### Port Mapping

| Service | Host Port | Container Port | Description |
|---------|-----------|----------------|-------------|
| API | 8003 | 8080 | .NET API (Kestrel) |
| Web | 8001 | 80 | Nginx serving React SPA |

## 6. Traditional Deployment

### IIS (On-premise intranet)

**API** (IIS Application):
1. Create IIS site/app pointing to `packages/api/publish/`
2. Configure Application Pool: .NET CLR v4.0, Integrated pipeline
3. Configure `appsettings.json` with production Jwt:Issuer, Jwt:Audience, Jwt:SigningKey
4. Set `Security:FrameAncestors` to include host SSO Portal domain (e.g., `'self' https://portal.example.gov.vn'`)
5. Ensure SSO Portal issues JWT tokens matching the configured Issuer/Audience/SigningKey

**Frontend** (IIS / Nginx):
1. Copy `packages/web/dist/` to web root
2. Configure SPA rewrite rules (all paths -> index.html)
3. Set `VITE_API_URL` to production API URL at build time

### Vercel / Netlify (Frontend only)

1. Set root directory to `packages/web`
2. Build command: `pnpm build`
3. Output directory: `dist`
4. Add env var `VITE_API_URL` pointing to production API
5. SPA rewrite: all paths -> index.html

## 7. Configurable Work Days

Business day calculation uses the `work_days` SystemConfig key:
- Default value: `1,2,3,4,5` (Monday through Friday)
- Format: comma-separated DayOfWeek integers (0=Sunday, 1=Monday, ..., 6=Saturday)
- Backend: `BusinessDayCalculator.ParseWorkDays()` converts config string to `HashSet<DayOfWeek>`
- Frontend: `parseWorkDays()` in `date-utils.ts` mirrors the same logic
- Admin can change work days via ConfigPage -> General Settings -> Work Days checkboxes
- Example: `1,2,3,4,5,6` for Monday-Saturday (6-day work week)

## 8. Post-Deployment Verification

- [ ] Landing page `/` auto-authenticates (dev mode) or waits for SSO JWT token
- [ ] Role-based sidebar shows correct menu items for current user role
- [ ] Create leave request -> approve -> verify in calendar
- [ ] Business day count respects configured work days (check ConfigPage)
- [ ] MyStats: dashboard shows RemainingDays, PendingCount, ApprovedCount, UsedDays
- [ ] Charts render on Reports, Summary, Violations pages
- [ ] XLSX export works on Reports page (Director-only)
- [ ] 401 triggers token renewal (production only, requires `VITE_AUTH_RENEW_URL`)
- [ ] Mobile responsive: sidebar toggle works on narrow viewport
- [ ] Docker: `docker compose up -d` starts both services correctly

## 9. Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect to database" | Verify SQL Server is accessible, check ConnectionStrings in appsettings.json |
| API returns 401 Unauthorized | Check JWT token is valid and not expired. Verify Jwt:Issuer, Jwt:Audience, Jwt:SigningKey match between API and SSO Portal. For production, ensure `VITE_AUTH_RENEW_URL` is configured |
| Token renewal fails (401 loop) | Verify `VITE_AUTH_RENEW_URL` is set and accessible from browser. Check SSO Portal returns `accessToken` and `tokenRenew` in response |
| Blank page on route | SPA routing not configured. Add rewrite rules to serve index.html for all paths |
| "Waiting for SSO" stuck | In dev, set `VITE_DEV_MODE=true` for admin fallback. In prod, verify SSO Portal sends valid JWT via postMessage |
| CORS errors | Add CORS policy in Program.cs. Ensure frontend origin matches API origin |
| EF migration fails | Ensure system tables (USER_MASTER, DM_DONVI) exist in database before running migrations |
| Build fails | Run `pnpm install` at monorepo root first. For API, ensure .NET SDK 10.0 is installed |
| Work days not updating | Check SystemConfigs table for `work_days` key. Verify ConfigPage saves correctly via PUT /api/system-configs |
| Docker container exits | Check logs: `docker logs qlnp-api` or `docker logs qlnp-web`. Verify `.env` has correct `CONNECTION_STRING` |