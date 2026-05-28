---
phase: 3
title: "Eliminate Data Classes"
status: complete
priority: P1
effort: "6h"
dependencies: [phase-02]
---

# Phase 3: Eliminate Data Classes

## Overview

Remove all `Data.cs` repository classes and inline their logic directly into endpoint handlers using FastEndpoints property injection for `AppDbContext`. This eliminates 21 manual DI registrations from Program.cs and 21 Data class files, following the VSA principle: handlers are the primary test boundary, not repositories.

## Requirements

- Delete all `Data.cs` files from feature folders
- Convert constructor injection to property injection (`public AppDbContext Db { get; set; } = null!;`)
- Move Data class query/mutation logic directly into endpoint `HandleAsync()` methods
- `ICurrentUserProvider` → property inject (`public ICurrentUserProvider CurrentUser { get; set; } = null!;`)
- `ILeaveBalanceService` → property inject where needed
- Remove 21 `builder.Services.AddScoped<...Data>()` lines from Program.cs
- Keep `LeaveBalances.Seed.Data` as a static helper in `Shared/Domain/` (already static, not DI-registered)

## Architecture

### Before (Current)

```csharp
// Features/LeaveRequests/Create/Data.cs
internal sealed class Data {
    private readonly AppDbContext _db;
    public Data(AppDbContext db) => _db = db;
    public async Task<bool> LeaveTypeExistsAsync(long id, CancellationToken ct) =>
        await _db.LeaveTypes.AnyAsync(t => t.Id == id && t.IsActive, ct);
    // ... more methods
}

// Features/LeaveRequests/Create/Endpoint.cs
internal sealed class Endpoint : Endpoint<Request, LeaveRequestDto, Mapper> {
    private readonly Data _data;
    public Endpoint(Data data) => _data = data;
    // ... uses _data.LeaveTypeExistsAsync(), _data.CreateAsync(), etc.
}
```

### After (VSA)

```csharp
// Features/LeaveRequests/Create/CreateLeaveRequestEndpoint.cs
internal sealed class CreateLeaveRequestEndpoint : Endpoint<CreateLeaveRequestRequest, LeaveRequestDto, CreateLeaveRequestMapper> {
    public AppDbContext Db { get; set; } = null!;
    public ICurrentUserProvider CurrentUser { get; set; } = null!;

    public override void Configure() {
        Post("/create");
        Group<LeaveRequestGroup>();
        Roles(AppRoles.Staff, AppRoles.Leader);
    }

    public override async Task HandleAsync(CreateLeaveRequestRequest req, CancellationToken ct) {
        // Inline business validation
        if (!await Db.LeaveTypes.AnyAsync(t => t.Id == req.LeaveTypeId && t.IsActive, ct))
            AddError(r => r.LeaveTypeId, "Loại nghỉ không tồn tại hoặc không còn hiệu lực");
        // ... direct DbContext access
    }
}
```

### Data Class Method Inlining Map

| Data Class | Methods | Inlining Strategy |
|-----------|---------|-------------------|
| `LeaveRequests/Create/Data` | `LeaveTypeExistsAsync`, `HasOverlapAsync`, `CreateAsync`, `GetByIdAsync` | Inline all into endpoint handler |
| `LeaveRequests/Update/Data` | `GetByIdAsync`, `UpdateAsync` | Inline into handler |
| `LeaveRequests/Approve/Data` | `GetByIdAsync`, `GetApprovalConfigsAsync`, `UpsertBalanceAsync`, `SaveAsync` | Inline, move `UpsertBalanceAsync` logic to `LeaveBalanceService` |
| `LeaveRequests/Reject/Data` | `GetByIdAsync`, `SaveAsync` | Inline into handler |
| `LeaveRequests/Cancel/Data` | `GetByIdAsync`, `SaveAsync` | Inline into handler |
| `LeaveRequests/List/Data` | `GetFilteredAsync` | Inline LINQ into handler |
| `LeaveRequests/My/Data` | `GetByUserIdAsync` | Inline LINQ into handler |
| `LeaveTypes/Create/Data` | `CodeExistsAsync`, `CreateAsync` | Inline into handler |
| `LeaveTypes/Update/Data` | `GetByIdAsync`, `CodeExistsAsync`, `SaveAsync` | Inline into handler |
| `LeaveTypes/List/Data` | `GetActiveAsync` | Inline LINQ into handler |
| `LeaveTypes/Delete/Data` | `GetByIdAsync`, `DeleteAsync` | Inline into handler |
| `LeaveBalances/List/Data` | `GetAllAsync` | Inline LINQ into handler |
| `LeaveBalances/My/Data` | `GetByUserIdAsync` | Inline LINQ into handler |
| `Departments/Get/Data` | `GetByIdAsync` | Inline LINQ into handler |
| `Departments/List/Data` | `GetAllAsync` | Inline LINQ into handler |
| `Config/Get/Data` | `GetAllAsync` | Inline LINQ into handler |
| `Config/Update/Data` | `ReplaceAllAsync`, `SaveAsync` | Inline into handler |
| `SystemConfigs/Get/Data` | `GetAllAsync` | Inline LINQ into handler |
| `SystemConfigs/Update/Data` | `ReplaceAllAsync`, `SaveAsync` | Inline into handler |
| `Auth/Me/Data` | `GetUserAsync` | Inline LINQ into handler |
| `Reports/Export/Data` | `GetFilteredAsync` | Inline LINQ into handler |

**Special cases:**
- `LeaveRequests/Approve/Data.UpsertBalanceAsync()` — Move balance upsert logic into `ILeaveBalanceService` as a new method
- `LeaveBalances/Seed/Data` — Already static, move to `Shared/Domain/LeaveBalanceSeeding.cs`

## Related Code Files

- Delete: All 21 `Data.cs` files across feature folders
- Modify: All 22 endpoint files (convert to property injection, inline Data methods)
- Modify: `Program.cs` (remove 21 Data class registrations)
- Modify: `LeaveBalanceService.cs` (add `UpsertBalanceForApprovalAsync` method)

## Implementation Steps

1. **Add property injection to endpoints first** — Add `public AppDbContext Db { get; set; } = null!;` and `public ICurrentUserProvider CurrentUser { get; set; } = null!;` to each endpoint that needs them
2. **Inline simple Data methods** — Start with Data classes that have 1-3 simple methods (Departments, LeaveTypes/List, LeaveBalances/List)
3. **Inline complex Data methods** — LeaveRequests/* endpoints (more complex queries)
4. **Move UpsertBalanceAsync logic** — From `LeaveRequests/Approve/Data.cs` into `ILeaveBalanceService`
5. **Convert LeaveBalances.Seed.Data** — Move to `Shared/Domain/LeaveBalanceSeeding.cs` as static class
6. **Delete Data.cs files** — Remove all 21 Data class files
7. **Clean Program.cs** — Remove all `builder.Services.AddScoped<...Data>()` lines
8. **Compile and fix** — `dotnet build` to verify all references resolve

## Success Criteria

- [ ] Zero `Data.cs` files remain in feature folders
- [ ] Zero `builder.Services.AddScoped<...Data>()` in Program.cs
- [ ] All endpoints use property injection (`= null!;` pattern)
- [ ] `dotnet build` succeeds
- [ ] All API routes still work (manual smoke test)

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Logic loss during inlining | Copy Data method bodies verbatim first, then refactor |
| Complex queries in Approve/Data | Move to `ILeaveBalanceService` method, don't inline 20-line queries |
| DI resolution order | FastEndpoints auto-resolves property-injected services — no manual registration needed |
| Seed data helper | Already static, just relocate to `Shared/Domain/` |

## Next Steps

→ Phase 4: Route Groups & Result Envelope