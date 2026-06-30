# Auth Token Storage & Renewal — Full Flow Replacement

**Date**: 2026-06-02 06:34
**Severity**: High
**Component**: packages/web/src/shared/lib/*, packages/web/src/shared/api/client.ts, packages/web/src/features/auth/
**Status**: Resolved

## What Happened

Replaced the entire auth token flow from `localStorage("jwt")` + `postMessage` iframe to `accessToken`/`accessTokenExp`/`tokenRenew` localStorage keys with auto-renewal on 401. The old flow had no token refresh mechanism -- once the JWT expired, the user was stuck. The production embed scenario requires reading tokens pre-set by a parent site on the same origin.

## The Brutal Truth

The old auth system was a house of cards. `postMessage` for iframe auth was over-engineered and fragile -- it assumed cross-origin communication when the real production embed is same-origin. Worse, there was zero token renewal: once the JWT expired, every API call just silently failed. No 401 handling, no retry, nothing. We shipped auth that worked for exactly one token lifetime and then died.

## Technical Details

**Old flow**: `localStorage.getItem("jwt")` everywhere, `postMessage` listener in auth-context, no 401 handling, no refresh.

**New modules created**:
- `token-store.ts` -- single source of truth for `accessToken`/`accessTokenExp`/`tokenRenew` + `MachineId`/DNN hidden inputs
- `auth-renew.api.ts` -- thin fetch wrapper POSTing to `VITE_AUTH_RENEW_URL` with `{refreshToken, accessToken, deviceId}`
- `token-refresh.ts` -- `renewToken()` reads tokenRenew, calls API, `setTokens()` on success; `tryRenewToken()` with module-level dedup lock (`refreshPromise`)

**Key deviation from plan**: The original plan called for `ensureValidToken()` with proactive expiry-based refresh (check `accessTokenExp` before every API call). During implementation this was abandoned because the SSO portal sets `accessTokenExp` in an inconsistent epoch format (seconds vs milliseconds), making proactive expiry checks unreliable. Instead, `tryRenewToken()` is only called reactively on 401. The `isTokenExpiring`/`isTokenExpired` functions from token-store were dropped entirely.

**API client**: `request<T>()` catches 401, calls `tryRenewToken()`, retries once with new token. Dedup lock prevents N concurrent 401s from triggering N refresh requests.

**Auth context**: `storage` event listener with 100ms debounce (parent sets keys sequentially) replaces `postMessage`. Embed mode detected via `hasAccessToken()` on mount -- if parent already set tokens, fetch user; otherwise show login. `logout` does `clearTokens()` + full page reload to wipe all client-side caches.

**Renew API response shape**: Not the clean OAuth2-like shape originally assumed. Real API returns `{loginStatus: 1, token, renewalToken}`, mapped to `RenewResponse {accessToken, tokenRenew}` in `auth-renew.api.ts`.

## What We Tried

1. **Proactive expiry-based refresh** (`ensureValidToken()` before every request) -- abandoned due to mismatched epoch formats in `accessTokenExp`.
2. **postMessage iframe flow** -- deleted entirely. Same-origin embed means `StorageEvent` handles cross-context communication correctly without postMessage.

## Root Cause Analysis

The original auth was built for dev-mode convenience only. `postMessage` was assumed necessary because no one confirmed whether the production embed would be same-origin or cross-origin. Token renewal was a "later" problem that never got addressed. The `accessTokenExp` epoch mismatch (the SSO portal uses seconds, JS uses milliseconds) would have silently broken proactive refresh -- good thing we discovered this during implementation rather than in production.

## Lessons Learned

- **Confirm same-origin vs cross-origin before choosing communication mechanism.** postMessage was unnecessary complexity; `StorageEvent` was the right answer all along for same-origin embed.
- **Don't trust external epoch formats.** The `accessTokenExp` field from the SSO portal uses seconds, not milliseconds. Proactive expiry-based refresh is fragile when you don't control the token source. Reactive (401-triggered) refresh is more robust.
- **Dedup lock pattern is essential** for token refresh. Without it, N concurrent failing requests trigger N refresh calls, potentially overwhelming the auth API.
- **Storage event debouncing matters.** Parent sets localStorage keys in sequence; without debouncing, each key change triggers a separate `fetchUser()` call.

## Next Steps

- Monitor renewal failure rates in production to validate reactive-only approach
- Consider re-adding proactive expiry check if epoch format can be standardized with the SSO team
- Verify `storage` event behavior across all target browsers (especially Safari iframe restrictions)