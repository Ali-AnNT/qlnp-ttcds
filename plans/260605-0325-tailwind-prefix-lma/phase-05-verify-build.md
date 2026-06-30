---
phase: 5
title: "Verify Build"
status: completed
priority: P1
effort: "1h"
dependencies: ["phase-03", "phase-04"]
---

# Phase 5: Verify Build

## Overview

Run build, type-check, and visual verification to ensure all `lma-` prefixed classes work correctly. Includes comprehensive grep audit for missed prefixes and visual spot-check.

## Requirements

- Functional: All UI components render correctly with `lma-` prefixed classes
- Non-functional: No console errors, no missing styles, no visual regressions

## Architecture

Verification strategy: build → type-check → dev server → visual spot-check → grep audit.

## Implementation Steps

1. **Build verification**
   ```bash
   cd packages/web && pnpm build
   ```
   - Must complete without errors
   - No "class not found" warnings from Tailwind

2. **Type-check**
   ```bash
   cd packages/web && pnpm tsc --noEmit
   ```
   - Must pass with no type errors

3. **Grep audit for missed prefixes — comprehensive**

   ```bash
   # Find common Tailwind utilities that are NOT prefixed with lma-
   # Exclude: group, peer, qlnp-app, custom classes
   grep -rnP '(?<!lma-)(?<!lma:)\b(flex|grid|block|hidden|inline|table|absolute|relative|fixed|sticky)\b' \
     packages/web/src --include="*.tsx" --include="*.ts" | \
     grep -v 'group\|peer\|node_modules'

   grep -rnP '(?<!lma-)\b(text-\w+|bg-\w+|p-\w+|m-\w+|w-\w+|h-\w+|rounded|border|shadow|gap-\w+|space-\w+|items-\w+|justify-\w+)\b' \
     packages/web/src --include="*.tsx" --include="*.ts" | \
     grep -v 'lma-' | grep -v 'group\|peer'
   ```

   Should return ZERO matches (all Tailwind utilities must be prefixed).

4. **Verify @apply directives**
   ```bash
   grep -rn "@apply" packages/web/src --include="*.css"
   ```
   All @apply references must use `lma-` prefix.

5. **Verify cn() utility**
   ```bash
   grep -rn "twMerge\|extendTailwindMerge\|lma-" packages/web/src/shared/lib/utils.ts
   ```
   Must show `extendTailwindMerge` with `prefix: "lma-"`.

6. **Start dev server and visual spot-check**
   ```bash
   cd packages/web && pnpm dev
   ```
   Check these pages/components:
   - Login page (auth)
   - Dashboard page
   - Sidebar navigation (layout)
   - Dialog/modal components (data-variant patterns)
   - Calendar component (react-day-picker classNames)
   - Toast notifications (Sonner)
   - Form components (input, select, checkbox)

7. **Check portal components specifically**
   Without `.qlnp-app` on `<body>`, portal components (dialog, popover, dropdown) must still receive correct styles. Verify:
   - Dialog overlay and content render correctly
   - Popover positions correctly
   - Dropdown menu items are styled correctly
   - Sheet/Drawer slides in correctly

8. **Verify Sonner/toast**
   - `toaster` and `toast` classes remain unprefixed (Sonner library classes)
   - Toast notifications render and auto-dismiss correctly

9. **Verify group/peer selectors**
   - Sidebar collapse/expand works (group/sidebar)
   - Hover states on grouped elements work

10. **Add eslint-plugin-tailwindcss for prefix enforcement** <!-- Updated: Validation Session 1 - lint rule -->

    ```bash
    cd packages/web
    pnpm add -D eslint-plugin-tailwindcss
    ```

    Add to ESLint config:
    ```json
    {
      "plugins": ["tailwindcss"],
      "rules": {
        "tailwindcss/classnames-order": "off",
        "tailwindcss/no-contradicting-classname": "warn",
        "tailwindcss/enforces-negative-arbitrary-values": "warn",
        "tailwindcss/migration-from-tailwind-2": "off"
      },
      "settings": {
        "tailwindcss": {
          "callees": ["cn", "clsx", "cva"],
          "classListDoubleQuote": true,
          "prefix": "lma-"
        }
      }
    }
    ```

    Run lint check:
    ```bash
    pnpm lint
    ```

    Verify that unprefixed Tailwind classes are flagged as errors.

## Success Criteria

- [ ] `pnpm build` completes without errors
- [ ] `pnpm tsc --noEmit` passes
- [ ] Grep audit finds zero unprefixed Tailwind utilities in className
- [ ] All @apply directives use `lma-` prefix
- [ ] cn() utility uses `extendTailwindMerge` with `prefix: "lma-"`
- [ ] Login page renders correctly
- [ ] Dashboard renders correctly
- [ ] Sidebar navigation works
- [ ] Dialog/modal components render correctly
- [ ] Calendar component renders correctly
- [ ] Toast notifications render correctly
- [ ] Portal components render correctly (no .qlnp-app scoping)
- [ ] group/peer selectors work correctly
- [ ] eslint-plugin-tailwindcss installed with prefix enforcement

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Missed unprefixed classes | Medium | High | Comprehensive grep audit |
| shadcn data-variant bug | Medium | Medium | Manual review of 5 components |
| Portal styling broken without .qlnp-app | Low | High | Verify body gets Tailwind preflight styles |
| tailwind-merge not merging correctly | Low | High | Visual check for duplicate/conflicting classes |

## Rollback Plan

If critical issues are found:
1. Revert to branch backup commit
2. Restore postcss-prefix-selector config
3. Remove Tailwind prefix from config
4. Revert cn() utility change
5. Full git revert of the migration branch

## Post-Migration Notes

- Every new shadcn/ui component added via `npx shadcn add` will need manual `lma-` prefix updates
- **eslint-plugin-tailwindcss** with `prefix: "lma-"` setting will catch unprefixed classes in CI
- Document the prefix convention in `docs/code-standards.md`
- **Isolation trade-off:** Without `.qlnp-app` CSS scoping, global `:root` custom properties and preflight resets are unscoped. If embedding in a host app with Tailwind, custom property names may conflict — prefix CSS custom property names with `--lma-` if needed in future

## Next Steps

- After successful verification, merge to dev branch
- Update project documentation to note the prefix convention
- Consider adding a lint rule to catch unprefixed Tailwind classes in future PRs