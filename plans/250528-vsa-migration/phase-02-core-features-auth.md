---
phase: 2
title: "Auth"
status: completed
priority: P1
effort: "30m"
dependencies: [1]
---

# Phase 2: Auth

## Overview

Migrate auth feature (AuthContext, LoginPage, auth API) into `features/auth/`. This is the smallest feature and has no dependencies on other features — ideal first feature migration.

## Requirements

- Functional: Login flow unchanged. JWT postMessage + localStorage auth unchanged.
- Non-functional: AuthContext remains globally accessible via `features/auth` public API

## Architecture

```
features/auth/
├── api/
│   ├── auth.api.ts          # From src/api/auth.api.ts
│   └── types.ts             # AuthUser type
├── components/
│   └── login-page.tsx       # From src/pages/LoginPage.tsx (125 lines)
├── contexts/
│   └── auth-context.tsx     # From src/contexts/AuthContext.tsx (63 lines)
├── hooks/
│   ├── use-auth.ts          # Re-export from auth-context
│   └── use-auth-guard.tsx   # Extract AuthGuard from App.tsx
└── index.ts                 # Public API: useAuth, AuthProvider, LoginPage, AuthGuard
```

## Related Code Files

- Move: `src/api/auth.api.ts` → `features/auth/api/auth.api.ts`
- Move: `src/contexts/AuthContext.tsx` → `features/auth/contexts/auth-context.tsx`
- Move: `src/pages/LoginPage.tsx` → `features/auth/components/login-page.tsx`
- Extract: AuthGuard from `src/App.tsx` → `features/auth/hooks/use-auth-guard.tsx`
- Create: `features/auth/api/types.ts`, `features/auth/index.ts`
- Update: `app/router.tsx` (import LoginPage from features)
- Delete: old `src/contexts/AuthContext.tsx`, old `src/api/auth.api.ts`, old `src/pages/LoginPage.tsx`

## Implementation Steps

1. Create feature directory:
   ```bash
   mkdir -p src/features/auth/{api,components,contexts,hooks}
   ```

2. Move auth API:
   ```bash
   mv src/api/auth.api.ts src/features/auth/api/auth.api.ts
   ```
   Extract `AuthUser` type into `features/auth/api/types.ts`.

3. Move AuthContext:
   ```bash
   mv src/contexts/AuthContext.tsx src/features/auth/contexts/auth-context.tsx
   ```
   Update import: `@/api/auth.api` → `../api/auth.api` (relative within feature).

4. Move LoginPage:
   ```bash
   mv src/pages/LoginPage.tsx src/features/auth/components/login-page.tsx
   ```

5. Extract AuthGuard from router.tsx:
   ```typescript
   // features/auth/hooks/use-auth-guard.tsx
   export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
     const { user, loading } = useAuth();
     if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
     if (!user) return <Navigate to="/login" replace />;
     return <>{children}</>;
   };
   ```

6. Create `use-auth.ts` re-export hook:
   ```typescript
   // features/auth/hooks/use-auth.ts
   export { useAuth } from '../contexts/auth-context';
   ```

7. Create barrel export:
   ```typescript
   // features/auth/index.ts
   export { LoginPage } from './components/login-page';
   export { AuthProvider } from './contexts/auth-context';
   export { useAuth } from './hooks/use-auth';
   export { AuthGuard } from './hooks/use-auth-guard';
   export type { AuthUser } from './api/types';
   ```

8. Update consumers:
   - `app/router.tsx`: import `{ LoginPage, AuthGuard }` from `@/features/auth`
   - `app/providers.tsx`: import `{ AuthProvider }` from `@/features/auth`
   - All pages using `useAuth`: update to `import { useAuth } from '@/features/auth'`

9. Delete old files:
   - `src/contexts/AuthContext.tsx`
   - `src/api/auth.api.ts`
   - `src/pages/LoginPage.tsx`

10. Build and verify: `bun run build`

## Success Criteria

- [x] Auth feature fully self-contained in `features/auth/`
- [x] `features/auth/index.ts` exports public API
- [x] All consumers import from `@/features/auth`
- [x] Login flow works identically
- [x] AuthGuard works (redirects unauthenticated users)
- [x] `bun run build` passes
- [x] No references to old auth paths

## Risk Assessment

- **Low risk**: Auth is isolated, no feature-to-feature deps.
- **AuthGuard extraction**: Simple component, just need to verify redirect still works.
