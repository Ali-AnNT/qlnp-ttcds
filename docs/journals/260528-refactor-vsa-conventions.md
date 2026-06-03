# Refactored API to Vertical Slice Architecture Conventions

**Date**: 2026-05-28
**Severity**: High
**Component**: packages/api (entire .NET backend)
**Status**: Resolved

## What Happened

Refactored ~80 non-migration .cs files in `packages/api` to align with Vertical Slice Architecture (dotnet-vsa skill). Five sequential phases: folder restructure + naming, Data class elimination, route groups + Result envelope, Config domain merge. All phases completed, `dotnet build` passing, routes preserved.

## The Brutal Truth

This was the kind of refactor that feels pointless until you try to navigate the codebase. Twenty-two files all named `Endpoint.cs`, twenty-one `Data.cs` wrapper classes that did nothing but forward calls to `AppDbContext`, and twenty-one manual DI registrations in Program.cs -- all to avoid touching `DbContext` directly. The codebase was small enough (~80 files) that we could do this in one pass, but that also meant every single file was touched. Exhausting but necessary.

## Technical Details

**Eliminated**: 21 `Data.cs` repository classes, 21 `builder.Services.AddScoped<...Data>()` DI registrations in Program.cs, 4 root-level folders (`Entities/`, `Auth/`, `Middleware/`, `Shared/Services/`) relocated to VSA-standard tiers.

**Renamed**: All 22 endpoints from generic names (`Endpoint.cs`, `Models.cs`) to `{Action}{Role}.cs` pattern (e.g., `CreateLeaveRequestEndpoint.cs`). `Models.cs` files split into separate `{Action}Request.cs` and `{Action}Validator.cs`.

**Added**: 6 route group definitions in `Shared/Groups/`, `Result<T>` + `PagedData<T>` envelope in `Shared/Contracts/`, property injection pattern (`public AppDbContext Db { get; set; } = null!;`) replacing constructor injection.

**Merged**: `Config/` and `SystemConfigs/` feature folders into single `SystemConfigs/` domain. Route changed from `/api/config` to `/api/system-configs/leave-configs` -- frontend had to be updated.

## Key Decisions

| Decision | Chosen | Rejected | Why |
|----------|--------|----------|-----|
| Data elimination strategy | Inline into endpoint handlers | Static extensions on AppDbContext | Simplest, truest VSA, handler is the test boundary |
| Result envelope | Custom `Result<T>` | Ardalis.Result NuGet | No external dep, full control, matches VSA skill reference |
| Route prefix preservation | `/api` in group prefix (e.g., `Configure("api/leave-requests")`) | Global prefix or client change | Preserves existing URLs, zero client breakage |
| Shared DTOs | Keep `LeaveRequestDto` at domain level (7 consumers) | Per-action DTOs | Rule of 3 -- not enough distinct response types to justify split |
| Config domain merge | Merge into `SystemConfigs/` | Keep separate | Same domain per VSA, cleaner structure |

## Root Cause Analysis

The original structure grew organically from FastEndpoints scaffolding defaults. Every `dotnet new` generated `Endpoint.cs` and `Data.cs` -- fine for a tutorial, disastrous at scale. The Data class pattern was cargo-culted repository abstraction: no reuse, no test boundary value, just indirection. Config/ and SystemConfigs/ split happened because two entities were added at different times without considering domain ownership.

## Lessons Learned

- Small codebase refactors are now or never. At ~80 files this took 3-4 days. At 300 files it would be a quarter project.
- `Data.cs` repos that just forward to DbContext are a smell. If your Data class has no reuse or complex orchestration, inline it.
- FastEndpoints Group prefix must include the `/api` segment if you want to preserve existing URLs. The default behavior strips it.
- Phase ordering matters: naming must be stable before eliminating Data classes (phase 2 before 3), property injection must be in place before adding Groups (phase 3 before 4). Violating this creates cascading rework.

## Next Steps

- Monitor for any frontend calls still hitting old `/api/config` route after Phase 5 merge
- Consider adding architecture verification script (`verify-architecture.sh`) to CI to prevent regressions
- Rich domain entities (push handler logic into entity methods) is explicitly deferred -- separate task