---
phase: 2
title: "Configure"
status: completed
priority: P1
effort: "1h"
dependencies: ["phase-01"]
---

# Phase 2: Configure

## Overview

Update Tailwind config, PostCSS config, shadcn components.json, and cn() utility to enable the prefix. **Must use dash separator (`lma-`) since colon (`lma:`) is broken in Tailwind v3.**

## Requirements

- Functional: Tailwind generates prefixed utility classes with `lma-` separator
- Non-functional: Build compiles after config change (UI broken until Phase 3)

> **Validation note (Session 1):** Removing postcss-prefix-selector means `:root` CSS custom properties and Tailwind preflight resets will be global (not scoped under `.qlnp-app`). Accepted trade-off: class name namespacing via `lma-` prefix is sufficient for embedding use case.

## Architecture

**Prefix format: `lma-` (dash separator)**

Tailwind v3 does NOT support colon in prefix (Issue #5016 — won't fix). The `:` collides with variant separator causing ambiguous parsing. Must use dash.

Class examples with `lma-`:
- `flex` → `lma-flex`
- `bg-primary` → `lma-bg-primary`
- `hover:bg-primary` → `hover:lma-bg-primary`
- `sm:grid-cols-2` → `sm:lma-grid-cols-2`
- `data-[state=open]:bg-accent` → `data-[state=open]:lma-bg-accent`
- `-mt-8` → `-lma-mt-8`
- `!font-bold` → `!lma-font-bold`

## Related Code Files

- Modify: `packages/web/tailwind.config.ts` — set `prefix: "lma-"`
- Modify: `packages/web/postcss.config.js` — remove postcss-prefix-selector plugin
- Modify: `packages/web/components.json` — set `"prefix": "lma-"`
- Modify: `packages/web/src/shared/lib/utils.ts` — update cn() with extendTailwindMerge
- Modify: `packages/web/src/main.tsx` — remove `document.body.classList.add("qlnp-app")`
- Modify: `packages/web/src/app/App.tsx` — remove `className="qlnp-app"` from root div
- Modify: `packages/web/package.json` — remove postcss-prefix-selector dependency

## Implementation Steps

1. **Create git branch** `feat/tailwind-prefix-lma` for rollback safety

2. **Update tailwind.config.ts**
   ```ts
   prefix: "lma-",  // was: ""
   ```
   Keep all other config unchanged.

3. **Update postcss.config.js** — remove postcss-prefix-selector
   ```js
   export default {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   };
   ```

4. **Update components.json**
   ```json
   "prefix": "lma-"
   ```

5. **Update cn() utility** — CRITICAL: use `extend`, NOT `override`
   ```ts
   import { clsx, type ClassValue } from "clsx";
   import { extendTailwindMerge } from "tailwind-merge";

   // extendTailwindMerge preserves default classGroups — override destroys them
   const customTwMerge = extendTailwindMerge({
     prefix: "lma-",
   });

   export function cn(...inputs: ClassValue[]) {
     return customTwMerge(clsx(inputs));
   }
   ```
   **Red team note:** Using `override` instead of `extend` would silently break ALL class merging. `extend` is correct.

6. **Remove .qlnp-app references**
   - `src/main.tsx`: Remove line 6-7 (comment + `document.body.classList.add("qlnp-app")`)
   - `src/app/App.tsx`: Change `<div className="qlnp-app">` to `<div>` (or keep if it has other classes)

7. **Update package.json** — remove `postcss-prefix-selector` dependency
   ```bash
   cd packages/web && pnpm remove postcss-prefix-selector
   ```

8. **Run build validation**
   ```bash
   pnpm --filter web build
   ```
   Build will succeed but UI will be broken (source files not yet updated).

## Success Criteria

- [x] `prefix: "lma-"` set in tailwind.config.ts
- [x] postcss-prefix-selector removed from postcss.config.js and package.json
- [x] components.json prefix set to `"lma-"`
- [x] cn() uses `extendTailwindMerge({ prefix: "lma-" })` (NOT `override`)
- [x] .qlnp-app references removed from main.tsx and App.tsx
- [x] Build compiles (UI broken until Phase 3)

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Used `override` instead of `extend` in twMerge | Low | Critical | Code review checklist item |
| Forgot to remove postcss-prefix-selector dep | Low | Medium | Build will fail if plugin listed but not installed |
| shadcn prefix format mismatch | Low | Medium | Test `npx shadcn add button` after config change |

## Next Steps

- Phase 3 (source files) and Phase 4 (CSS) depend on Phase 2 completing
- Phase 2 + Phase 4 should be done together (both needed for build)