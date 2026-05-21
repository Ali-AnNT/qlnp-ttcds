# Code Review: LeaveRequests P2 + Feature Additions

## Scope
- Files: 50+ API files (Auth/Me, LeaveRequests Approve/Reject/Cancel/My, LeaveBalances, Departments, Config, response DTO refactors)
- Build: 0 warnings, 0 errors
- Focus: Production-readiness review

## Overall Assessment
Solid implementation with good patterns (vertical slices, Data classes, proper async). The team flattened response wrappers to raw DTOs consistently and added proper DI registrations. Two security-relevant issues found in authz logic for dual-role users. Build passes clean.

---

## Critical Issues

None found. All endpoints have authorization requirements (either `Roles(...)` or `RequireAuthorization()`). No unauthenticated endpoints exist. No PII or secrets leaked.

---

## High Priority

### H1. Reject endpoint: dual-role user bypasses scope check [BLOCKING]

**File:** `packages/api/Features/LeaveRequests/Reject/Endpoint.cs` (line 616)

A user with **both** `QLNP.LD.PCM` and `QLNP.GD.PGD` roles can reject any "pending" leave request without department scope checking or self-approval guard.

```csharp
// Line 616
if (isLeader && !isDirector && entity.Status == "pending")
```

For a dual-role user, `!isDirector` is `false`, so the entire scope-check block is skipped. The user can reject their own leave request (violating BRULE-004) or requests from other departments.

**Compare with Approve endpoint** (handles this correctly via if/else-if chain: director branch fires only for `approved_leader` status, leader branch handles `pending` with proper scope checks).

**Fix:** Use same if/else-if structure as Approve, or add a separate guard block:
```csharp
if (entity.Status == "pending")
{
    // LD.PCM scope check applies regardless of other roles
    if (entity.UserId == currentUser.UserId ||
        entity.User.PhongBanId == null ||
        entity.User.PhongBanId != currentUser.PhongBanId)
    {
        await Send.ForbiddenAsync(ct); return;
    }
}
```

### H2. Auth/Me MapRole picks first role only

**File:** `packages/api/Features/Auth/Me/Data.cs` (line 44-53)

The `MapRole` method returns on the first iteration, never considering subsequent roles. For a user with `["QLNP.LD.PCM", "QLNP.GD.PGD"]`, only `"LD.PCM"` is returned (order depends on JWT claim order).

```csharp
foreach (var r in roles)
{
    var shortRole = r.Replace("QLNP.", "");
    if (shortRole == "QTHT") return "quantri";
    return shortRole;  // <-- always returns on first iteration
}
return "user";
```

If the frontend uses this `Role` field for UI decisions (e.g., showing admin panel only for "quantri"), a QTHT user with an additional role might not surface correctly depending on claim order.

**Fix:** Either define a priority order (QTHT > GD.PGD > LD.PCM > CB.PCM) or keep returning the full `List<string> Roles` alongside the single `Role` for backward compatibility with multi-role scenarios.

---

## Medium Priority

### M1. Config Update: no request-level validation

**Files:** `packages/api/Features/Config/Update/Endpoint.cs`, `Models.cs`

The `Request` record accepts `IReadOnlyList<ConfigDto> Items` with no validator. Invalid data (null ApproverRole, ApprovalLevel=0) relies on DB constraints, producing a generic error message instead of field-level validation feedback.

**Impact:** User experience degradation. Admin sees "Không thể cập nhật cấu hình" with no indication of what is wrong.

**Fix:** Add a `Validator<Request>` class with `NotNull()`, `NotEmpty()`, and `GreaterThanOrEqualTo(1)` rules.

### M2. Approve Data: unnecessary includes for Cancel/Reject queries

**Files:** `packages/api/Features/LeaveRequests/Cancel/Data.cs`, `Reject/Data.cs`

The `GetByIdAsync` in Cancel Data eagerly loads `User.DonVi` and `LeaveType`, but Cancel only reads `entity.UserId` and `entity.Status`. These joins add overhead without benefit.

Similarly, Reject Data loads `LeaveType` which is not referenced in the reject handler.

**Impact:** Minor performance cost on every cancel/reject operation.

**Fix:** Include only the navigation properties needed:
- Cancel: no includes needed (just `UserId` and `Status`)
- Reject: include `User` (for PhongBanId check) but not `LeaveType`

### M3. LeaveBalances List: year query param not validated

**File:** `packages/api/Features/LeaveBalances/List/Endpoint.cs`

`Query<int?>("year")` accepts any integer. A year value of 0, -1, or 99999 passes to the query without validation. Returns empty results instead of a validation error.

**Fix:** Add query param validation (e.g., `year >= 2000 && year <= 2100`) or accept it as a minor usability issue (intentional by design).

### M4. UpsertBalanceAsync concurrent access race

**File:** `packages/api/Features/LeaveRequests/Approve/Data.cs` (line 134-161)

The balance check `if (balance.UsedDays + entity.TotalDays > balance.TotalDays)` has a read-check-write race. Two concurrent approvals could both pass the check and overshoot the limit.

**Risk:** Low for an internal HR system with few concurrent approvers. But if throughput grows, this is a data integrity issue.

**Fix (future):** Use pessimistic locking (`UPDLOCK` hint) or retry-on-conflict pattern with a concurrency token on `LeaveBalance`.

---

## Low Priority

### L1. MapToDto extension method duplicates projection logic in List/Data.cs

**Files:** `packages/api/Features/LeaveRequests/List/Data.cs`, `My/Data.cs`

The List and My Data classes manually construct `LeaveRequestDto` in LINQ `Select(...)` instead of using `LeaveRequestMapping.MapToDto()`. This works fine for EF projection (no client evaluation) but duplicates the mapping logic across three files.

**Note:** This is acceptable because EF cannot translate extension method calls in `Select()`. The duplication is by necessity, not by oversight.

### L2. Missing trailing newlines in several files

**Files:** `Approve/Data.cs`, `Cancel/Data.cs`, `Reject/Data.cs`, `LeaveRequestDto.cs`, `LeaveRequestMapping.cs`

Several files lack a trailing newline (visible as `\ No newline at end of file` in diff). Minor formatting issue.

---

## Edge Cases Found

1. **Dual-role authz bypass** (covered in H1) -- the most impactful finding
2. **Multi-role user gets arbitrary single role label** (covered in H2)
3. **Config update with empty items list** would clear all LeaveConfigs with no config -- should at minimum allow this? Or forbid empty list
4. **Cancel endpoint requires non-CB.PCM roles but CB.PCM can create** -- consistent by design (CB creates, LD cancels)
5. **LeaveType deactivation after request creation**: an approved request associated with a now-inactive LeaveType is not checked during status transitions -- intentional per business rules

---

## Positive Observations

1. **Clean DI registration** -- all new Data classes registered in Program.cs, nothing missed
2. **Consistent pattern removal of Response wrappers** -- all endpoints now return raw DTOs for simpler client consumption
3. **Proper use of FastEndpoints Role-based auth** -- `Roles(...)` for admin/manager endpoints, `RequireAuthorization()` for user-self endpoints
4. **Business error messages in Vietnamese** -- consistent user-facing validation
5. **Good error handling** -- `try-catch` for `DbUpdateException` on all mutation endpoints
6. **No compile errors** -- build passes cleanly
7. **Good separation of concerns** -- Data classes handle persistence, Endpoint classes handle HTTP concerns
8. **State machine pattern in approve/reject** -- clear status transition logic

---

## Recommended Actions

1. **[CRITICAL FIX]** Fix dual-role bypass in Reject endpoint (H1) before deployment
2. **[FIX]** Fix MapRole to handle multi-role users with priority order (H2)
3. **[IMPROVE]** Add request validator for Config Update (M1)
4. **[IMPROVE]** Remove unnecessary EF Includes from Cancel/Reject Data (M2)
5. **[NOTE]** Flag UpsertBalanceAsync race condition for future optimization (M4)

---

## Unresolved Questions

- Is the `Role` string in the Auth/Me response consumed by the frontend for auth decisions (show/hide UI elements)? If yes, H2 becomes critical.
- Should Cancel allow GD.PGD to cancel? Currently only CB.PCM and LD.PCM can cancel, but a GD.PGD might create leave requests (if their role includes CB.PCM as well via multi-role JWT claims).

**Status:** DONE_WITH_CONCERNS
**Summary:** Build passes clean. Two security issues found (H1 - dual-role bypass in Reject, H2 - MapRole picks first role only). Recommend fixing before deployment.
