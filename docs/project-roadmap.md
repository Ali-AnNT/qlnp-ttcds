# Project Roadmap - QLNP-TTCDS

## v0.0.0 - Supabase Prototype (DEPRECATED)

**Status**: Removed. Supabase architecture replaced in Phase 1 migration.

### Former Features (all migrated to new stack)
- [x] Login/logout with username/password (Supabase RPC verify_login) -- removed
- [x] All 11 pages: Dashboard, LeaveNew, LeaveMy, Approval, Calendar, Summary, Reports, Violations, Config, Login, NotFound

### Resolved Technical Debt
All Supabase-related issues resolved by architecture migration:
- Plain-text password comparison -> replaced by SSO gateway auth
- Weak RLS policies -> replaced by server-side ICurrentUserProvider (JWT claims)
- No server-side role enforcement -> enforced via CurrentUser.Role in endpoints
- @supabase/supabase-js removed from package.json
- src/integrations/supabase/ directory deleted

## Phase 1: Architecture Migration (COMPLETED)

**Priority:** P0 -- Replaced Supabase with .NET 10 + FastEndpoints + EF Core + SQL Server.
**Plan:** `plans/260513-0554-efcore-scaffold-migration/`
**Rebaseline:** `plans/260513-0221-dotnet-migration-refactor/plan.md` updated on 2026-05-14 to track remaining endpoint/test/docs work.

### 1.1 .NET Backend + SQL Server -- COMPLETED
| Task | Status |
|------|--------|
| .NET 10 API project (packages/api/) with FastEndpoints v8.1.0, EF Core 9.0.0, SQL Server | Done |
| Scaffold USER_MASTER (9 props) and DM_DONVI (22 props) from existing DB | Done |
| 5 Code First entities: LeaveType, LeaveBalance, LeaveRequest, LeaveConfig, LeaveRequestAudit | Done |
| AppDbContext with ExcludeFromMigrations() for system tables, seed data | Done |
| JWT Bearer authentication (ICurrentUserProvider, Claims-based) | Done |
| Initial EF Core migration (InitialCreate) | Done |
| Features directory scaffolded (Auth/Me, Config, LeaveBalances, LeaveRequests, LeaveTypes) | Done |
| Endpoint .cs implementations | Done |
| LeaveRequestAudit entity + EF migration | Done |
| CSP frame-ancestors response header | Done |
| Lazy/startup LeaveBalance seeding | Done |

### 1.2 Frontend Refactor -- COMPLETED
| Task | Status |
|------|--------|
| Replace Supabase client with fetch-based api/client.ts | Done |
| API modules: auth, departments, leave-types, leave-requests, leave-balances, config | Done |
| Zustand store refactored (data layer only, no auth) | Done |
| React AuthContext with JWT + embed mode (postMessage) | Done |
| SSO-only LoginPage (no username/password form, auto-redirect) | Done |
| All 11 pages refactored to use new API layer | Done |
| @supabase/supabase-js removed from package.json | Done |
| src/integrations/supabase/ directory deleted | Done |

## Phase 1.1: Endpoint Implementation & Release Readiness (COMPLETED)

**Priority:** P0 -- Complete backend behavior behind the already-refactored frontend.
**Completed:** 2026-05-28

| Task | Status |
|------|--------|
| Auth/Me endpoint | Done |
| LeaveTypes CRUD endpoints (Roles "QTHT") | Done |
| LeaveRequests P1: List/Create/Update | Done |
| LeaveRequests P2: Approve/Reject/Cancel | Done |
| Configurable N-Level Approval (ApprovedLevel, ApprovalHelper, legacy migration) | Done |
| LeaveBalances, Department reference endpoints | Done |
| Reports export endpoint (ClosedXML XLSX) | Done |
| LeaveRequestAudit entity + migration | Done |
| Lazy/startup LeaveBalance seeding | Done |
| SystemConfigs key-value table + GET/PUT endpoints + ConfigPage wiring | Done |
| LeaveBalance role-based NPN defaults from SystemConfigs + correction | Done |
| Frontend integration against real API | Done |

## Phase 1.5: VSA Migration (COMPLETED)

**Priority:** P1 -- Migrate frontend from layered architecture to Vertical Slice Architecture.
**Branch:** `refactor/adjust-api-arch-follow-vsa-and-fastendpoint`
**Plan:** `plans/250528-vsa-migration/plan.md`

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | Shared Infrastructure & App Layer | Done | 2h |
| 2 | Auth | Done | 30m |
| 3 | Layout | Done | 30m |
| 4 | Dashboard | Done | 30m |
| 5 | Leave Requests | Done | 1h |
| 6 | Approval | Done | 45m |
| 7 | Calendar | Done | 30m |
| 8 | Summary | Done | 45m |
| 9 | Reports | Done | 30m |
| 10 | Violations | Done | 1h |
| 11 | Config | Done | 1h |
| 12 | Cleanup & ESLint Boundaries | Done | 1h |

**Result:** All 11 feature pages fully migrated to VSA. Zustand store completely removed. 100% TanStack Query for server state. ESLint boundary rules enforced.

### Completed VSA Migration Details

- All pages moved from `src/pages/` to `src/features/{feature}/components/`
- Zustand store completely removed (no references remain in `src/`)
- TanStack Query hooks colocated with each feature
- Feature `index.ts` barrel exports serve as public API
- ESLint boundary rules enforce no deep imports across features
- `src/components/ui/` moved to `src/shared/ui/`

## Phase 1.6: Feature Completion (COMPLETED)

**Priority:** P1 -- Complete remaining features and bug fixes.
**Completed:** 2026-06-03

| Task | Status |
|------|--------|
| MyStats endpoint (GET /api/my-stats/) | Done |
| Configurable work days (SystemConfig `work_days`, BusinessDayCalculator.ParseWorkDays) | Done |
| Migration ReplaceIncludeSaturdayWithWorkDays | Done |
| Auth token renewal (401-reactive refresh with dedup lock) | Done |
| token-store.ts (single source of truth for localStorage tokens) | Done |
| auth-renew.api.ts (SSO token renewal) | Done |
| Custom date-picker component (Vietnamese dd/MM/yyyy format) | Done |
| Error boundary components (error-boundary, route-error-boundary) | Done |
| Violations page (client-side aggregation, dept/emp drill-down, Director-only) | Done |
| XLSX export (ClosedXML ExcelBuilder, Director-only) | Done |
| UserRole dropped as primary role source (now persisted JWT claims for offline use) | Done |
| Bug fix: dialog reload 5-layer defensive fix | Done |
| Bug fix: ObjectDisposedException fix | Done |
| Auto-approve by requester role (Leader/Director/Admin auto-approve levels <= their role; no config match + approver role -> auto-approve all; Staff -> pending unchanged) | Done |
| ApprovalBalanceService (shared service for balance deduction, extracted from Approve endpoint) | Done |
| ApprovalHelper.GetAutoApproveLevel + HasApproverRole (auto-approve level resolution) | Done |
| Docker deployment (docker-compose.yml, Dockerfiles, makefile) | Done |

## Phase 2: Feature Enhancements (Planned)

| Feature | Priority | Description |
|---------|----------|-------------|
| Email notifications | Medium | Send email on request submitted/approved/rejected |
| File attachments | Low | Allow attaching medical certificates or supporting documents |
| Multi-language (EN/VN) | Low | Support English interface for international staff |
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

## Milestone Timeline

```
Q1-Q2 2026: Supabase prototype complete
    ~~~~
    All core features working on Supabase PostgreSQL

May 2026 (COMPLETED): Phase 1 - Architecture Migration
    - .NET 10 API project created with EF Core 9.0.0 + FastEndpoints v8.1.0
    - Scaffolded existing SQL Server tables (USER_MASTER, DM_DONVI)
    - Frontend fully refactored (Supabase dependency removed)
    - JWT Bearer auth + ICurrentUserProvider

May 14-28 2026 (COMPLETED): Phase 1.1 - Endpoint Implementation & Release Readiness
    - All backend endpoints implemented: Auth/Me, DevLogin, LeaveTypes CRUD, Departments,
      LeaveBalances List/My/Seed, Config Get/Update, LeaveRequests List/My/Create/Update/
      Approve/Reject/Cancel, Reports Export, SystemConfigs, Configurable N-Level Approval,
      LeaveBalance role-based NPN defaults + correction
    - ConfigPage General tab wired to SystemConfigs API

May 28-29 2026 (COMPLETED): Phase 1.5 - VSA Migration
    - All 12 phases completed (Shared Infrastructure, Auth, Layout, Dashboard, Leave Requests,
      Approval, Calendar, Summary, Reports, Violations, Config, Cleanup & ESLint Boundaries)
    - 100% TanStack Query. Zustand fully removed.
    - Feature barrel exports, ESLint boundary enforcement

June 2026 (COMPLETED): Phase 1.6 - Feature Completion
    - MyStats endpoint, configurable work days, auth token renewal
    - Auto-approve by requester role (Leader/Director/Admin levels auto-approved)
    - ApprovalBalanceService (shared balance deduction), ApprovalHelper enhancements
    - Docker deployment, date picker, error boundaries, violations page
    - XLSX export, bug fixes (dialog reload, ObjectDisposedException)
    - UserRole dropped as primary role source

Q3 2026: Phase 2 - Feature Enhancements
    - Email notifications
    - Pilot deployment with 1-2 departments

Q4 2026: Phase 3 - Platform Improvements
    - Full organizational rollout
    - PWA / Mobile app exploration
    - External API
```