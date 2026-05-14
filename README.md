# QLNP-TTCDS - He Thong Quan Ly Nghi Phep

He thong quan ly nghi phep danh cho Trung Tam Chuyen Doi So. Quan ly don xin nghi phep, phe duyet, theo doi lich nghi, thong ke bao cao va giam sat vi pham.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite 5 + TypeScript 5 |
| Styling | Tailwind CSS 3 + shadcn/ui (Radix UI) |
| State | Zustand 5 |
| Server State | TanStack React Query 5 |
| Routing | React Router DOM 6 |
| Charts | Recharts 3 |
| Forms | React Hook Form 7 + Zod 4 |
| Backend | Supabase (PostgreSQL) |
| Package Manager | Bun + pnpm |

## Quick Start

```bash
# Install dependencies
bun install
# or
pnpm install

# Set up environment variables
cp .env .env.local
# Edit .env.local with your Supabase project URL and anon key

# Start dev server (port 8080)
bun run dev
# or
pnpm dev
```

## Project Structure

```
src/
  App.tsx                   # Root: QueryClient + Router + AuthGuard
  main.tsx                  # ReactDOM entry
  index.css                 # Tailwind + shadcn CSS variables + Be Vietnam Pro font
  components/
    AppHeader.tsx           # Top bar: breadcrumb, notifications, avatar
    AppSidebar.tsx          # Role-based sidebar with collapsible menu
    ui/                     # ~40 shadcn/ui components
  hooks/                    # Custom hooks (useIsMobile, useToast)
  integrations/supabase/    # Supabase client + generated types
  lib/                      # Shared types (leave-data.ts), utils (cn, formatDate)
  pages/                    # Feature pages (see routing below)
  store/useStore.ts         # Zustand store: auth + CRUD + data loading
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
