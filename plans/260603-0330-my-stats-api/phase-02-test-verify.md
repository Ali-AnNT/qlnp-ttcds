---
phase: 2
title: "Test & Verify"
status: completed
priority: P2
effort: "30m"
dependencies: [1]
---

# Phase 2: Test & Verify

## Overview

Compile, run, and manually verify the MyStats endpoint returns correct data for the authenticated user.

## Requirements

- **Functional**: Endpoint returns expected 4 fields with correct values
- **Non-functional**: Response time < 200ms, auto-seed works for new users

## Architecture

No new architecture. Verify Phase 1 endpoint works end-to-end.

## Related Code Files

- **Verify**: `packages/api/Features/MyStats/MyStatsEndpoint.cs`
- **Verify**: `packages/api/Features/MyStats/MyStatsResponse.cs`
- **Verify**: `packages/api/Shared/Groups/MyStatsGroup.cs`

## Implementation Steps

1. **Build the project**
   ```bash
   dotnet build packages/api/QLNP.Api.csproj
   ```

2. **Run the API** and verify endpoint registration
   - Check Swagger UI shows `GET /api/my-stats` under "My Stats" tag
   - Confirm endpoint appears in route list

3. **Manual test with authenticated user**
   - Call `GET /api/my-stats` with valid JWT
   - Verify response shape:
     ```json
     {
       "success": true,
       "data": {
         "remainingDays": 12.0,
         "pendingCount": 1,
         "approvedCount": 3,
         "usedDays": 3.0
       }
     }
     ```
   - Verify `remainingDays = totalDays - usedDays`
   - Verify `pendingCount` matches actual pending requests for user
   - Verify `approvedCount` matches actual approved requests for user
   - Verify `usedDays` matches SUM of UsedDays in LeaveBalances

4. **Edge case verification**
   - Test with user that has NO LeaveBalance rows → should auto-seed and return default values
   - Test with user that has NO LeaveRequests → pendingCount=0, approvedCount=0
   - Test without authentication → should return 401

## Success Criteria

- [ ] Project compiles without errors
- [ ] Swagger shows `GET /api/my-stats` under "My Stats" tag
- [ ] Authenticated request returns 4 fields with correct values
- [ ] `remainingDays = totalDays - usedDays` holds true
- [ ] User with no balance gets auto-seeded defaults
- [ ] User with no requests gets pendingCount=0, approvedCount=0
- [ ] Unauthenticated request returns 401

## Risk Assessment

- **Low risk**: Verification phase only, no new code changes unless bugs found
- **Rollback**: Delete the 3 new files if endpoint fails validation