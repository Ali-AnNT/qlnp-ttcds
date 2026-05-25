---
phase: 1
title: "Create Entity"
status: complete
effort: "15min"
dependencies: []
---

# Phase 1: Create Entity

## Overview

Create `LeaveRequestAudit.cs` entity + add `Audits` nav property to `LeaveRequest.cs`.

## Requirements

- Follow existing entity pattern: plain C# class, DataAnnotations, nav props with `= null!`
- Match schema from plan.md (Id, LeaveRequestId, ChangedBy, ChangedAt, FieldName, OldValue, NewValue)

## Related Code Files

- Create: `packages/api/Entities/LeaveRequestAudit.cs`
- Modify: `packages/api/Entities/LeaveRequest.cs` — add `ICollection<LeaveRequestAudit> Audits`

## Implementation Steps

1. Create `LeaveRequestAudit.cs`:
   ```csharp
   using System.ComponentModel.DataAnnotations;
   using System.ComponentModel.DataAnnotations.Schema;

   namespace QLNP.Api.Entities;

   public class LeaveRequestAudit
   {
       [Key]
       [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
       public long Id { get; set; }

       public long LeaveRequestId { get; set; }

       public long ChangedBy { get; set; }

       [Column(TypeName = "datetime2")]
       public DateTime ChangedAt { get; set; }

       [MaxLength(100)]
       public string FieldName { get; set; } = null!;

       public string? OldValue { get; set; }

       public string? NewValue { get; set; }

       public LeaveRequest LeaveRequest { get; set; } = null!;
       public UserMaster? ChangedByUser { get; set; }
   }
   ```

2. Add to `LeaveRequest.cs` — add nav property:
   ```csharp
   public ICollection<LeaveRequestAudit> Audits { get; set; } = new List<LeaveRequestAudit>();
   ```

## Success Criteria

- [ ] `LeaveRequestAudit.cs` exists with all 7 fields + 2 nav props
- [ ] `LeaveRequest.cs` has `Audits` collection
- [ ] Follows existing entity conventions (Key, DatabaseGenerated, Column, MaxLength)
