---
title: "JWT Auth + Typed ICurrentUserProvider"
description: "Replace gateway header auth with JWT validation + typed ICurrentUserProvider (Approach B from brainstorm)"
status: pending
priority: P0
branch: "feat/efcore-migration-net9-fastendpoints"
tags: [auth, jwt, fastendpoints]
blockedBy: []
blocks: [260514-0446-2week-finalization-and-embed]
created: "2026-05-14T07:18:29.181Z"
createdBy: "ck:plan"
source: skill
---

# JWT Auth + Typed ICurrentUserProvider

## Overview

Replace gateway header auth (`X-User-Id`/`X-User-Name`/`X-User-FullName`) with standard ASP.NET Core JWT Bearer validation. Add typed `ICurrentUserProvider` for type-safe user access in FastEndpoints. Remove `CurrentUserMiddleware` and `HttpContext.Items` pattern.

**Design doc:** [brainstorm report](../reports/brainstorm-260514-0713-jwt-currentuser-provider.md)

## Key Decisions

- **JWT only** — remove gateway headers, no fallback
- **UserId** ("4") → `long` maps to `USER_MASTER.USER_ID`
- **Roles** — full list from token, not single string
- **ASP.NET Core standard** — `AddJwtBearer` + `ClaimsPrincipal` + `[Authorize]`
- **No DB query** — all user data from JWT claims
- **UBTP fields** — preserved in `CurrentUser` record

## Token Claims → CurrentUser Mapping

| JWT Claim | CurrentUser Field | Parse |
|-----------|-------------------|-------|
| `UserId` | `UserId` (long) | `long.Parse` |
| `DisplayName` | `DisplayName` (string) | direct |
| `UnitId` | `UnitId` (long) | `long.Parse` |
| `PhongBanId` | `PhongBanId` (long) | `long.Parse` |
| `DeviceId` | `DeviceId` (string) | direct |
| `Roles[]` | `Roles` (List<string>) | multiple claims |
| `UserIdUBTP` | `UserIdUBTP` (int) | `int.Parse` |
| `PhongBanIdUBTP` | `PhongBanIdUBTP` (int) | `int.Parse` |
| `DonViIdUBTP` | `DonViIdUBTP` (int) | `int.Parse` |

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Setup JWT Infrastructure](./phase-01-setup-jwt-infrastructure.md) | Pending |
| 2 | [Implement ICurrentUserProvider](./phase-02-implement-icurrentuserprovider.md) | Pending |
| 3 | [Update Endpoints & Cleanup](./phase-03-update-endpoints-cleanup.md) | Pending |

## Dependencies

- **Blocks:** `260514-0446-2week-finalization-and-embed` — existing plan Phase 01 uses old gateway header approach; must be updated after this plan completes
- **Package needed:** `Microsoft.AspNetCore.Authentication.JwtBearer` (not yet in `.csproj`)
