# Deployment Guide - QLNP-TTCDS

## Prerequisites

- Node.js 18+ or Bun 1.x
- .NET SDK 10.0
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
EF Core seeds 3 leave types + 4 user roles on first migration:
- annual (12 days), sick (0 days), personal (3 days)
- userId=1 QTHT, userId=2 CB.PCM, userId=3 LD.PCM, userId=4 GD.PGD

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

Visit `http://localhost:8080` to access the app. In dev mode, API falls back to admin user (userId=1, roles=["QTHT"]) when no JWT is provided.

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

## 6. Post-Deployment Verification

- [ ] Landing page `/` auto-authenticates (dev mode) or waits for SSO JWT token
- [ ] Role-based sidebar shows correct menu items for current user role
- [ ] Create leave request -> approve -> verify in calendar
- [ ] Charts render on Reports, Summary, Violations pages
- [ ] Mobile responsive: sidebar toggle works on narrow viewport

## 7. Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect to database" | Verify SQL Server is accessible, check ConnectionStrings in appsettings.json |
| API returns 401 Unauthorized | Check JWT token is valid and not expired. Verify Jwt:Issuer, Jwt:Audience, Jwt:SigningKey match between API and SSO Portal |
| Blank page on route | SPA routing not configured. Add rewrite rules to serve index.html for all paths |
| "Waiting for SSO" stuck | In dev, API allows anonymous /api/auth/me with admin fallback. In prod, verify SSO Portal sends valid JWT via postMessage |
| CORS errors | Add CORS policy in Program.cs. Ensure frontend origin matches API origin |
| EF migration fails | Ensure system tables (USER_MASTER, DM_DONVI) exist in database before running migrations |
| build fails | Run `pnpm install` at monorepo root first. For API, ensure .NET SDK 10.0 is installed |
