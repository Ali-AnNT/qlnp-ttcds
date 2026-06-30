# Frontend API Mismatch After Backend Migration to FastEndpoints

**Date**: 2026-05-28 09:31
**Severity**: High
**Component**: Frontend API layer (`packages/web/src/shared/api/client.ts`, feature API files)
**Status**: Resolved

## What Happened

Backend migrated from Supabase to .NET 8 + FastEndpoints with VSA. Frontend was left pointing at old Supabase-era routes and DTO shapes. Six mismatches broke every API call silently -- no hard crash, just wrong data or 404s.

## The Brutal Truth

This is the classic "migrate the backend, forget the frontend" pattern. The backend team shipped their FastEndpoints migration, declared victory, and the frontend silently broke because nobody traced the API contract forward. The most insidious issue was the `Result<T>` envelope -- every response came back wrapped in `{ success, data, message, errors }` but the frontend just called `res.json()` and treated the envelope AS the data. Components got `{ success: true, data: {...} }` instead of `{...}` and rendered nothing useful. No error thrown, no stack trace -- just empty screens. Hours wasted debugging "why is my data undefined" before anyone checked what the backend actually returns.

## Technical Details

Six specific mismatches found and fixed:

1. **`client.ts` -- `Result<T>` envelope not unwrapped**: `request()` returned `res.json()` directly. UI consumed the envelope wrapper, not the payload. Fixed by adding `unwrapEnvelope<T>()` that checks for `success` field and extracts `.data` or joins `.message` + `.errors`.
2. **`config.api.ts` -- wrong routes**: `GET /config` and `PUT /config` -- no such endpoints exist. Correct: `/system-configs/leave-configs`.
3. **`leave-requests.api.ts` -- phantom `get(id)` method**: Called `GET /leave-requests/{id}` which has no backend endpoint. Removed the method entirely.
4. **`CreateLeaveRequestDto` -- `totalDays` field**: Frontend sent `totalDays` but backend computes it from `startDate`/`endDate`. Field removed from DTO.
5. **`reject()` -- wrong param name**: Frontend sent `{ reason }`, backend expected `{ rejectedReason }`. Fixed param name.
6. **`LoginPage.tsx` -- wrong dev-login route**: `POST /auth/dev/login` (two segments) vs correct `POST /auth/dev-login` (single FastEndpoints route).

## Root Cause Analysis

No API contract was maintained during the backend migration. Supabase used flat JSON responses; FastEndpoints uses a `Result<T>` envelope pattern. Routes changed from RESTful `/config` to VSA-style `/system-configs/leave-configs`. The backend team had no checklist for "notify frontend of breaking changes" and the frontend had no integration tests that would have caught route or DTO mismatches. The migration was treated as a backend-only concern.

## Lessons Learned

- **API contracts are two-sided**: Migrating the backend without updating the frontend API layer is an incomplete migration. Period.
- **Envelope patterns break silently**: When the wrapper changes but the consumer still reads the old shape, you get `undefined` data, not errors. Integration tests or contract tests would catch this immediately.
- **Route changes need a mapping table**: Supabase `/config` vs FastEndpoints `/system-configs/leave-configs` -- this should have been documented as part of the migration, not discovered by the frontend team after the fact.

## Next Steps

- Add integration tests that hit real backend endpoints from the frontend API layer to catch route/DTO mismatches at CI time.
- Document the `Result<T>` envelope contract in `docs/system-architecture.md` so no future developer has to discover it by debugging empty screens.