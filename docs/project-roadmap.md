# Project Roadmap - QLNP-TTCDS

## v0.0.0 - Supabase Prototype (DEPRECATED)

**Status**: Removed. Supabase architecture replaced in Phase 1 migration.

### Former Features (all migrated to new stack)
- [x] Login/logout with username/password (Supabase RPC verify_login) -- removed
- [x] All 11 pages: Dashboard, LeaveNew, LeaveMy, Approval, Calendar, Summary, Reports, Violations, Config, Login, NotFound

### Resolved Technical Debt
All Supabase-related issues resolved by architecture migration:
- Plain-text password comparison -> replaced by SSO gateway auth
- Weak RLS policies -> replaced by server-side CurrentUserMiddleware
- No server-side role enforcement -> enforced via CurrentUser.Role in endpoints
- @supabase/supabase-js removed from package.json
- src/integrations/supabase/ directory deleted

## Phase 1: Architecture Migration (COMPLETED)

**Priority:** P0 -- Replaced Supabase with .NET 9 + FastEndpoints + EF Core + SQL Server.
**Plan:** `plans/260513-0554-efcore-scaffold-migration/`

### 1.1 .NET Backend + SQL Server -- COMPLETED
| Task | Status |
|------|--------|
| .NET 9 API project (packages/api/) with FastEndpoints v8.1.0, EF Core 9.0.0, SQL Server | Done |
| Scaffold USER_MASTER (9 props) and DM_DONVI (22 props) from existing DB | Done |
| 5 Code First entities: UserRole, LeaveType, LeaveBalance, LeaveRequest, LeaveConfig | Done |
| AppDbContext with ExcludeFromMigrations() for system tables, seed data | Done |
| CurrentUserMiddleware (gateway headers) + dev mode fallback | Done |
| Initial EF Core migration (InitialCreate) | Done |
| Features directory scaffolded (Auth/Me, Config, LeaveBalances, LeaveRequests, LeaveTypes) | Done |
| Endpoint .cs implementations | **IN PROGRESS** (folders exist, .cs files pending) |

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

## Milestone Timeline

```
Q1-Q2 2026: Supabase prototype complete
    ~~~~
    All core features working on Supabase PostgreSQL

May 2026 (COMPLETED): Phase 1 - Architecture Migration
    - .NET 9 API project created with EF Core 9.0.0 + FastEndpoints v8.1.0
    - Scaffolded existing SQL Server tables (USER_MASTER, DM_DONVI)
    - Frontend fully refactored (Supabase dependency removed)
    - SSO gateway auth + CurrentUserMiddleware
    - Features directory scaffolded, endpoints pending

Jun 2026 (IN PROGRESS): Phase 1.1 - Endpoint Implementation
    - Implement endpoint .cs files for all scaffolded slices
    - Wire frontend API modules to real endpoints
    - Integration testing

Q3 2026: Phase 2 - Feature Enhancements
    - Email notifications
    - Balance auto-calculation
    - Pilot deployment with 1-2 departments

Q4 2026: Phase 3 - Platform Improvements
    - Full organizational rollout
    - PWA / Mobile app exploration
    - External API
```
