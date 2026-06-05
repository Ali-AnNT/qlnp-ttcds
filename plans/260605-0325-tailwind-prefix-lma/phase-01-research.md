---
phase: 1
title: "Research"
status: completed
priority: P1
effort: "1h"
dependencies: []
---

# Phase 1: Research

## Overview

Research Tailwind prefix migration approach, tools, and trade-offs. Completed by 2 parallel researchers.

## Key Findings

### 1. Tailwind v3 Prefix Behavior

- `prefix: "lma"` in tailwind.config.ts → classes become `lma-flex` (dash separator)
- Prefix goes AFTER variant modifiers: `hover:lma-bg-primary`, `md:lma-grid-cols-2`
- Colon separator (`lma:flex`) is Tailwind v4 syntax — v3 may not support it cleanly
- `group`, `peer` markers do NOT get prefixed (they're not utilities)
- Custom CSS classes, third-party classes (Sonner) do NOT get prefixed

### 2. tailwind-merge (twMerge) Configuration

- Current: bare `twMerge()` — does NOT understand prefixed classes
- Must update: `extendTailwindMerge({ override: { prefix: "lma-" } })`
- Without this: `cn("lma-p-4", "lma-p-2")` → `"lma-p-4 lma-p-2"` (wrong, should merge to `lma-p-2`)

### 3. @apply Directives

- 2 usages in index.css must use prefixed names:
  - `@apply border-border` → `@apply lma-border-border`
  - `@apply bg-background text-foreground` → `@apply lma-bg-background lma:text-foreground`
- Failure to prefix causes build error (Tailwind won't find unprefixed classes)

### 4. shadcn/ui Prefix Support

- `components.json` has `"prefix": ""` → must change to `"prefix": "lma"`
- **Known bug (#7436):** shadcn prefix transformer incorrectly handles data-attribute variants
  - Expected: `lma:data-[state=open]:animate-in`
  - Actual bug: `data-[state=open]:lma:animate-in` (wrong)
- Existing components NOT retroactively updated — must re-add or manually update

### 5. postcss-prefix-selector vs Tailwind prefix

- Current `.qlnp-app` scoping: complete CSS isolation, zero source changes needed
- Tailwind prefix: namespacing via class names, no isolation for preflight/base resets
- They CAN coexist but is redundant (double scoping with no benefit)
- **Researcher recommendation:** Keep postcss-prefix-selector (user chose to remove it)

### 6. Migration Tools

| Tool | Approach | Maturity | Risk |
|------|----------|----------|------|
| cnat | CSS-matching, purpose-built | v0.0.7, 1 star | Low maturity but correct |
| tailwind-prefix-codemod | jscodeshift AST | Archived | No maintenance |
| ast-grep | General AST, custom rules | Mature | High manual effort |
| Manual + regex | Find/replace | N/A | Fragile for dynamic classes |

### 7. Testing Impact

- LOW: No snapshot tests with className, no `.snap` files, no `toHaveClass` assertions

### 8. Critical: Colon vs Dash Prefix

- **Tailwind v3** uses dash separator by default: `prefix: "lma-"` → `lma-flex`
- **Tailwind v4** uses colon separator: `@config prefix lma` → `lma:flex`
- User wants `lma:` (colon) — needs validation whether v3 supports this
- If v3 doesn't support colon cleanly → must upgrade to v4 (much larger scope)

## Success Criteria

- [x] Research completed
- [x] Trade-offs documented
- [x] Migration tools evaluated
- [x] Colon vs dash prefix clarified