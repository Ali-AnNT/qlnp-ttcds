---
phase: 4
title: "Verify Build"
status: complete
effort: "5min"
dependencies: [3]
---

# Phase 4: Verify Build

## Overview

Run `dotnet build` to confirm zero errors. Verify migration up/down consistency.

## Implementation Steps

1. Build the API project:
   ```bash
   cd packages/api && dotnet build
   ```

2. Verify migration can be applied and reverted (dry-run):
   ```bash
   cd packages/api && dotnet ef migrations script 0 AddLeaveRequestAudit
   ```

3. Verify no stale references — grep confirms no other files were accidentally modified.

## Success Criteria

- [ ] `dotnet build` returns 0 errors, 0 warnings
- [ ] Migration SQL script generates valid CREATE TABLE + FKs
- [ ] Only files modified: `LeaveRequestAudit.cs` (new), `LeaveRequest.cs`, `AppDbContext.cs`, migration files (new)
