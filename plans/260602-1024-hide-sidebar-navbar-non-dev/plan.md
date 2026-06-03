---
title: Hide sidebar and navbar when devmode is false
description: >-
  Modify layout to conditionally render sidebar and navbar based on devmode
  configuration.
status: completed
priority: P2
branch: feat/hide-sidebar-navbar
tags:
  - layout
  - sso
  - embed
blockedBy: []
blocks: []
created: '2026-06-02T10:24:27.318Z'
createdBy: 'ck:plan'
source: skill
---

# Hide sidebar and navbar when devmode is false

## Overview
When the application is run in production/embed environment where `VITE_DEV_MODE !== "true"`, hide the `AppSidebar` and `AppHeader` (navbar), rendering only the page content via React Router `<Outlet />`.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Research](./phase-01-research.md) | Completed |
| 2 | [Implement](./phase-02-implement.md) | Completed |
| 3 | [Test](./phase-03-test.md) | Completed |

## Dependencies
None.

## Validation Log

### Session 1 — 2026-06-02
**Trigger:** Manual validation of the feat/hide-sidebar-navbar plan.
**Questions asked:** 2

#### Verification Results
- **Tier:** Standard
- **Claims checked:** 8
- **Verified:** 8 | **Failed:** 0 | **Unverified:** 0

#### Questions & Answers

1. **[Architecture]** In non-dev mode, should the main content wrapper have page padding (e.g., p-4 md:p-6), or should it be full-width with zero padding to allow the parent container to control layout spacing?
   - Options: (Recommended) Keep the standard padding (p-4 md:p-6) to prevent content from touching screen edges | Remove padding (p-0) so the embedding parent container has complete control over layout spacing | Make padding conditionally configurable via query parameters or props
   - **Answer:** Keep the standard padding (p-4 md:p-6) to prevent content from touching screen edges
   - **Rationale:** Keeps standard spacing for content layout without requiring extra padding from each page component.

2. **[Scope]** Since the sidebar and navbar are hidden when VITE_DEV_MODE is false, how should users navigate between different pages in production?
   - Options: (Recommended) Rely entirely on the hosting application's routing/navigation or embed URL changes | Provide a minimal toggle/button to temporarily reveal navigation if authorized | Auto-redirect users based on predefined query parameters
   - **Answer:** Other (Đã có sẳn nav và cấu hình)
   - **Rationale:** The navigation and setup are already configured/available on the hosting side.

#### Confirmed Decisions
- Layout Wrapper: Keep standard `p-4 md:p-6` padding.
- Navigation: Rely on existing navigation and configuration.

#### Action Items
- None (current implementation matches all confirmed decisions).

#### Impact on Phases
- None (already implemented and verified).

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01-research.md, phase-02-implement.md, phase-03-test.md
- Decision deltas checked: 2
- Reconciled stale references: 0
- Unresolved contradictions: 0

