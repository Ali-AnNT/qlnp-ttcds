---
day: 5
title: Frontend API Layer
status: done-verify-pending
priority: P1
effort: 0.5 day
date: 2026-05-13
---

# Day 5: Frontend API Layer

## Context Links

- `packages/web/src/api/client.ts`
- `packages/web/src/api/*.api.ts`
- `packages/web/src/lib/leave-data.ts`

## Overview

Replace Supabase calls with fetch-based API modules. Keep the frontend independent from backend implementation details.

## Key Insights

- API modules exist.
- Response shapes must be validated against real endpoints after Day 9-10.
- No Supabase runtime dependency should remain.

## Requirements

- Centralize base URL and auth headers.
- Provide typed modules for auth, departments, leave types, leave requests, leave balances, config.
- Surface API errors consistently.

## Architecture

Page/store -> API module -> `client.ts` -> `/api/*`.

## Related Code Files

| Action | File |
|--------|------|
| Created/Modified | `packages/web/src/api/client.ts` |
| Created/Modified | `packages/web/src/api/auth.api.ts` |
| Created/Modified | `packages/web/src/api/departments.api.ts` |
| Created/Modified | `packages/web/src/api/leave-types.api.ts` |
| Created/Modified | `packages/web/src/api/leave-requests.api.ts` |
| Created/Modified | `packages/web/src/api/leave-balances.api.ts` |
| Created/Modified | `packages/web/src/api/config.api.ts` |

## Implementation Steps

1. Keep fetch wrapper small.
2. Attach bearer token when available.
3. Parse JSON and error responses consistently.
4. Map API DTOs into existing frontend types only where needed.
5. Re-check after endpoint DTOs exist.

## Todo List

- [x] API client exists.
- [x] Feature API modules exist.
- [ ] Align DTOs with real API responses.
- [ ] Remove stale Supabase artifacts if confirmed unnecessary.

## Success Criteria

- Frontend builds without Supabase package dependency.
- API modules can call real endpoints after Day 10.

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| DTO mismatch | Integration pass on Day 11 |

## Security Considerations

- Do not store secrets in frontend env.
- Only store host token/session data as required.

## Next Steps

- Auth context and store refactor.
