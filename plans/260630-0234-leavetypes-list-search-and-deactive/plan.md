---
title: "LeaveTypes list search + includeInactive"
description: "Thêm search (q theo Name+Code) và query param includeInactive cho ListLeaveTypesEndpoint + full-stack frontend"
status: done
priority: P2
branch: "fix/leave-types-update-full-object"
tags: [api, frontend, leave-types]
blockedBy: [260630-0220-fix-leave-types-update-full-object]
blocks: []
created: "2026-06-30T02:38:53.171Z"
createdBy: "ck:plan"
source: skill
---

# LeaveTypes list search + includeInactive

## Overview

Backend `ListLeaveTypesEndpoint` hiện filter `Where(t => t.IsActive)` → chỉ trả active, không search. Cần:
1. Search theo `q` (Name + Code, case-insensitive).
2. Query param `includeInactive` (bool, default false) để lấy cả deactivated leave types.

Full-stack: sửa backend endpoint + frontend api client + hook + UI search box + toggle "hiện đã tắt".

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Backend](./phase-01-backend.md) | Pending |
| 2 | [Frontend API + hook](./phase-02-frontend-api-hook.md) | Pending |
| 3 | [Frontend UI](./phase-03-frontend-ui.md) | Pending |
| 4 | [Tests](./phase-04-tests.md) | Pending |

## Touchpoints

- `packages/api/Features/LeaveTypes/List/ListLeaveTypesEndpoint.cs` (modify)
- `packages/web/src/features/config/api/leave-types.api.ts` (modify `list`)
- `packages/web/src/features/config/hooks/use-leave-types.ts` (modify queryKey + queryFn)
- `packages/web/src/features/config/components/leave-type-manager.tsx` (add search + toggle UI)
- `packages/web/src/test/leave-types.api.test.ts` (add cases)

## Dependencies

- `blockedBy: [260630-0220-fix-leave-types-update-full-object]` — cùng sửa `leave-types.api.ts` + `use-leave-types.ts`. Cook tuần tự tránh conflict.

## Acceptance

1. `GET /leave-types?q=an&includeInactive=true` trả cả active+inactive, filter theo Name/Code.
2. `GET /leave-types` (không param) → backward-compat: chỉ active.
3. UI có input search + toggle "hiện đã tắt".
4. Test pass (backend + frontend).

## Constraints

- Backward-compat: omit param → behavior cũ (chỉ active).
- KISS/YAGNI: không pagination (data nhỏ), search server-side qua `Contains` + `ToLower`.
- Không phá public contract ngoài `list` thêm optional params.

## Open Questions

- Toggle "hiện đã tắt" default off (đề nghị) — giữ behavior cũ.