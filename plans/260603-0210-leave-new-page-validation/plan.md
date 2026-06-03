---
title: "Leave New Page Validation Refactor"
description: "Refactor validation logic in LeaveNewPage to use React Hook Form and Zod resolving error messages under each field and dynamic overlap checking."
status: complete
priority: P2
branch: "feat/update-deploy-cjs-ttcds-preset"
tags: [frontend, refactor, validation]
blockedBy: []
blocks: []
created: "2026-06-03T02:07:58.143Z"
createdBy: "ck:plan"
source: skill
---

# Leave New Page Validation Refactor

## Overview
This plan implements a validation refactor on the `LeaveNewPage` component (`packages/web/src/features/leave-requests/components/leave-new-page.tsx`).
The manual `useState`-based validation and global `toast.error` messages will be replaced with `react-hook-form` and `zodResolver`.
Errors will be displayed directly underneath the corresponding fields.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Research](./phase-01-research.md) | Complete |
| 2 | [Implement](./phase-02-implement.md) | Complete |
| 3 | [Test](./phase-03-test.md) | Complete |

## Dependencies
None.
