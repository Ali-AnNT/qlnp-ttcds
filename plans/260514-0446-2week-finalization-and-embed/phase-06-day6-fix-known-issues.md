---
phase: 6
title: "Day 6 — Fix Known Issues (Auth Guard, Scoping, Error Handling)"
status: pending
priority: P0
effort: "4-5h"
dependencies: [5]
---

# Phase 06: Day 6 — Fix Known Issues

## Overview

Fix security and reliability bugs discovered in the API audit (2026-05-20). These must be resolved before any feature work continues.

## Issues to Fix

### 1. Auth/Me missing authorization guard [HIGH]

**File:** `Features/Auth/Me/Endpoint.cs`
**Problem:** No `RequireAuthorization()` or `AllowAnonymous()`. FastEndpoints auth middleware doesn't intercept it.
**Fix:** Add `Options(x => x.RequireAuthorization())` to Configure(). The `ICurrentUserProvider` already throws `InvalidOperationException` when no valid JWT — we need the middleware to enforce it before the endpoint runs.

### 2. LeaveRequests/List too permissive [HIGH]

**File:** `Features/LeaveRequests/List/Endpoint.cs`
**Problem:** Any authenticated user sees ALL requests. BRD says CB.PCM sees own only, LD.PCM sees own department, GD.PGD/QTHT sees all.
**Fix:** Add role-based scoping in HandleAsync:
- CB.PCM → filter by `UserId == currentUser.UserId`
- LD.PCM → filter by `user.PhongBanId == currentUser.PhongBanId` (join UserMaster)
- GD.PGD, QTHT → no filter (see all)
- Add `ICurrentUserProvider` injection

### 3. Missing try/catch on 10 endpoints [MED]

**Files:** All endpoints that currently have no error handling:
- Config/Get, Departments/Get, Departments/List
- LeaveBalances/List, LeaveBalances/My
- LeaveRequests/List, LeaveRequests/My
- LeaveTypes/Delete, LeaveTypes/List, LeaveTypes/Update

**Fix pattern:**
```csharp
public override async Task HandleAsync(CancellationToken ct)
{
    try
    {
        // existing logic
    }
    catch (Exception ex)
    {
        // log if ILogger available
        AddError("Lỗi xử lý yêu cầu");
        await Send.ErrorsAsync(500, ct);
    }
}
```

### 4. CurrentUserProvider silent-fail on missing claims [MED]

**File:** `Auth/CurrentUserProvider.cs`
**Problem:** `long.Parse` on missing/malformed claims → falls back to `"0"` or `"-1"`. Masks misconfiguration.
**Fix:** Throw `InvalidOperationException` with descriptive message when required claims (UserId, UnitId) are missing or unparseable. Keep fallback for optional claims (DeviceId, UBTP fields).

### 5. Connection string in AppDbContextFactory [MED]

**File:** `Data/AppDbContextFactory.cs`
**Problem:** Hardcoded connection string with credentials checked into git.
**Fix:** Read from environment variable or user secrets. Keep fallback only for local dev with a comment to use user secrets.

## Implementation Steps

1. Fix Auth/Me endpoint — add `RequireAuthorization()`
2. Fix LeaveRequests/List — add role-based scoping + ICurrentUserProvider
3. Add try/catch to 10 endpoints (consistent pattern)
4. Fix CurrentUserProvider — throw on missing required claims
5. Fix AppDbContextFactory — read connection string from env/secrets
6. `dotnet build` — verify 0 errors
7. Run existing tests — verify no regressions

## Success Criteria

- [ ] `GET /api/auth/me` without JWT → 401 (not reaching endpoint code)
- [ ] `GET /api/leave-requests` as CB.PCM → only own requests
- [ ] `GET /api/leave-requests` as LD.PCM → only own department
- [ ] All endpoints return structured error on DB failure (not raw 500)
- [ ] CurrentUserProvider throws on missing UserId claim
- [ ] No connection strings with credentials in source code
- [ ] `dotnet build` 0 errors, 0 warnings
- [ ] Existing tests still pass

## Next Steps

→ Phase 07: [Day 7 — Dev Token Input UI](phase-07-day7-dev-token-ui.md)