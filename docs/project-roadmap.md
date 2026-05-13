# Project Roadmap - QLNP-TTCDS

## Current State (v0.0.0 - Early Development)

**Status**: Core features implemented, functional prototype.

### Implemented Features
- [x] Login/logout with username/password (Supabase RPC verify_login)
- [x] Role-based sidebar navigation (CB.PCM, LD.PCM, GD.PGD, QTHT)
- [x] Dashboard with metric cards and recent activity
- [x] Create leave request (type, dates, reason, business days calc)
- [x] Overlap detection for leave requests
- [x] My requests list with status filter, edit, cancel
- [x] Two-level approval workflow (LD.PCM -> GD.PGD) configurable per leave type
- [x] Calendar view (month grid + list)
- [x] Summary view by department with drill-down, pie chart
- [x] Reports with KPI cards, bar/pie charts, CSV export
- [x] Violations tracking (12-day limit exceed detection) with per-period filter
- [x] Config panel (general config, leave types CRUD, approval config CRUD)
- [x] Mobile responsive sidebar
- [x] Supabase PostgreSQL with RLS policies

### Known Technical Debt

| Issue | Severity | Description |
|-------|----------|-------------|
| Plain-text password comparison | **High** | verify_login currently compares plain-text passwords (no salt/hash). Must upgrade to proper hashing before production use |
| Weak RLS policies | **Medium** | All tables have "public SELECT" policies. leave_requests INSERT/UPDATE unrestricted. Suitable for intranet prototype only |
| No server-side role enforcement | **Medium** | All authorization is client-side (React). Server only has basic RLS. Malicious actor could call API directly |
| TanStack Query unused | **Low** | QueryClient is set up but pages use Zustand directly. No caching, deduplication, or stale-while-revalidate |
| No input sanitization | **Low** | Form inputs not sanitized before DB insert. SQL injection prevented by Supabase but XSS possible |
| No rate limiting | **Low** | No protection against brute-force login or API abuse |
| No audit logging | **Low** | No track of who changed what and when |
| Single large migration file | **Low** | All schema in one migration. Should be split into logical migrations for maintainability |
| No environment variable validation | **Low** | Missing VITE_SUPABASE_URL or KEY causes cryptic runtime errors |
| No Vietnamese locale for business days | **Low** | date-fns default locale may miscount Vietnamese holidays |

## Phase 1: Architecture Migration (Planned)

**Priority:** P0 — Replace Supabase with .NET 9 + FastEndpoints + Vertical Slice Architecture + SQL Server.

### 1.1 .NET Backend + SQL Server (P0)
| Task | Priority | Effort |
|------|----------|--------|
| SQL Server schema migration (6 tables + data from PostgreSQL) | Critical | Medium |
| FastEndpoints project setup + Vertical Slice folder structure | Critical | Small |
| Auth slices: Login, Exchange, Me endpoints + JWT middleware (dual issuer) | Critical | Medium |
| Employee CRUD slices | High | Small |
| Department CRUD slices | High | Small |
| Leave Type CRUD slices | High | Small |
| Leave Request slices: List/Create/Update + overlap detection | Critical | Medium |
| Leave Request slices: Approve/Reject (2-level state machine) | Critical | Medium |
| Leave Request slices: Cancel | High | Small |
| Leave Balance slices: List/My | High | Small |
| Config slices: Get/Update | Medium | Small |
| BCrypt password migration script | Critical | Small |

### 1.2 Frontend Refactor (P1)
| Task | Priority | Effort |
|------|----------|--------|
| Replace Supabase client with fetch-based api/client.ts | Critical | Medium |
| JWT AuthContext (replaces Zustand auth state) | Critical | Medium |
| postMessage listener for embed JWT exchange | High | Small |
| Remove all Supabase package dependencies | Critical | Small |
| Remove `src/integrations/supabase/` directory | Critical | Small |
| Update all pages to use new API layer | Critical | Medium |

### 1.3 Embedding Support (P2)
| Task | Priority | Effort |
|------|----------|--------|
| iframe detection + dual mode UI | High | Small |
| Host JWT validation via public key endpoint | High | Medium |
| PostMessage handshake protocol | Medium | Small |

## Phase 2: Feature Enhancements (Planned)

| Feature | Priority | Description |
|---------|----------|-------------|
| Email notifications | Medium | Send email on request submitted/approved/rejected |
| File attachments | Low | Allow attaching medical certificates or supporting documents |
| Multi-language (EN/VN) | Low | Support English interface for international staff |
| Leave balance auto-calculation | Medium | Automatically calculate and update leave_balances based on approved requests |
| Employee self-registration | Low | Allow employees to create accounts (admin approval required) |
| Advanced reporting | Low | Custom date ranges, export PDF, scheduled report generation |
| Integration with external calendar | Low | iCal/Google Calendar sync for approved leaves |

## Phase 3: Platform Improvements (Future)

| Feature | Description |
|---------|-------------|
| PWA support | Offline capability, push notifications, installable app |
| Mobile native app | React Native or Flutter app sharing business logic |
| SSO Integration | SAML/OIDC integration with organizational identity provider |
| Multi-tenant | Support for multiple centers/departments with isolated data |
| API for external systems | REST API with proper authentication for HR system integration |
| Comprehensive test suite | Unit + integration + E2E tests (Cypress/Playwright) |
| CI/CD pipeline | GitHub Actions for automated test, build, deploy |

## Milestone Timeline (Proposed)

```
Q2 2026 (Current): Prototype complete + Migration start
    - All core features working on Supabase
    - Phase 1.1: FastEndpoints + Vertical Slice backend + SQL Server migration

Q3 2026: Phase 1 Complete
    - Frontend refactor (remove Supabase dependency)
    - Embedding support
    - Pilot deployment with 1-2 departments

Q4 2026: Phase 2 - Feature Enhancements
    - Email notifications
    - Balance auto-calculation
    - Full organizational rollout

2027: Phase 3 - Platform Improvements
    - PWA / Mobile app exploration
    - SSO integration
    - External API
```
