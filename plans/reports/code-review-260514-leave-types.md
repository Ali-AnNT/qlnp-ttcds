# Code Review — LeaveTypes CRUD (Phase 02 Day 2)

**Date:** 2026-05-14 | **Files:** 13 | **LOC:** ~180 | **Verdict:** Fix 3 blockers, ship.

---

## BLOCKING

### 1. ListLeaveTypesEndpoint missing auth
`ListLeaveTypesEndpoint.Configure()` has no `Roles()`, `Policies()`, or `AuthSchemes()` — defaults to anonymous access. Requirement says "authenticated."
**Fix:** Add `Policies("authenticated")` or ensure global fallback policy exists. Alternatively, configure `app.UseAuthorization()` globally and confirm fallback policy enforces authenticated user.

### 2. Update endpoint: `{id}` route param ignored
`PUT /api/leave-types/{id}` but `UpdateLeaveTypeEndpoint.HandleAsync` uses `req.Id` from request body — route's `{id}` is never read. No validation that `req.Id` matches route `{id}`.
**Fix:** Either read ID from route via `Route<long>("id")` and remove `Id` from `UpdateLeaveTypeRequest`, or validate equality:
```csharp
var id = Route<long>("id");
if (req.Id != id) { AddError("ID mismatch"); await Send.ErrorsAsync(400, ct); return; }
```

### 3. Create: no DbUpdateException handling
Create checks unique code in validator, then inserts. Two concurrent requests pass validation simultaneously — second `SaveChangesAsync` throws `DbUpdateException` (if unique constraint exists) → unhandled 500.
**Fix:** Wrap in try/catch or use `AddError` + `ErrorsAsync(409)`. Add unique index on `LeaveType.Code` if not present.

---

## HIGH

### 4. RoleClaimType assumes `"Roles"` claim name from issuer
`Program.cs` sets `RoleClaimType = "Roles"`. If external JWT issuer uses `"role"` or full URI, `Roles("quantri")` silently fails (returns 403 for all authenticated users).
**Verify:** Inspect actual JWT payload claim names. If claim is `"role": "quantri"`, fix to `RoleClaimType = "role"`. If multiple values in a single claim (e.g., `"role": "quantri,user"`), use `RoleClaimType = "role"` — ASP.NET Core auto-splits on comma.

### 5. Delete: soft-deleted records still block code uniqueness
`UpdateLeaveTypeValidator` checks `!await db.LeaveTypes.AnyAsync(t => t.Code == code && t.Id != req.Id)` — includes inactive records. Cannot re-create a deleted type with same code.
**Consider:** Add `.Where(t => t.IsActive)` if reuse is desired. If intentional (prevent code recycling), document.

---

## LOW / OBSERVATIONS

- Update endpoint `Send.NotFoundAsync(ct)` — FastEndpoints `NotFoundAsync` accepts optional cancellation token. OK but verify package version supports this overload (v5.21+).
- `ListLeaveTypesEndpoint` uses `.Select(t => new LeaveTypeDto(...))` — correct server-side projection. Good.
- Soft-delete pattern correct: sets `IsActive = false`, no `_db.Remove()`.
- Validators extend `Validator<T>` (FastEndpoints base class) — auto-discovered by `AddFastEndpoints()`, no manual DI registration needed. Correct.

---

## VERIFIED CORRECT

- `RoleClaimType = "Roles"` in JWT config — maps to `ClaimTypes.Role` in `CurrentUserProvider`.
- `Roles("quantri")` on Create/Update/Delete endpoints.
- Soft delete in DeleteEndpoint with 409 conflict check (`LeaveRequests.AnyAsync`).
- 404 on missing entity in Update/Delete.
- FluentValidation `MustAsync` for unique code checks (Create: global, Update: exclude self).
- `IsActive = true` default on create.
