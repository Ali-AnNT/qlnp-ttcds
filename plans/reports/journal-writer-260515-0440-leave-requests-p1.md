# LeaveRequests P1: Vertical Slice Endpoints, Entity Changes, and the Nullable Trap

**Date**: 2026-05-15 04:40
**Severity**: Medium
**Component**: LeaveRequests API, Entity layer, EF Migrations
**Status**: Resolved (build clean, known limitations deferred)

## What Happened

Implemented LeaveRequests P1 — 3 endpoints (List, Create, Update) using FastEndpoints vertical slice pattern. Added `RequestedApproverId` + nav prop to LeaveRequest, `DonVi` nav prop to UserMaster, FK configurations, seed data updates, role-based list filtering, overlap checks, and a `BusinessDayCalculator` utility. Code review caught a lurking NullReferenceException and missing FK violation handling. Fixed both. Build: 0 errors, 0 warnings.

## The Brutal Truth

The nullable nav prop trap got us again. `DonVi!` — the classic "just suppress the warning" move that works until it doesn't. Of course List endpoint crashed when a UserMaster had no DonVi. This is the third time nullable navigation properties have bitten us in this codebase. The frustrating part is the fix is trivial (ternary null check) but the bug hides in plain sight because the `!` operator silences the compiler while lying to the runtime. We also shipped without FK violation handling on Create/Update — POSTing a LeaveRequest with a bogus LeaveTypeId would throw a raw 500 instead of a clean 409. That's on us for not thinking about FK constraints as a user-facing error scenario.

## Technical Details

- **NullReferenceException**: `List/Data.cs` accessed `UserMaster.DonVi!` — when DonVi is null (users not assigned to a department), runtime crash. Fixed with ternary: `DonVi != null ? DonVi.TenDonVi : null`
- **Missing DbUpdateException handling**: Create and Update endpoints had no try/catch around `SaveChangesAsync()`. FK violations (invalid LeaveTypeId, RequestedApproverId, etc.) surfaced as unhandled 500s. Added `catch (DbUpdateException)` → 409 Conflict.
- **Unused Id in Update Request**: PUT endpoint used route param for Id but Request record also declared an Id field. Removed redundant field.
- **Migration**: `AddRequestedApproverIdAndNavProps` — FK `RequestedApprover → SetNull`, `DonVi → Restrict`.
- **Role-based filtering**: CB.PCM sees own requests, LD.PCM sees department (PhongBanId), GD.PGD/QTHT sees all.

## What We Tried

1. Initial implementation — built endpoints, entity changes, migration in one pass
2. Code review flagged NullReferenceException risk and missing FK error handling
3. Fixed both issues inline, re-verified build

## Root Cause Analysis

Two root causes, both stemming from the same mental gap: **not thinking about what happens when data is incomplete or wrong at the boundary**.

1. Nullable nav props: We keep using `!` to silence compiler warnings instead of actually handling nulls. The discipline of "every nav prop access must handle null" hasn't stuck yet.
2. FK violation handling: We treated the database as a trusted source of truth for input validation instead of recognizing that API consumers will send garbage and we need to translate constraint violations into meaningful HTTP responses.

## Lessons Learned

- **Never use `!` on navigation properties.** If the compiler warns it might be null, it *will* be null in production. Use ternary or null-conditional operators every time.
- **Wrap `SaveChangesAsync` in try/catch(DbUpdateException).** FK violations are user errors, not server errors. Return 409, not 500.
- **Deferred decisions accumulate debt fast.** Magic strings for status, no RequestedApproverId validation, no holiday support — each deferral is fine individually but the list grew to 5 items in a single P1. Need to track these explicitly or they become invisible footguns.

## Next Steps

- Create `LeaveRequestStatus` constants class (replace magic strings "pending", "approved_leader", "approved_director", "rejected") — P2
- Add `RequestedApproverId` validation against `USER_MASTER` in Create endpoint — P2
- Vietnamese holiday support in `BusinessDayCalculator` — P2+
- Audit all existing nav prop accesses for `!` usage across the codebase — proactive
- Branch `feat/leave-requests-p1` from dev before commit (per branch flow rules)
