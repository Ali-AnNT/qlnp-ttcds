---
title: Approvable Requests API — move approval filtering from FE to BE
date: 2026-06-03
branch: 260603-approvable-requests-api
plan: plans/260603-0826-approvable-requests-api/plan.md
---

## What changed

- **BE:** new `GET /api/leave-requests/approvable` endpoint. Role-scoped (Leader/Director/Admin), then per-request `ApprovalHelper.CanApproveAtLevel` filter. Pre-batches `LeaveRequestUserLookup` (improvement over the plan's per-request lookup).
- **FE:** new `useApprovableRequests` hook; `approval-page.tsx` simplified — removed `useApprovalRequests`, `useLeaveTypes`, `visibleRequests` useMemo, `useAuth`/`AppRoles`/role-scope check (now BE's job). Kept `useApprovalConfigs` for `maxLevelByType` display label only. Removed `leaveTypes` prop from `ApprovalTable`/`DetailDialog` — use DTO's `leaveTypeName`.
- **Cleanup:** deleted `use-approval-requests.ts` and `approval.api.ts` (and the empty `approval/api/` dir). Updated `use-approval-actions.ts` to import `leaveRequestsApi` directly from `@/features/leave-requests`.

## Wins

- **Closes data leak** — Leader previously could see requests from other departments via client-side filter bypass; now BE enforces role + dept + config.
- **Single API call** — page loads with 1 query instead of 2 (pending list + configs).
- **Logic consolidation** — approval scope check now lives only in `ApprovalHelper`, no FE duplicate.

## Trade-offs accepted

- N+1 query in `LeaveConfigs` (1 query per pending request). Acceptable for ~50 pending requests; can batch later.
- Defensive `else` branch returning empty list for staff is unreachable in practice (`Roles()` rejects first). Kept as safety net.

## Plan deviation

- Pre-batched `LoadUserInfoBatchAsync` instead of per-request `LoadUserInfoAsync` in the filter loop. Strictly better — fewer queries, no behavior change.

## Reviewer findings (all resolved)

- **M (info):** added `?? "—"` fallback in `approval-table.tsx:117` to match `detail-dialog.tsx:29`.
- L (info) items: comment about "registration order" is now technically unnecessary (ASP.NET routes are matched by specificity); defensive `else` is documented as defensive rather than removed — both kept for clarity.

## Verification

- BE: `dotnet build` → 0 warn, 0 err
- FE: `pnpm build` → success
- FE: `pnpm lint` → 0 issues in changed files (1 pre-existing error in `leave-new-page.tsx:3` is out of scope)
- `leave-my-page.tsx` (uses `useMaxLevelByType` from `leave-requests/hooks/`) untouched and unaffected.

## Files

```
NEW  packages/api/Features/LeaveRequests/Approvable/ListApprovableRequestsEndpoint.cs
NEW  packages/web/src/features/approval/hooks/use-approvable-requests.ts
MOD  packages/web/src/features/approval/components/approval-page.tsx
MOD  packages/web/src/features/approval/components/approval-table.tsx
MOD  packages/web/src/features/approval/components/detail-dialog.tsx
MOD  packages/web/src/features/approval/hooks/use-approval-actions.ts
MOD  packages/web/src/features/leave-requests/api/leave-requests.api.ts
DEL  packages/web/src/features/approval/hooks/use-approval-requests.ts
DEL  packages/web/src/features/approval/api/approval.api.ts
```

Net: +10 lines, -73 lines. Closes a data-leak vector; sets foundation for adding more approval rules server-side.
