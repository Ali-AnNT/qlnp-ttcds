---
phase: 3
title: "Generate Migration"
status: complete
effort: "5min"
dependencies: [2]
---

# Phase 3: Generate Migration

## Overview

Run `dotnet ef migrations add` to create migration creating `LeaveRequestAudits` table.

## Requirements

- Migration must create table with correct columns, types, 2 FKs, 1 index
- Follow existing migration naming: `AddLeaveRequestAudit`

## Implementation Steps

1. Run migration command:
   ```bash
   cd packages/api && dotnet ef migrations add AddLeaveRequestAudit
   ```

2. Verify generated migration:
   - `CreateTable` for `LeaveRequestAudits`
   - Columns: Id (bigint, identity), LeaveRequestId, ChangedBy, ChangedAt (datetime2), FieldName (nvarchar(100)), OldValue (nvarchar(max), nullable), NewValue (nvarchar(max), nullable)
   - FK `FK_LeaveRequestAudits_LeaveRequests_LeaveRequestId` with cascade
   - FK `FK_LeaveRequestAudits_USER_MASTER_ChangedBy` with restrict
   - Index on `LeaveRequestId`

## Success Criteria

- [ ] Migration file generated under `packages/api/Data/Migrations/`
- [ ] CreateTable for LeaveRequestAudits with all columns
- [ ] Both FKs present with correct on-delete behavior
- [ ] Index on LeaveRequestId
