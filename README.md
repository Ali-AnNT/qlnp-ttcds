# QLNP-TTCDS - He Thong Quan Ly Nghi Phep

He thong quan ly nghi phep danh cho Trung Tam Chuyen Doi So. Ung dung gom React SPA va ASP.NET FastEndpoints API de quan ly don xin nghi phep, phe duyet, lich nghi, thong ke bao cao va giam sat vi pham.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite 5 + TypeScript 5 |
| Backend | .NET 10 + FastEndpoints 8 + EF Core 9 |
| Database | SQL Server |
| Styling | Tailwind CSS 3 + shadcn/ui (Radix UI) |
| State | Zustand 5 |
| Server State | TanStack React Query 5 |
| Routing | React Router DOM 6 |
| Charts | Recharts 3 |
| Forms | React Hook Form 7 + Zod 4 |
| Export | ClosedXML |
| Package Manager | Bun + pnpm |

## Quick Start

```bash
# Install dependencies
bun install
# or
pnpm install

# Start web dev server (port 8080)
bun run dev
# or
pnpm dev

# Start API
pnpm api:watch
```

## Project Structure

```
packages/
  api/                      # ASP.NET 10 FastEndpoints API
    Data/                   # AppDbContext, EF Core migrations, startup seed
    Features/               # Vertical slices by use case (N-level approval)
    Infrastructure/         # Auth, Role constants
    Shared/                 # Domain entities, Contracts, Groups, Middleware
  web/
    src/
      app/                  # App shell, routing, providers
      features/             # 10 self-contained VSA features
      shared/               # Generic UI kit, hooks, lib, api client
      test/                 # Vitest utilities & mock factories
```

## User Roles

| Role | Label | Access |
|------|-------|--------|
| CB.PCM | Can bo phong chuyen mon | Dashboard, tao/xem don, calendar |
| LD.PCM | Lanh dao phong chuyen mon | Same as CB + phe duyet don cap phong |
| GD.PGD | Giam doc / Pho giam doc | Phe duyet tat ca, summary, reports, violations |
| QTHT | Quan tri he thong | Cau hinh (quy dinh, loai phep, phe duyet) |

## Routing

| Path | Page | Access |
|------|------|--------|
| /login | LoginPage | Public |
| / | DashboardPage | All authenticated |
| /leave/new | LeaveNewPage | CB.PCM, LD.PCM |
| /leave/my | LeaveMyPage | CB.PCM, LD.PCM |
| /approval | ApprovalPage | LD.PCM, GD.PGD |
| /calendar | CalendarPage | All |
| /summary | SummaryPage | GD.PGD |
| /reports | ReportsPage | GD.PGD |
| /violations | ViolationsPage | GD.PGD |
| /config | ConfigPage | QTHT |

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server (port 8080) |
| `bun run build` | Production build |
| `bun run test` | Run vitest suite |
| `bun run lint` | ESLint check |
| `pnpm api:watch` | Start API with dotnet watch |
