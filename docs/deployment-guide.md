# Deployment Guide - QLNP-TTCDS

## Prerequisites

- Node.js 18+ or Bun 1.x
- .NET SDK 9.0
- SQL Server (existing VI_NGHIPHEP database with USER_MASTER, DM_DONVI)
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

This creates: UserRoles, LeaveTypes, LeaveBalances, LeaveRequests, LeaveConfigs.

### Seed Data (automatic)
EF Core seeds 3 leave types + 1 user role on first migration:
- annual (12 days), sick (0 days), personal (3 days)
- userId=1, role="quantri"

## 2. Environment Variables

### Frontend (packages/web)
Create `.env`:

```bash
VITE_API_URL=http://localhost:5000/api
```

- `VITE_API_URL`: base URL for the .NET API (default: `http://localhost:5000/api`)

### Backend (packages/api)
Configure `appsettings.json` or `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=HOST,1439;Database=VI_NGHIPHEP;User Id=USER;Password=PASS;TrustServerCertificate=True"
  },
  "GatewayHeaders": {
    "UserId": "X-User-Id",
    "UserName": "X-User-Name",
    "UserFullName": "X-User-FullName"
  },
  "DevMode": {
    "Enabled": true
  }
}
```

- `DevMode.Enabled`: when true, CurrentUserMiddleware falls back to admin user (userId=1, role=quantri)

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

Visit `http://localhost:8080` to access the app. With DevMode enabled, auto-authenticated as admin.

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

## 5. Deployment

### IIS (Recommended for on-premise intranet)

**API** (IIS Application):
1. Create IIS site/app pointing to `packages/api/publish/`
2. Configure Application Pool: .NET CLR v4.0, Integrated pipeline
3. Set `DevMode.Enabled` to `false` in `appsettings.json`
4. Ensure IIS ARR/reverse proxy sets gateway headers:
   - `X-User-Id` (from SSO Portal)
   - `X-User-Name`
   - `X-User-FullName`

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

## 6. Post-Deployment Verification

- [ ] Landing page `/` auto-authenticates (dev mode) or shows SSO waiting screen
- [ ] Role-based sidebar shows correct menu items for current user role
- [ ] Create leave request -> approve -> verify in calendar
- [ ] Charts render on Reports, Summary, Violations pages
- [ ] Mobile responsive: sidebar toggle works on narrow viewport

## 7. Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect to database" | Verify SQL Server is accessible, check ConnectionStrings in appsettings.json |
| API returns 401 Unauthorized | Check DevMode.Enabled (dev) or gateway headers (production). Ensure IIS sets X-User-Id header |
| Blank page on route | SPA routing not configured. Add rewrite rules to serve index.html for all paths |
| "Waiting for SSO" stuck | In dev, set DevMode.Enabled=true. In prod, verify SSO Portal is sending postMessage auth |
| CORS errors | Add CORS policy in Program.cs. Ensure frontend origin matches API origin |
| EF migration fails | Ensure system tables (USER_MASTER, DM_DONVI) exist in database before running migrations |
| build fails | Run `pnpm install` at monorepo root first. For API, ensure .NET SDK 9.0 is installed |
