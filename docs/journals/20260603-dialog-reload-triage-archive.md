# Dialog Reload Triage — 5-Layer Defense Fix

**Date**: 2026-06-03
**Severity**: High
**Component**: React UI (dialogs, sidebar, route boundary, null display)
**Status**: Resolved

## What Happened

Dialog reloads page on interaction. 2 root causes already fixed: null crash in `DeptDetailDialog` + `<button>` defaulting to `type="submit"`. Brainstorm surfaced 5 more categories of related bugs. Applied 5-layer defense in 5 phases, all completed on `feat/update-deploy-cjs-ttcds-preset`.

## 5-Layer Defense Strategy

Each bug class is now blocked at multiple layers — a single regression cannot cause a full-page reload again:

| Layer | Defense |
|-------|---------|
| 1. Component API | `Button` primitive forces `type="button"` by default |
| 2. Data nullability | Null guards before render; fallbacks for `null`/`undefined` |
| 3. Sidebar wrappers | Default `type="button"` on wrapper Buttons to fix all descendants |
| 4. Error boundary | Route-level `ErrorBoundary` catches any uncaught render crash |
| 5. Display layer | `String(value ?? '—')` guards prevent `"null"`/`"undefined"` text |

## Issues Found + Fixed

| Category | Count | Severity | Phase |
|----------|-------|----------|-------|
| Null crash (same pattern as DeptDetailDialog) | 1 | CRITICAL | 1 |
| Native `<button>` missing `type` | 10 | High | 2 |
| Sidebar components missing default type | 3 | High | 3 |
| Missing route-level error boundary | 1 | Medium | 4 |
| Display of `"null"` string | 4 | Low | 5 |

Phase 1–3 independent (parallelizable). Phase 4 needs ErrorBoundary stable. Phase 5 independent but ran last to verify display layer last.

## Lessons Learned

- **Single root cause is a lie.** When one dialog crash surfaces, the same pattern is usually hiding in 3+ sibling components. Brainstorm a wider blast radius before patching the first one.
- **Defaulting to `type="submit"` is a class of bug, not a one-off.** The fix has to live at the primitive level (Button) AND wrapper level (sidebar) — not just at each call site.
- **Display layer is part of defense.** Showing the literal string `"null"` to users is a symptom that the data layer guard failed. `String(v ?? '—')` is cheaper than tracking every data source.
- **Route error boundaries are not optional.** A render crash in a deep component should never trigger a full reload. Add it once, in the layout, and forget it.
- **Phase ordering matters when one phase's output is another's input.** Phases 1–3 are pure independent patches; Phase 4 needs the boundary component tested first; Phase 5 should run last because it verifies that all upstream guards hold.

## Next Steps

- Add a lint rule (or codemod) that fails on native `<button>` without explicit `type` in `.tsx` files — prevent regression of Phase 2 fix
- Extend `ErrorBoundary` with telemetry hook so future crashes report to monitoring instead of silently swallowing
- Audit other feature areas (Forms, Tables) for the same null-display pattern — likely 10+ more instances of `String(value ?? '—')` needed
