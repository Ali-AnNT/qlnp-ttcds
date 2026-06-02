---
title: Update UI API Calls for FastEndpoints Backend
description: >-
  Fix frontend API layer mismatches after backend migration from Supabase to
  .NET 8 + FastEndpoints with VSA
status: completed
priority: P2
branch: refactor/adjust-api-arch-follow-vsa-and-fastendpoint
tags:
  - frontend
  - api
  - fix
blockedBy: []
blocks: []
created: '2026-05-28T09:31:42.368Z'
createdBy: 'ck:plan'
source: skill
brainstorm: ./plans/260528-brainstorm-update-ui-api-calls.md
---

# Update UI API Calls for FastEndpoints Backend

## Overview

Backend migrated to .NET 8 + FastEndpoints. Frontend API layer has 6 mismatches: wrong `Result<T>` envelope handling, wrong routes, wrong DTO shapes, missing endpoint call. Fix all 6 issues across 6 files.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Fix client.ts Result<T> unwrapping](./phase-01-fix-client-ts-result-t-unwrapping.md) | In Progress |
| 2 | [Fix wrong routes and DTOs in API files](./phase-02-fix-wrong-routes-and-dtos-in-api-files.md) | Pending |
| 3 | [Fix LoginPage route and useStore](./phase-03-fix-loginpage-route-and-usestore.md) | Pending |

## Dependencies

None. Standalone fix.

## Files Modified

| File | Change |
|------|--------|
| `packages/web/src/api/client.ts` | Unwrap `Result<T>` envelope |
| `packages/web/src/api/config.api.ts` | Fix routes `/config` → `/system-configs/leave-configs` |
| `packages/web/src/api/leave-requests.api.ts` | Remove `get(id)`, remove `totalDays` from DTO, fix `reject` param |
| `packages/web/src/pages/LoginPage.tsx` | Fix route `/auth/dev/login` → `/auth/dev-login` |
| `packages/web/src/store/useStore.ts` | Remove `totalDays` from `addLeaveRequest` call |
