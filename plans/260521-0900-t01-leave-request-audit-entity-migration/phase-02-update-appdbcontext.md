---
phase: 2
title: "Update AppDbContext"
status: pending
effort: "10min"
dependencies: [1]
---

# Phase 2: Update AppDbContext

## Overview

Register `LeaveRequestAudit` DbSet + configure FK relationships and indexes in `OnModelCreating`.

## Requirements

- DbSet naming: `LeaveRequestAudits` (matches existing pattern: `LeaveRequests`, `LeaveBalances`)
- FK `LeaveRequestAudits → LeaveRequests`: cascade delete (audit rows die with parent request)
- FK `LeaveRequestAudits → USER_MASTER`: restrict (system table, must not cascade)
- Index on `LeaveRequestId` for history queries

## Related Code Files

- Modify: `packages/api/Data/AppDbContext.cs`

## Implementation Steps

1. Add DbSet property (after existing `LeaveRequests` line):
   ```csharp
   public DbSet<LeaveRequestAudit> LeaveRequestAudits { get; set; }
   ```

2. Add entity config in `OnModelCreating` (after LeaveRequest config block):
   ```csharp
   modelBuilder.Entity<LeaveRequestAudit>(entity =>
   {
       entity.HasIndex(e => e.LeaveRequestId);
       entity.HasOne(e => e.LeaveRequest)
           .WithMany(lr => lr.Audits)
           .HasForeignKey(e => e.LeaveRequestId)
           .OnDelete(DeleteBehavior.Cascade);
       entity.HasOne(e => e.ChangedByUser)
           .WithMany()
           .HasForeignKey(e => e.ChangedBy)
           .OnDelete(DeleteBehavior.Restrict);
       entity.Property(e => e.ChangedAt).HasDefaultValueSql("SYSUTCDATETIME()");
   });
   ```

## Success Criteria

- [ ] `DbSet<LeaveRequestAudit>` registered
- [ ] FK to LeaveRequests with cascade + `WithMany(lr => lr.Audits)`
- [ ] FK to USER_MASTER with restrict
- [ ] Index on LeaveRequestId
- [ ] ChangedAt default value = SYSUTCDATETIME()
