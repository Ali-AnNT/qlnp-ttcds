---
title: "Auth Token Storage & Renewal"
description: "Refactor auth system từ jwt+postMessage sang accessToken/accessTokenExp/tokenRenew localStorage flow với auto-renew"
status: completed
priority: P1
branch: "dev"
tags: [auth, frontend, token-renewal]
blockedBy: []
blocks: []
created: "2026-06-02T06:34:41.383Z"
createdBy: "ck:plan"
source: skill
---

# Auth Token Storage & Renewal

## Overview

Hệ thống auth hiện tại dùng `localStorage.getItem("jwt")` + `postMessage` iframe flow. Khi tích hợp vào website khác (production), app nhận sẵn 3 key trên localStorage: `accessToken`, `accessTokenExp`, `tokenRenew`. Cần refactor để:

- Đọc `accessToken` thay vì `jwt`
- Check `accessTokenExp` trước mỗi API call, tự renew khi sắp hết hạn
- Dùng `tokenRenew` (refresh token) gọi external auth API để lấy token mới
- Embed mode: không cho logout, parent quản lý lifecycle
- **Thay thế hoàn toàn** flow cũ (`jwt` key + `postMessage`)

**Không thay đổi backend.** Tất cả thay đổi chỉ ở frontend.

## Context

### Current Flow
```
Dev: LoginPage → POST /auth/dev-login → jwt → localStorage("jwt")
Embed: parent postMessage({type:"auth",token}) → localStorage("jwt") → fetchUser()
API: getJwt() → Bearer header → no 401 handling, no refresh
```

### New Flow
```
Production: parent site sets accessToken/accessTokenExp/tokenRenew on localStorage
App init: check accessTokenExp → if expiring → renewToken(tokenRenew) → fetchUser()
API calls: ensureValidToken() → if expiring → auto-renew → Bearer header
401 response: attempt renew → retry once
Embed: no logout button, parent manages lifecycle
Dev: same dev-login but stores in accessToken key
Storage event: listen for external token changes → refetch user
```

**`storage` event listener**: Khi parent site thay đổi token (renew/logout), `StorageEvent` fire → app refetch user. Hoạt động vì parent và app cùng origin — parent ghi trực tiếp lên shared localStorage. StorageEvent fire khi thay đổi từ context khác (tab/iframe khác) — đúng cho embed use case. Không cần postMessage.

**Embed session expiry interstitial**: Khi token renew thất bại trong embed mode, hiển thị trang trung gian "Phiên làm việc đã hết hạn. Đang chuyển hướng..." trước khi redirect về /login.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Token Store Module](./phase-01-token-store-module.md) | Completed |
| 2 | [Auth Renew API & Refresh Logic](./phase-02-auth-renew-api-refresh-logic.md) | Completed |
| 3 | [API Client Refactor](./phase-03-api-client-refactor.md) | Completed |
| 4 | [Auth Context Refactor](./phase-04-auth-context-refactor.md) | Completed |
| 5 | [Login Page & Sidebar Update](./phase-05-login-page-sidebar-update.md) | Completed |
| 6 | [Env Config & Types](./phase-06-env-config-types.md) | Completed |
| 7 | [Tests](./phase-07-tests.md) | Completed |

## Execution Order

1 → 6 → 2 → 3 → 4 → 5 → 7 (Phase 6 must complete before Phase 2)

## Dependencies

- Phase 6 depends on nothing (but must run before Phase 2)
- Phase 2 depends on Phase 1 + 6 (token-store + env config)
- Phase 3 depends on Phase 1 + 2 (token-store + token-refresh)
- Phase 4 depends on Phase 1 + 2 + 3
- Phase 5 depends on Phase 4
- Phase 7 depends on Phase 1-3

## File Summary

| Action | File |
|--------|------|
| CREATE | `packages/web/src/shared/lib/token-store.ts` |
| CREATE | `packages/web/src/shared/lib/auth-renew.api.ts` |
| CREATE | `packages/web/src/shared/lib/token-refresh.ts` |
| CREATE | `packages/web/src/test/token-store.test.ts` |
| CREATE | `packages/web/src/test/token-refresh.test.ts` |
| MODIFY | `packages/web/src/shared/api/client.ts` |
| MODIFY | `packages/web/src/features/auth/contexts/auth-context.tsx` |
| MODIFY | `packages/web/src/features/auth/components/login-page.tsx` |
| MODIFY | `packages/web/src/features/layout/components/app-sidebar.tsx` |
| MODIFY | `.env.example` |
| MODIFY | `packages/web/src/vite-env.d.ts` |
| MODIFY | `packages/web/src/test/client.test.ts` |

## Verification

1. `pnpm dev` — dev login dropdown → store accessToken → fetch /auth/me
2. Embed mode: set accessToken/accessTokenExp/tokenRenew manually → app loads user
3. Token expiry: set accessTokenExp to past → triggers renew call
4. 401 retry: mock 401 → verify renew + retry
5. Sidebar: embed mode hides logout, dev mode shows logout
6. **Storage event**: change accessToken from dev tools → app refetches user
7. `pnpm test` — all tests pass
8. `pnpm build` — no compile errors

## Open Questions

1. ~~**External renew API request/response shape**~~: ✅ Resolved — OAuth2-like `POST { refresh_token }` returning `{ accessToken, accessTokenExp, tokenRenew }`. Confirmed by team.
2. **tokenRenew value in dev mode**: empty string — `renewToken()` returns false immediately, which is desired (dev mode uses dev-login which creates 8h JWT, no renewal needed).
3. ~~**Error UI for session expiry in embed**~~: ✅ Resolved — Show interstitial "Phiên làm việc đã hết hạn. Đang chuyển hướng..." before redirect to /login.

## Validation Log

### Session 1 — 2026-06-02
**Trigger:** `/ck:plan validate` critical questions interview
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** Parent site và iframe app có cùng origin khi embed không?
   - Options: Same origin | Cross origin | Both
   - **Answer:** Same origin
   - **Rationale:** StorageEvent chỉ hoạt động same-origin. Xác nhận same-origin → StorageEvent approach đúng, không cần postMessage fallback.

2. **[Dependencies]** Phase 6 (Env Config) là prerequisite của Phase 2 nhưng kế hoạch ghi "independent". Cách xử lý?
   - Options: Move Phase 6 before Phase 2 | Keep, update deps | Merge into Phase 2
   - **Answer:** Move Phase 6 before Phase 2
   - **Rationale:** VITE_AUTH_RENEW_URL phải có trước khi Phase 2 implement renewTokenViaApi.

3. **[Assumption]** External auth renew API request/response shape?
   - Options: OAuth2-like as planned | Unknown, add placeholder | Different shape
   - **Answer:** OAuth2-like as planned
   - **Rationale:** Xác nhận API spec match giả định trong kế hoạch. Không cần thay đổi.

4. **[Scope]** UX cho embed mode session expiry?
   - Options: Current (redirect + message) | Interstitial | Notify parent
   - **Answer:** Interstitial before redirect
   - **Rationale:** UX rõ ràng hơn cho user embed. Thêm component mới.

#### Confirmed Decisions
- Same-origin embed → StorageEvent đúng, xóa postMessage hoàn toàn (confirmed)
- Execution order: 1 → 6 → 2 → 3 → 4 → 5 → 7 (Phase 6 trước Phase 2)
- Renew API shape: OAuth2-like POST { refresh_token } → { accessToken, accessTokenExp, tokenRenew }
- Embed session expiry: hiển thị interstitial trước redirect

#### Action Items
- [ ] Cập nhật plan.md dependencies
- [ ] Cập nhật phase-02 dependencies: [1] → [1, 6]
- [ ] Thêm interstitial component vào phase-04 hoặc phase-05
- [ ] Xác nhận StorageEvent note trong plan context

#### Impact on Phases
- Phase 02: thêm dependency Phase 6
- Phase 04: thêm session-expiry state cho interstitial
- Phase 05: thêm interstitial UI component cho embed mode

### Verification Results
- **Tier:** Full (7 phases)
- **Claims checked:** 15
- **Verified:** 13 | **Failed:** 1 | **Unverified:** 1

#### Failures
1. [Fact Checker] Phase 6 dependency — plan ghi "independent" nhưng Phase 2 cần VITE_AUTH_RENEW_URL. → Fixed: moved execution order, updated dependencies.

#### Unverified
1. [Flow Tracer] StorageEvent cross-origin behavior — confirmed same-origin via user interview. No code to grep; behavioral assumption verified by design decision.

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01 through phase-07
- Decision deltas checked: 4 (same-origin confirm, phase reorder, API shape confirm, interstitial add)
- Reconciled stale references: 3
  1. Phase 6 overview: "độc lập" → "phải hoàn thành trước Phase 2"
  2. Phase 5 implementation steps: removed duplicate content
  3. Phase 4 implementation steps: renumbered (11→11→12→12→13)
- Unresolved contradictions: 0