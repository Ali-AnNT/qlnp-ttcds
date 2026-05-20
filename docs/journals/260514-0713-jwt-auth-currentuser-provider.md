# JWT Auth + Typed ICurrentUserProvider

**Date**: 2026-05-20
**Severity**: Medium
**Component**: Auth
**Status**: Resolved

## What Happened

Replaced the old `X-User-Id`/`X-User-Name` gateway header auth with standard JWT Bearer authentication. Introduced `ICurrentUserProvider` + `CurrentUserProvider` to give endpoints typed, injection-based access to the current user instead of fishing through `HttpContext.Items`.

Three phases across 7 days: JWT infrastructure in Program.cs, provider interface/implementation, then endpoint migration and middleware cleanup.

## The Brutal Truth

Three phases completed ahead of plan schedule. But we shipped with two known bugs. `Auth/Me` endpoint has no `RequireAuthorization()` attribute -- it is accessible without a valid JWT, surviving only because `CurrentUserProvider` throws on missing claims. And the claim parsing silently swallows missing values: `long.Parse(null ?? "0")` defaults to 0, masking configuration errors. These should have been caught in review.

## Root Cause

No security-focused review pass. The plan explicitly tracked these as known issues but they were never resolved before moving on. Classic "implementation ahead of schedule" rush -- speed cost us correctness on the auth boundary.

## Lessons Learned

Auth code needs a dedicated security review before closing. Silent-fallbacks for JWT claims (defaulting to 0) are dangerous -- they make missing claims invisible until something breaks downstream. Any auth middleware missing `RequireAuthorization` is a P0 until fixed.

## Next Steps

- Add `RequireAuthorization()` to `Auth/Me`
- Replace silent-fallback defaulting with explicit `ClaimNotFoundException` or use `ClaimsPrincipal.FindFirst().Value` with null check
- Add `ILogger` to `CurrentUserProvider` for traceability
