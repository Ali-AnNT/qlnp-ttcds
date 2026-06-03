---
title: "Fix Auth Renew API Layer"
description: "Sửa auth-renew.api.ts để match API thực tế: request body (refreshToken, accessToken, deviceId), response shape (loginStatus, token, renewalToken), bỏ accessTokenExp"
status: in-progress
priority: P1
branch: "dev"
tags: [auth, frontend, token-renewal, fix]
blockedBy: []
blocks: []
created: "2026-06-02T07:42:00.000Z"
createdBy: "brainstorm"
source: brainstorm
---

# Fix Auth Renew API Layer

## Overview

`auth-renew.api.ts` gửi/nhận sai shape so với API thực tế. Cần fix để match:
- Request: `{ refreshToken, accessToken, deviceId }` (thay vì `{ refresh_token }`)
- Response: `{ loginStatus, token, renewalToken, ... }` (thay vì `{ accessToken, accessTokenExp, tokenRenew }`)
- Success check: `loginStatus === 1`
- deviceId: `localStorage.getItem('MachineId')`

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Add getDeviceId to token-store](./phase-01-add-get-device-id.md) | Pending |
| 2 | [Fix auth-renew.api.ts request/response](./phase-02-fix-auth-renew-api.md) | Pending |
| 3 | [Update token-refresh.ts caller](./phase-03-update-token-refresh.md) | Pending |
| 4 | [Update tests](./phase-04-update-tests.md) | Pending |

## Design Decisions

1. `deviceId` = `localStorage.getItem('MachineId')` — parent site sets it, app reads it
2. Skip `expiredAt` (ASP.NET /Date/ format) — don't parse, don't store
3. Failure: keep old tokens, return false, allow retry (current behavior)
4. `client.ts` unchanged — `tryRenewToken(): Promise<boolean>` interface stays the same

## Key Mappings

| API Field | Internal Field | Notes |
|-----------|---------------|-------|
| `token` | `accessToken` | New access token |
| `renewalToken` | `tokenRenew` | Same refresh token |
| `loginStatus === 1` | success check | Was: check field existence |
| `deviceId` | from `MachineId` localStorage | New required field |
| `expiredAt` | skipped | Don't care per user |