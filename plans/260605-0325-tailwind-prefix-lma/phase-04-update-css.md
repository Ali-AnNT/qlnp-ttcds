---
phase: 4
title: "Update CSS"
status: completed
priority: P1
effort: "0.5h"
dependencies: ["phase-02"]
---

# Phase 4: Update CSS

## Overview

Update `@apply` directives in `index.css` to use `lma-` prefixed class names. Must be done together with Phase 2 (config changes) for the build to compile.

## Requirements

- Functional: `@apply` directives must reference prefixed utility names
- Non-functional: CSS custom properties (`--background`, etc.) remain unchanged

## Architecture

When `prefix: "lma-"` is active, Tailwind only generates `lma-border-border`, not `border-border`. Therefore `@apply` must reference the prefixed name. Unprefixed `@apply border-border` will cause a build error.

## Related Code Files

- Modify: `packages/web/src/index.css` — 2 @apply directives

## Implementation Steps

1. **Update @apply in index.css**

   Current:
   ```css
   @layer base {
     * {
       @apply border-border;
     }
     body {
       @apply bg-background text-foreground;
       font-family: 'Be Vietnam Pro', sans-serif;
     }
   }
   ```

   Updated:
   ```css
   @layer base {
     * {
       @apply lma-border-border;
     }
     body {
       @apply lma-bg-background lma-text-foreground;
       font-family: 'Be Vietnam Pro', sans-serif;
     }
   }
   ```

2. **Verify CSS custom properties are NOT affected**

   The `:root` block with CSS custom properties (`--background`, `--primary`, etc.) uses HSL values directly — not Tailwind classes. These remain unchanged.

   However, since we removed `.qlnp-app` CSS scoping from postcss-prefix-selector, the `:root` selector now applies globally without the `.qlnp-app` wrapper. This is fine — `:root` is the standard location for CSS custom properties.

3. **Check custom scrollbar styles**

   The scrollbar CSS uses `hsl(var(--muted))` — direct CSS, not Tailwind classes. No changes needed.

4. **Verify no other @apply usages**

   ```bash
   grep -rn "@apply" packages/web/src --include="*.css"
   ```
   Should only find the 2 directives in index.css.

## Success Criteria

- [ ] `@apply border-border` → `@apply lma-border-border`
- [ ] `@apply bg-background text-foreground` → `@apply lma-bg-background lma-text-foreground`
- [ ] CSS custom properties unchanged
- [ ] No other @apply directives exist
- [ ] Build compiles after Phase 2 + Phase 4 changes together

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Missed @apply directive | Low | High | Grep for `@apply` to find all usages |
| Wrong prefix format | Low | High | Verify uses `lma-` (dash), not `lma:` (colon) |
| CSS custom properties accidentally modified | None | N/A | They're not Tailwind classes |

## Next Steps

- Phase 4 must be done together with Phase 2
- Phase 5 (verify build) depends on Phase 3 + Phase 4