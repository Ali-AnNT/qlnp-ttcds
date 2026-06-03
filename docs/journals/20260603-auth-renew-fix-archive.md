# Fix Auth Renew API Layer

**Date**: 2026-06-03 09:07
**Severity**: High
**Component**: `packages/web/src/shared/lib/auth-renew.api.ts`, `token-refresh.ts`, `token-store.ts`, `test/token-refresh.test.ts`
**Status**: Completed
**Plan**: `plans/260602-0742-fix-auth-renew-api/`

## What Was Delivered

Aligned `auth-renew.api.ts` to the real external API contract (dxcenter.vietinfo.tech/RefreshToken) — corrected request body, response shape, and success predicate — across 4 phases (getDeviceId, fix api, update caller, update tests). All 4 phases completed; `tryRenewToken(): Promise<boolean>` interface in `client.ts` stayed stable.

## API Contract Mapping

| Concern | Before (broken) | After (real API) |
|---------|----------------|------------------|
| Request body | `{ refresh_token }` | `{ refreshToken, accessToken, deviceId }` (+ `tabid`/`moduleid` headers) |
| Response shape | `{ accessToken, accessTokenExp, tokenRenew }` | `{ loginStatus, token, renewalToken, ... }` |
| Success check | Field existence truthy | `data.loginStatus === 1` AND `data.token && data.renewalToken` |
| New token | `accessToken` (from response) | mapped from `data.token` |
| Renew token | `tokenRenew` (from response) | mapped from `data.renewalToken` |
| Expiry | parsed/stored `accessTokenExp` | **skipped** — ASP.NET `/Date/` format, never parse, never store |
| deviceId | missing | `localStorage.getItem('MachineId')` — parent site sets it |
| Failure | throw or return partial | keep old tokens, return `false`, allow retry |
| Internal type | `RenewResponse` matched broken shape | `{ accessToken, tokenRenew }` (internal naming kept) |

## Key Technical Decisions

- **`deviceId` source of truth = `localStorage.getItem('MachineId')`** — parent site (DNN portal) sets it; app reads it. New `getDeviceId()` helper added to `token-store.ts` (phase 1).
- **`tabId`/`moduleId` also forwarded** as request headers (`tabid`, `moduleid`) — discovered the SSO endpoint needs them, folded in here to keep `auth-renew.api.ts` self-contained.
- **Skip `expiredAt` entirely** — ASP.NET `/Date(milliseconds)/` format is unparseable without coupling to a date library; reactive 401-renewal means we never need the value.
- **Failure = keep old tokens** — current `tryRenewToken()` contract preserved: caller never gets a partial state, dedup lock still serializes concurrent renewals.
- **`client.ts` unchanged** — `tryRenewToken(): Promise<boolean>` interface is the public boundary; everything else is internal to `shared/lib/`.
- **`setTokens(access, null, renew)`** — explicit `null` for `accessTokenExp` makes the "don't store expiry" decision a typed code path, not an oversight.

## Lessons Learned

- **Map the contract from wire first, code second.** The original `auth-renew.api.ts` was written from a guess — the broken `{ refresh_token }` body and `accessTokenExp` parsing are symptoms of not reading the real endpoint's swagger/network trace. Cost: 1 wasted day and a confusing journal entry (`260602-auth-token-renewal.md`) documenting the wrong shape.
- **`loginStatus === 1` is not the same as "field exists."** A successful 200 with `loginStatus: 0` (account locked, password expired) is still a failure. Truthy-field checks silently let those through.
- **Don't import expiry fields you can't validate.** Pulling `accessTokenExp` in forces a coupling to ASP.NET's `/Date()/` format or a date library you don't otherwise need. Reactive 401-renewal is simpler and more robust.
- **Stable internal types > stable external types.** Keeping `RenewResponse { accessToken, tokenRenew }` internal lets the wire format churn without rippling into `token-refresh.ts` or `client.ts`.

## Next Steps

- None — plan complete, all 4 phases closed, `client.ts` interface stable. Watch for any SSO-side response field changes (`loginStatus` semantics, new required headers) and update mapping table accordingly.
