# Phase 2 Auth VSA Migration

**Date**: 2026-05-29
**Severity**: Medium
**Component**: features/auth
**Status**: Resolved

## What Happened

Migrated auth from layered structure (scattered across `src/api/`, `src/contexts/`, `src/components/`) into a single VSA slice at `src/features/auth/`. Created 7 new files, updated 11 consumers, deleted 3 old files. Build passes, 14/14 tests green.

## The Brutal Truth

This was mechanically straightforward but tedious as hell. Eleven consumer files needed import path updates -- each one a potential breakage if we fat-fingered the path. The real annoyance: three pre-existing issues surfaced during migration that we cannot fix because they are out of scope. Leaving known security holes (postMessage without origin validation) and architectural leaks (logout logic outside auth feature) feels bad, but scope creep would have killed momentum.

## Technical Details

**Files created:**
- `features/auth/api/auth.api.ts`
- `features/auth/components/LoginPage.tsx`
- `features/auth/contexts/auth-context.tsx`
- `features/auth/hooks/use-auth.ts`
- `features/auth/hooks/use-auth-guard.ts` (extracted from router.tsx)
- `features/auth/types.ts` (AuthUser type extracted)
- `features/auth/index.ts` (barrel export)

**Files deleted:**
- `src/api/auth.api.ts`
- `src/contexts/AuthContext.tsx`
- `src/components/LoginPage.tsx`

**11 consumer files updated** with new import paths from `@/features/auth`.

## What We Tried

1. Initial barrel export only re-exported context, hooks, types. Code review flagged a test importing the internal `auth.api.ts` path directly -- added `authApi` to barrel to fix.
2. Considered fixing `postMessage` origin validation during migration -- rejected, out of scope.
3. Considered moving logout logic from `AppSidebar` into auth feature -- rejected, out of scope.

## Root Cause Analysis

Auth was scattered across three layers (`api/`, `contexts/`, `components/`) because the original codebase followed a technical-layering pattern. This meant any consumer needed to know the internal structure of auth to import correctly. VSA consolidates behind a single barrel, hiding internals.

The pre-existing issues (postMessage origin validation, logout encapsulation, react-refresh warning) were not caused by this migration. They existed before and were simply exposed when we looked closely at the code.

## Lessons Learned

1. **Always check test imports before finalizing barrel exports.** Tests importing internal paths is a smell. If the barrel does not export it, either the test is wrong or the barrel is incomplete. In our case, `authApi` needed to be public.
2. **Default exports in barrels need explicit syntax.** `export { default as LoginPage }` is not obvious if you are used to named re-exports. Forgetting this breaks consumers.
3. **Relative imports within a feature slice keep coupling local.** `auth-context.tsx` uses `../api/auth.api` instead of `@/features/auth/api/auth.api`. This prevents circular dependency through the barrel and makes the feature's internal structure self-contained.
4. **Migration surfaces tech debt you cannot fix in scope.** Document it immediately or it gets forgotten. We logged three items; they need owners and timelines.

## Next Steps

- **Security**: postMessage handler in auth needs origin validation. Owner: TBD. Timeline: before any production auth flow.
- **Architecture**: Logout logic in `AppSidebar` should be moved into auth feature (e.g., `useLogout` hook). Owner: TBD. Timeline: Phase 3 or dedicated cleanup pass.
- **Build warning**: react-refresh warning from `auth-context.tsx` mixing component and hook exports. Owner: TBD. Timeline: next frontend sprint.