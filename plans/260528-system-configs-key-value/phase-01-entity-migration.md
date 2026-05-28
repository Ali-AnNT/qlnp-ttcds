---
phase: 1
title: "Entity + Migration"
status: complete
priority: P2
effort: "1h"
dependencies: []
---

# Phase 1: Entity + Migration

## Overview

Create `SystemConfig` entity, register in `AppDbContext`, add 8-row seed data via `HasData`, and generate EF Core migration.

## Requirements

- Functional: SystemConfigs table with key-value schema, unique key constraint, 8 seed rows
- Non-functional: Follow existing entity pattern (LeaveConfig, LeaveType conventions)

## Architecture

```
SystemConfigs
  Id          long PK identity
  ConfigKey   string(50) NOT NULL UNIQUE
  ConfigValue string(100) NOT NULL
  Description string(200) NULL
  UpdatedAt   DateTime NOT NULL DEFAULT SYSUTCDATETIME()
```

Convention: `default_days_{role_suffix}` where role_suffix = `CB.PCM`, `LD.PCM`, `GD.PGD`, `QTHT` (strip `QLNP.` prefix from AppRoles constant).

## Related Code Files

- Create: `packages/api/Entities/SystemConfig.cs`
- Modify: `packages/api/Data/AppDbContext.cs` — add DbSet + OnModelCreating config + HasData seed

## Implementation Steps

1. Create `SystemConfig.cs` entity:
   ```csharp
   namespace QLNP.Api.Entities;

   public class SystemConfig {
       [Key]
       [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
       public long Id { get; set; }

       [MaxLength(50)]
       public string ConfigKey { get; set; } = null!;

       [MaxLength(100)]
       public string ConfigValue { get; set; } = null!;

       [MaxLength(200)]
       public string? Description { get; set; }

       public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
   }
   ```

2. In `AppDbContext.cs`:
   - Add `public DbSet<SystemConfig> SystemConfigs { get; set; }`
   - In `OnModelCreating`:
     - Add unique index on `ConfigKey`
     - Add `HasData` with 8 seed rows (Id 1-8)
     - Set `UpdatedAt` default via `HasDefaultValueSql("SYSUTCDATETIME()")`

3. Generate migration:
   ```bash
   cd packages/api
   dotnet ef migrations add AddSystemConfigsTable
   ```

4. Verify migration SQL creates table + unique index + seed INSERT statements

## Success Criteria

- [ ] `SystemConfig` entity compiles without errors
- [ ] `AppDbContext` includes `SystemConfigs` DbSet
- [ ] Unique index on `ConfigKey` configured
- [ ] 8 seed rows defined in `HasData`
- [ ] EF migration generates clean SQL (CREATE TABLE + unique index + seed inserts)
- [ ] `dotnet build` succeeds

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Seed Id conflicts with existing migrations | Low | Use Id range starting at 1 (no overlap with other tables) |
| ConfigKey dot notation breaks EF index | Low | Dots are valid in string columns; unique index works |