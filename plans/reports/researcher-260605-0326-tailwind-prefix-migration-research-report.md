# Tailwind CSS Prefix Migration Research Report

**Date:** 2026-06-05
**Project:** qlnp-ttcds (Tailwind v3.4.19, ~1023 className references, 54 cn() usages)

---

## 1. Tailwind Official Migration Tool

**Verdict: NOT applicable for v3-to-v3 prefix addition.**

The official `npx @tailwindcss/upgrade` codemod is designed for **v3 → v4 migration**, not for adding a prefix within v3. It:
- Migrates JS config → CSS-based config
- Changes prefix syntax from v3 (`hover:tw-bg-red`) to v4 (`tw:hover:bg-red`)
- Rewrites `@import` directives

This project is staying on v3, so this tool is irrelevant. There is **no official Tailwind CLI command** for adding a prefix to an existing v3 codebase.

**For this project:** You simply set `prefix: "lma-"` in `tailwind.config.ts` and Tailwind's JIT compiler will generate prefixed CSS automatically. The hard part is renaming classes in 1023 template locations.

---

## 2. AST-Based Codemod Tools

### Ranked Comparison

| Tool | Type | Stars | Last Updated | v3 Prefix Support | Risk |
|------|------|-------|-------------|-------------------|------|
| **cnat** | Rust AST CLI | 1 | 2024-04 | Yes, designed for it | Low maturity (v0.0.7) |
| **tailwind-prefix-codemod** | jscodeshift | ~20 | Archived 2024 | Yes, v3-aware | Archived, no maintenance |
| **ast-grep** | General AST | 8000+ | Active | No built-in TW rules | Must write custom rules |
| **tw-prefixer** | Web tool | 5 | 2025-07 | Yes, v3-aware | No CLI, web-only |

### Recommendation: **cnat** (with caveats)

**cnat** is the most purpose-built tool for this exact job. It:
- Reads a generated Tailwind CSS file to know exactly which classes are Tailwind
- Only prefixes classes it identifies as Tailwind (preserves custom classes)
- Handles variant ordering correctly (`md:hover:bg-red` → `md:hover:lma-bg-red`)
- Supports custom scopes (`className`, `class`, `cva()`, etc.)
- Works as CLI: `cnat prefix -i output.css --prefix 'lma-' ./packages/web/src`

**Caveats:**
- v0.0.7 — early stage, low community adoption (1 star)
- Only handles `ts|js|tsx|jsx` files (no HTML templates)
- Requires pre-generated CSS file as input
- No dry-run mode (must use git for rollback)

**Fallback: tailwind-prefix-codemod** (jscodeshift) is archived but more battle-tested. Supports dry-run. However, its last commit was mid-2024 and it's archived.

**ast-grep** is viable if you want to write custom replacement rules, but requires significant rule authoring effort for the full Tailwind class syntax.

---

## 3. Regex Approach for Tailwind Prefix Migration

### How v3 Prefix Ordering Works (Critical)

In Tailwind v3, the order is:

```
[variants]:[important][negative][prefix][utility]
```

Examples:
- `flex` → `lma-flex`
- `hover:bg-red-500` → `hover:lma-bg-red-500`
- `md:hover:text-lg` → `md:hover:lma-text-lg`
- `-mt-8` → `-lma-mt-8`
- `!font-bold` → `!lma-font-bold`
- `hover:!text-red` → `hover:!lma-text-red`
- `dark:hover:focus:bg-red-500` → `dark:hover:focus:lma-bg-red-500`
- `text-[#e5e5e5]` → `lma-text-[#e5e5e5]`
- `hover:text-[#e5e5e5]` → `hover:lma-text-[#e5e5e5]`

**The prefix goes AFTER all variant modifiers (colons) but BEFORE the utility name.** This is the v3 convention.

### Variant Ordering Reference

Tailwind v3 orders variants as:
1. Responsive: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
2. State: `hover:`, `focus:`, `focus-within:`, `focus-visible:`, `active:`, `visited:`
3. Group/Peer: `group-hover:`, `group-focus:`, `peer-focus:`, `peer-hover:`
4. Motion: `motion-safe:`, `motion-reduce:`
5. Dark mode: `dark:`
6. Orientation: `portrait:`, `landscape:`
7. Print: `print:`
8. RTL: `rtl:`, `ltr:`
9. Optional: `optional:`
10. Default: `default:`

All variants are separated by `:` and the prefix goes after the last one.

### Regex Pattern

A workable regex for prefixing (inserting `lma-` after the last `:` before the utility):

```regex
# Match a Tailwind class token and insert prefix after variants
# This is the core substitution pattern:
(?<![-\w])(?:(?:[a-z0-9]+:)*)([-!]?)([\w-]+(?:\[.*?\])?)(?=[\s"'<>]|$)
# Replace with: $1lma-$2  (where $1 captures negation/important, $2 captures utility)
```

However, **regex alone is fragile** because:
- Arbitrary values can contain spaces, brackets, nested colons
- Template literals with `${}` expressions
- Conditional class strings (ternary operators, arrays)
- Class strings split across multiple lines

### Classes That Should NOT Be Prefixed

- Custom CSS classes (e.g., `sidebar-group`, `my-custom-class`)
- CSS-in-JS class names (e.g., from styled-components)
- Data attributes, event handlers
- Third-party library classes (e.g., `ProseMirror`, `radix-` prefixed classes)
- shadcn/ui `data-[...]` variants — these ARE Tailwind and DO need prefixing

**This is why cnat's approach of using a generated CSS file is superior to regex** — it knows definitively which classes are Tailwind-generated.

---

## 4. tailwind-merge Configuration with Custom Prefix

### Current Setup
- `tailwind-merge` v2.6.0 (project uses `^2.6.0`)
- Uses `twMerge()` via `cn()` utility in `packages/web/src/shared/lib/utils.ts`

### Required Change

In tailwind-merge v2, configure the prefix **with the dash included**:

```ts
import { extendTailwindMerge } from "tailwind-merge";

const customTwMerge = extendTailwindMerge({
  prefix: "lma-",
  // ... any existing theme overrides
});

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}
```

**Key:** The `prefix` config tells tailwind-merge to strip the prefix before comparing utilities, then re-apply it to the merged result. Without this, `twMerge("lma-p-4", "lma-p-8")` would NOT merge correctly — it would return `"lma-p-4 lma-p-8"` instead of `"lma-p-8"`.

### v2 → v3 Migration Note

If this project later upgrades to tailwind-merge v3 (which pairs with Tailwind v4), the prefix format changes from `'lma-'` (with dash) to `'lma'` (without dash). This is a known breaking change.

---

## 5. Vitest/Testing Impact

### Current State
- Project uses **Vitest v3.2.4** with `@testing-library/react` v16 and `@testing-library/jest-dom` v6
- **No snapshot tests found** referencing className
- **No `.snap` files found** in `packages/web/`
- No `toMatchSnapshot` usage found

### Impact Assessment: **LOW RISK**

Since there are no snapshot tests with className strings and no className-based assertions, adding a Tailwind prefix will NOT break existing tests.

If tests are added later that reference classNames:
- **Avoid snapshot-testing className strings** — test behavior, accessibility, and `data-*` attributes instead
- If snapshots are needed, use `expect.addSnapshotSerializer()` to normalize prefixed classes
- `@testing-library/react` queries (`getByRole`, `getByText`) are unaffected by class name changes

---

## 6. Risk Assessment — Common Pitfalls

### HIGH RISK

| Pitfall | Description | Mitigation |
|---------|-------------|------------|
| **`@apply` in CSS** | 2 `@apply` directives in `index.css` must be manually updated to use prefixed classes | Find/replace `@apply border-border` → `@apply lma-border-border`, etc. |
| **Incomplete rename** | Missing a class in JSX means it loses styling silently | Use cnat (CSS-file-based matching) + Tailwind's `--help` to verify no unprefixed classes remain |
| **tailwind-merge not updated** | `twMerge` won't properly deduplicate prefixed classes | Must update `cn()` to use `extendTailwindMerge({ prefix: "lma-" })` |

### MEDIUM RISK

| Pitfall | Description | Mitigation |
|---------|-------------|------------|
| **Dynamic class construction** | Classes built via string concatenation (e.g., `text-${color}-500`) won't be caught by AST/regex tools | Audit for template-literal class construction; add to `safelist` or rewrite |
| **Third-party component classes** | shadcn/ui components ship with unprefixed classes in source | Re-run cnat after copying component source; shadcn components are in your codebase |
| **Conditional classes in objects** | `cva()` or class variance authority patterns | cnat supports `fn:cva` scope |

### LOW RISK

| Pitfall | Description | Mitigation |
|---------|-------------|------------|
| **cnat v0.0.7 maturity** | Low adoption, could have bugs | Run on clean git branch; diff review; test visually |
| **Non-JSX templates** | HTML files, MDX, etc. | cnat only handles ts/js/tsx/jsx — manual grep for other extensions |
| **tailwind-merge v2 → v3 later** | Breaking prefix format change | Document the v2→v3 migration note for future |

### `@apply` Specifically

The project has exactly 2 `@apply` directives:
```css
@apply border-border;
@apply bg-background text-foreground;
```

These become:
```css
@apply lma-border-border;
@apply lma-bg-background lma-text-foreground;
```

---

## Concrete Recommendation

**Ranked choice: cnat (primary) + manual @apply fix + twMerge config update**

### Execution Plan

1. **Generate reference CSS:**
   ```bash
   npx tailwindcss -i ./packages/web/src/index.css -o ./tw-reference.css --config ./packages/web/tailwind.config.ts
   ```

2. **Update tailwind.config.ts:** Set `prefix: "lma-"`

3. **Run cnat:**
   ```bash
   npx cnat prefix -i ./tw-reference.css --prefix 'lma-' -s 'att:className att:class fn:cva' ./packages/web/src
   ```

4. **Manually fix `@apply` directives** in `index.css` (2 occurrences)

5. **Update `cn()` utility** to use `extendTailwindMerge({ prefix: "lma-" })`

6. **Regenerate reference CSS** (now with prefix) and verify no unprefixed classes remain:
   ```bash
   npx tailwindcss -i ./packages/web/src/index.css -o ./tw-reference-prefixed.css
   # Then diff against expected output
   ```

7. **Grep for missed classes:** Search for common unprefixed patterns in non-JSX files

8. **Visual QA:** Full browser regression test

### If cnat Doesn't Work (Fallback)

Use **tailwind-prefix-codemod** (jscodeshift, archived but functional) with dry-run, or write a custom ast-grep rule set. Both require more manual effort.

---

## Sources

- [Tailwind CSS v3 Prefix Documentation](https://v3.tailwindcss.com/docs/configuration#prefix)
- [tailwind-prefix-codemod (jscodeshift)](https://github.com/Mocksi/tailwind-prefix-codemod)
- [cnat — Class Name Alteration Tool](https://github.com/Gnarus-G/cnat)
- [tw-prefixer — Online Tool](https://github.com/aryomuzakki/tw-prefixer)
- [Tailwind CSS v3→v4 Prefix Migration PR #14557](https://github.com/tailwindlabs/tailwindcss/pull/14557)
- [ast-grep for Tailwind class changes](https://www.darricheng.com/posts/change-tailwind-classes-with-ast-grep/)
- [tailwind-merge v2 Configuration Docs](https://github.com/dcastil/tailwind-merge/blob/v2.3.0/docs/configuration.md)
- [tailwind-merge Dynamic Prefix Issue #412](https://github.com/dcastil/tailwind-merge/issues/412)
- [tailwind-merge Prefix Issue #527](https://github.com/dcastil/tailwind-merge/issues/527)
- [Tailwind v3→v4 Prefix Discussion #18176](https://github.com/tailwindlabs/tailwindcss/discussions/18176)
- [Tailwind v3→v4 Prefix Discussion #15807](https://github.com/tailwindlabs/tailwindcss/discussions/15807)
- [Vitest Snapshot Serialization](https://github.com/vitest-dev/vitest/blob/main/docs/guide/snapshot.md)

---

## Unresolved Questions

1. **cnat v0.0.7 stability**: Has anyone used it in production? Only 1 GitHub star. Should we test on a small subset first?
2. **Dynamic class construction**: Does this project build any classes via template literals (e.g., `text-${color}-500`)? Need an audit.
3. **shadcn/ui components**: Are all shadcn components in the codebase (copied source) or imported from a package? If imported, they ship unprefixed and need different handling.
4. **MDX/HTML files**: Does the project have any non-TSX template files with Tailwind classes that cnat would miss?