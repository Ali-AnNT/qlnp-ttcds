---
day: 11
title: Integration Wiring and Bug Fixes
status: in_progress
priority: P0
effort: 1 day
date: 2026-05-18
---

# Day 11: Integration Wiring and Bug Fixes

## Context Links

- `packages/web/src/api`
- `packages/web/src/store/useStore.ts`
- `packages/api/Features`

## Overview

Connect the refactored frontend to real backend endpoints and fix contract mismatches.

## Key Insights

- Frontend work is mostly complete but not proven against real API.
- DTO naming/date serialization are likely mismatch points.
- Keep mapping small and local.

## Requirements

- All API modules call real endpoints. -- DONE (all api.ts files exist)
- Store actions handle API errors.
- Pages render backend data without mock/Supabase fallback.

## Architecture

Backend DTOs -> frontend API module mapping -> store state -> pages.

## Related Code Files

| Action | File |
|--------|------|
| Aligned | `packages/web/src/api/auth.api.ts` |
| Aligned | `packages/web/src/api/leave-types.api.ts` |
| Aligned | `packages/web/src/api/leave-requests.api.ts` |
| Aligned | `packages/web/src/api/leave-balances.api.ts` |
| Aligned | `packages/web/src/api/config.api.ts` |
| Aligned | `packages/web/src/api/departments.api.ts` |
| Aligned | `packages/web/src/api/client.ts` |

## Alignment Work Completed

- Auth/Me DTO aligned between backend and frontend.
- HTTP methods for approve/reject/cancel aligned (backend changed PUT->POST, DELETE->POST to match frontend).
- LeaveRequestDto now includes donViId and updatedAt fields.
- All list endpoints return raw arrays instead of wrapped `{items: [...]}`.
- Both projects build with 0 errors.

## Remaining Work (needs runtime environment)

- [ ] Start API in dev mode and run frontend dev server.
- [ ] Call each API module manually or through UI.
- [ ] Fix any remaining DTO/date casing mismatches found during runtime.
- [ ] Fix store load ordering after auth resolution.
- [ ] Verify create/update/approve/cancel flows end-to-end.
- [ ] Confirm no Supabase runtime imports.
- [ ] Remove stale mock/Supabase fallback references.

## Todo List

- [x] Auth/me integration (DTO aligned).
- [x] Leave types integration (DTO aligned).
- [x] Leave request lifecycle integration (methods + DTO aligned).
- [x] Balance/config integration (DTO aligned).
- [ ] Reports/violations data integration.
- [ ] Runtime verification of full flows.
- [ ] Remove stale API assumptions.

## Success Criteria

- Frontend works against `packages/api` endpoints.
- No mock or fake data is needed for normal app flow.
- Browser console has no contract errors during smoke flow.

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Frontend expects UUID while API uses bigint | Normalize types in API modules and shared types |
| DateOnly serializes unexpectedly | Standardize on ISO `yyyy-MM-dd` strings |

## Security Considerations

- Keep authorization failures visible but not leaking DB details.

## Next Steps

- Add integration and frontend tests (Day 12).
