# Code Standards - QLNP-TTCDS

## Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| React components | PascalCase | `AppSidebar.tsx`, `LeaveNewPage.tsx` |
| Files (components) | PascalCase | `DashboardPage.tsx`, `LeaveRequestForm.tsx` |
| Files (utilities/hooks) | kebab-case | `use-mobile.tsx`, `date-utils.ts`, `leave-data.ts` |
| Functions / methods | camelCase | `formatDate()`, `loadData()`, `handleLogin()` |
| Variables / state | camelCase | `currentUser`, `leaveRequests`, `isMobile` |
| TypeScript types / interfaces | PascalCase | `UserRole`, `LeaveRequest`, `AppState` |
| Zod schemas | camelCase, suffix `Schema` | `leaveRequestSchema` |
| Constants / labels | camelCase + `Labels` suffix | `roleLabels`, `leaveStatusLabels` |
| Env variables | UPPER_SNAKE_CASE, prefix `VITE_` | `VITE_SUPABASE_URL` |
| Database tables | snake_case | `leave_requests`, `approval_config` |
| Database columns | snake_case | `employee_id`, `full_name`, `start_date` |
| Supabase RPC functions | snake_case | `verify_login` |

## TypeScript

### Strictness
- TypeScript 5.8, strict mode in tsconfig
- All props, state, and function signatures typed explicitly
- Avoid `any` - use proper types from `@/lib/leave-data.ts`
- Database types generated via Supabase CLI in `@/integrations/supabase/types.ts`

### Type Imports
Always import types from shared `@/lib/leave-data.ts`:
```typescript
import type { UserRole, LeaveRequest, LeaveStatus } from "@/lib/leave-data";
```

### Union Types
Use string unions for fixed value sets:
```typescript
export type UserRole = "CB.PCM" | "LD.PCM" | "GD.PGD" | "QTHT";
export type LeaveStatus = "pending" | "approved_leader" | "approved_director" | "rejected" | "cancelled";
```

### Label Maps
Use Record<> objects for display labels:
```typescript
export const roleLabels: Record<UserRole, string> = {
  "CB.PCM": "Can bo phong chuyen mon",
  // ...
};
```

## Component Structure

### Page Components
- Default export (no named export wrapper)
- Located in `src/pages/`
- One component per file
- Use Zustand store directly via hooks
- Call `loadData()` on mount via `useEffect`
- Must be wrapped in AppLayout via React Router `<Outlet />`

### Layout & UI Components
- Named exports for shared components
- Located in `src/components/`
- Props interface defined inline or at top
- No default export (use named export pattern)

### shadcn/ui Components
- Auto-generated, located in `src/components/ui/`
- Do NOT modify generated files manually
- Extend via wrapper components in `src/components/`

## Import Order

1. React / React Router imports
2. Store imports (`@/store/useStore`)
3. Library / utility imports (`@/lib/...`, `@/integrations/...`)
4. UI component imports (`@/components/ui/...`)
5. Shared component imports (`@/components/...`)
6. Icon imports (lucide-react)
7. Type imports (last)

Use `@/` path alias for all internal imports:
```typescript
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
```

## State Management

### Zustand Store (`src/store/useStore.ts`)
- Single store for all app state
- State: currentUser + all lookup data (departments, employees, leaveTypes, leaveRequests, approvalConfigs)
- Actions: login, logout, loadData, addLeaveRequest, updateLeaveRequest
- Access via selector pattern: `useStore(s => s.currentUser)`
- Never mutate state directly; always use set()

### TanStack React Query
- QueryClient created in App.tsx, provided via QueryClientProvider
- Currently NOT used in pages (pages use Zustand directly)
- Prepared for future server state caching

## Component Pattern Example

```typescript
import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { leaveStatusLabels, type LeaveStatus } from "@/lib/leave-data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MyComponent = () => {
  const currentUser = useStore((s) => s.currentUser);
  const leaveRequests = useStore((s) => s.leaveRequests);
  const loadData = useStore((s) => s.loadData);

  useEffect(() => { loadData(); }, []);

  return (
    <div>...</div>
  );
};

export default MyComponent;
```

## Error Handling

- Wrap async operations in try/catch
- Display errors via Sonner toast: `toast.error("message")`
- Supabase errors: check `{ error }` from query responses
- Form validation: React Hook Form + Zod schema
- Network failures: show generic "Loi ket noi" message

## Formatting & Linting

- ESLint 9 flat config (`eslint.config.js`)
- React Hooks plugin for hooks rules
- TypeScript ESLint for TS-specific rules
- No strict prettier config; prioritize readability
- Indentation: tabs (2-space equivalent)

## CSS / Styling

- Tailwind utility classes ONLY (no custom CSS files except index.css)
- Use shadcn/ui theme CSS variables for colors
- Use `cn()` utility for conditional classes
- Status colors: semantic CSS classes (bg-warning, text-success, etc.)
- Responsive: mobile-first with md: breakpoint for desktop

## Git Practices

- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- Keep commits focused and atomic
- No AI references in commit messages
- Branch: main (trunk-based)
- Vietnamese for commit descriptions where appropriate
