---
day: 11
title: Integration Wiring and Bug Fixes
status: planned
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

- All API modules call real endpoints.
- Store actions handle API errors.
- Pages render backend data without mock/Supabase fallback.

## Architecture

Backend DTOs -> frontend API module mapping -> store state -> pages.

## Related Code Files

| Action | File |
|--------|------|
| Modify | `packages/web/src/api/*.api.ts` |
| Modify | `packages/web/src/store/useStore.ts` |
| Modify | `packages/web/src/lib/leave-data.ts` |
| Modify | affected `packages/web/src/pages/*.tsx` |

## Implementation Steps

1. Start API in dev mode.
2. Run frontend dev server.
3. Call each API module manually or through UI.
4. Fix DTO/date casing mismatches.
5. Fix store load ordering after auth resolution.
6. Verify create/update/approve/cancel flows.
7. Confirm no Supabase runtime imports.

## Todo List

- [ ] Auth/me integration.
- [ ] Leave types integration.
- [ ] Leave request lifecycle integration.
- [ ] Balance/config integration.
- [ ] Reports/violations data integration.
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

- Add integration and frontend tests.
