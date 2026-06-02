# Brainstorm: Update UI API Calls for New Backend

**Date:** 2026-05-28
**Branch:** `refactor/adjust-api-arch-follow-vsa-and-fastendpoint`
**Status:** Approved → proceed to plan

## Problem

Backend migrated from Supabase to .NET 8 + FastEndpoints with VSA. Frontend API layer has mismatches — wrong routes, wrong DTO shapes, missing unwrapping of `Result<T>` envelope.

## Findings (6 issues)

### 1. `Result<T>` envelope not unwrapped
- Backend wraps ALL responses in `Result<T>`: `{ success, data, message, errors }`
- `client.ts` returns `res.json()` directly — UI gets `{ success, data: {...} }` not `{...}`
- **Fix:** `client.ts` unwrap `Result<T>` in `request()` function

### 2. Wrong routes
| File | Current | Should be |
|------|---------|-----------|
| `LoginPage.tsx:33` | `POST /auth/dev/login` | `POST /auth/dev-login` |
| `config.api.ts:11` | `GET /config` | `GET /system-configs/leave-configs` |
| `config.api.ts:12` | `PUT /config` | `PUT /system-configs/leave-configs` |

### 3. Missing backend endpoint
- `leave-requests.api.ts:41` calls `GET /leave-requests/{id}` — no backend endpoint
- **Fix:** Remove `get(id)` from API layer

### 4. DTO mismatches
- **CreateLeaveRequest:** UI sends `totalDays`, backend ignores it (computed server-side)
- **RejectLeaveRequest:** UI sends `{ reason }`, backend expects `{ rejectedReason }`

## Approved Solution: Fix Mismatches Only

### Files to modify (6)

1. **`packages/web/src/api/client.ts`** — Unwrap `Result<T>` in `request()`:
   - If `success === true`, extract `.data`
   - If `success === false`, return error from `.message` + `.errors`
   - Signature unchanged: still returns `ApiResponse<T>`

2. **`packages/web/src/api/config.api.ts`** — Fix routes:
   - `/config` → `/system-configs/leave-configs`

3. **`packages/web/src/api/leave-requests.api.ts`** — Fix:
   - Remove `get(id)` call
   - Remove `totalDays` from `CreateLeaveRequestDto`
   - Fix `reject()` to send `{ rejectedReason }` not `{ reason }`

4. **`packages/web/src/api/auth.api.ts`** — No route changes needed (already correct)

5. **`packages/web/src/pages/LoginPage.tsx`** — Fix route:
   - `/auth/dev/login` → `/auth/dev-login`

6. **`packages/web/src/store/useStore.ts`** — Fix:
   - Remove `totalDays` from `addLeaveRequest` call

### Files NOT modified
- All other page components (ApprovalPage, LeaveMyPage, etc.) — no logic changes needed
- `departments.api.ts`, `leave-types.api.ts`, `leave-balances.api.ts`, `system-configs.api.ts` — routes already correct
- `AuthContext.tsx` — works as-is after client.ts fix

## Scope Boundaries
- **In scope:** Fix 6 files for API compatibility
- **Out of scope:** Refactoring API layer, adding axios/tanstack-query, new features
