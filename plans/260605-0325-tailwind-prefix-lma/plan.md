---
title: "Add Tailwind CSS prefix and remove postcss-prefix-selector"
description: "Add Tailwind prefix to all utility classes, remove postcss-prefix-selector. Colon prefix (lma:) NOT supported in v3 — must use dash (lma-) or upgrade to v4."
status: completed
priority: P1
branch: "dev"
tags: [tailwind, css, prefix, migration]
blockedBy: []
blocks: []
created: "2026-06-05T03:25:51.005Z"
createdBy: "ck:plan"
source: skill
---

# Add Tailwind CSS prefix and remove postcss-prefix-selector

## ⚠️ Critical Decision — RESOLVED

**Red team found FATAL flaw:** Colon prefix `lma:` is **broken in Tailwind v3** ([Issue #5016](https://github.com/tailwindlabs/tailwindcss/issues/5016)). Tailwind maintainers closed as won't-fix — the `:` in prefix collides with variant separator `:` causing ambiguous parsing.

**Validation decision (2026-06-05):**
- ✅ Prefix: `lma-` (dash) on Tailwind v3
- ✅ Migration: Manual only (no cnat tool)
- ✅ Maintenance: Add eslint-plugin-tailwindcss with prefix enforcement
- ✅ Isolation: Accept reduced isolation — remove postcss-prefix-selector, use lma- prefix only
- ⚠️ Trade-off: Global `:root` custom properties and preflight resets without `.qlnp-app` scoping. Prefix namespacing is sufficient for embedding use case.

**Original options for reference:**

| Option | Prefix | Tailwind Version | Scope | Risk |
|--------|--------|-----------------|-------|------|
| A | `lma-` (dash) | v3 (current) | 85 files | Medium — works but verbose |
| B | `lma:` (colon) | v4 (upgrade) | v3→v4 migration + 85 files | High — v4 breaking changes |
| C | Keep postcss-prefix-selector | N/A | 0 files | None — already works |

## Overview

Add Tailwind CSS prefix to all utility classes across the web package. Remove `postcss-prefix-selector` plugin. Update `cn()`, `@apply`, and all 85 source files.

## Scope

- **Package:** `packages/web`
- **Files affected:** ~85 TSX/TS files + CSS configs
- **className occurrences:** 556 static + 125 dynamic (cn() calls) + 9 CVA definitions + Calendar/Sonner classNames props

## Red Team Findings Summary

| # | Severity | Issue | Mitigation |
|---|----------|-------|------------|
| 1 | **FATAL** | Colon prefix `lma:` broken in v3 | Use `lma-` dash or upgrade to v4 |
| 2 | CRITICAL | Zero isolation benefit over current setup | Accepted: proceed with lma- prefix only, reduced isolation |
| 3 | CRITICAL | `extendTailwindMerge({ override: ... })` destroys default merge rules | Use `extend`, not `override` |
| 4 | HIGH | 9 CVA variant definitions need separate handling | Audit all CVA variant strings |
| 5 | HIGH | Calendar/Sonner `classNames` object props bypass `cn()` | Manual prefix update |
| 6 | HIGH | `group-[...]`/`peer-[...]` selectors couple DOM to CSS | Verify group/peer variant matching |
| 7 | MEDIUM | `@apply` breaks with colon prefix | Use `lma-` dash prefix |
| 8 | MEDIUM | No rollback strategy | Create git branch before migration |
| 9 | MEDIUM | `cnat` tool unspecified and error-prone on complex selectors | Manual-only approach (validation decision) |
| 10 | MEDIUM | Future shadcn/ui additions produce unprefixed classes | eslint-plugin-tailwindcss prefix enforcement in CI |

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Research](./phase-01-research.md) | Completed |
| 2 | [Configure](./phase-02-configure.md) | Completed |
| 3 | [Update Source Files](./phase-03-update-source-files.md) | Completed |
| 4 | [Update CSS](./phase-04-update-css.md) | Pending |
| 5 | [Verify Build](./phase-05-verify-build.md) | Pending |

## Dependencies

- None (standalone migration)

## Validation Log

### Session 1 — 2026-06-05
**Trigger:** Plan validation interview
**Questions asked:** 5

#### Questions & Answers

1. **[Tradeoffs]** The red team found this migration provides ZERO isolation benefit — postcss-prefix-selector already scopes all CSS under `.qlnp-app`. Why is this migration needed?
   - Options: CSS isolation for embedding | Namespace convention only | Cancel migration | Planning Tailwind v4 upgrade
   - **Answer:** CSS isolation for embedding
   - **Rationale:** App will be embedded inside other apps where CSS conflicts matter

2. **[Architecture]** The plan recommends lma- (dash) prefix since lma: (colon) is broken in Tailwind v3. Which prefix format?
   - Options: lma- (dash) on v3 | lma: (colon) on v4 | Keep postcss-prefix-selector
   - **Answer:** lma- (dash) on v3
   - **Rationale:** Works with current Tailwind v3, no upgrade needed

3. **[Risks]** cnat (v0.0.7, 1 star) is the planned primary migration tool. What's your comfort level?
   - Options: Try cnat with manual fallback | Manual only | Custom ast-grep rules
   - **Answer:** Manual only
   - **Rationale:** More control, cnat is low maturity

4. **[Scope]** After migration, every new shadcn/ui component will produce unprefixed classes. Add lint rule?
   - Options: Yes, add lint rule | No lint rule | Post-add script only
   - **Answer:** Yes, add lint rule
   - **Rationale:** eslint-plugin-tailwindcss with custom rule to catch unprefixed classes in CI

5. **[Architecture - CRITICAL]** Current postcss-prefix-selector provides FULL CSS isolation (scoped :root, scoped preflight, scoped utilities). Removing it reduces isolation to class-name namespacing only. Proceed?
   - Options: Cancel migration | Keep postcss-prefix-selector + add lma- prefix | Proceed with lma- prefix only
   - **Answer:** Proceed with lma- prefix only — accept reduced isolation
   - **Rationale:** Class name namespacing sufficient for embedding use case; global :root and preflight accepted

#### Confirmed Decisions
- Migration purpose: CSS isolation for embedding (accepting reduced vs current setup)
- Prefix format: `lma-` (dash separator) on Tailwind v3
- Migration approach: Manual only (no cnat tool)
- Post-migration: Add eslint-plugin-tailwindcss lint rule for prefix enforcement
- Isolation trade-off: Accept lma- prefix only — no postcss-prefix-selector

#### Action Items
- [x] Phase 3: Remove cnat as primary approach, use manual-only migration
- [x] Phase 3: Update effort estimate (manual is slower than automated)
- [x] Phase 5: Add lint rule step (eslint-plugin-tailwindcss with prefix enforcement)
- [x] Phase 2: Add note about accepting global :root and preflight without postcss-prefix-selector

#### Impact on Phases
- Phase 2: No structural change — config updates remain same
- Phase 3: Remove cnat steps, replace with detailed manual per-file approach
- Phase 4: No change
- Phase 5: Add lint rule step, add note about global :root/preflight acceptance

### Verification Results
- **Tier:** Full (5 phases)
- **Claims checked:** 23
- **Verified:** 23 | **Failed:** 0 | **Unverified:** 0

#### Verified Claims
- tailwind.config.ts has `prefix: ""` → VERIFIED
- postcss.config.js has postcss-prefix-selector with `.qlnp-app` and custom transform → VERIFIED
- components.json has `"prefix": ""` → VERIFIED
- cn() uses bare `twMerge()` + `clsx()` → VERIFIED
- 2 @apply directives in index.css → VERIFIED
- 9 CVA definitions across ui components → VERIFIED
- .qlnp-app in main.tsx:7 and App.tsx:8 → VERIFIED
- Calendar has classNames prop → VERIFIED
- Sonner has classNames with group-[.toaster] patterns → VERIFIED
- 25 [&_...] arbitrary selectors → VERIFIED
- group-[...] selectors in sidebar, toast, sonner → VERIFIED
- data-[state=...] patterns in sidebar, sheet, dialog → VERIFIED
- postcss-prefix-selector in package.json → VERIFIED
- 85 files with className → VERIFIED matches plan claim
- CSS custom properties in :root block use HSL values (not Tailwind classes) → VERIFIED

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01-research.md, phase-02-configure.md, phase-03-update-source-files.md, phase-04-update-css.md, phase-05-verify-build.md
- Decision deltas checked: 4 (cnat→manual, isolation trade-off, lint rule, effort estimate)
- Reconciled stale references: 3 (Red Team #2 mitigation, #9 mitigation, #10 mitigation)
- Unresolved contradictions: 0