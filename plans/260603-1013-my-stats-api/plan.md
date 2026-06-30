---
title: "My Stats API — Server-side dashboard metrics"
description: >
  Replace client-side dashboard aggregation (4 metrics from 3+ API calls) with single
  GET /api/my-stats call. Backend already implemented; FE needs API client, hook, and dashboard wiring.
status: pending
priority: P2
branch: "dev"
tags: [frontend, dashboard, api-integration]
blockedBy: []
blocks: []
created: "2026-06-03T10:14:36.661Z"
createdBy: "ck:plan"
source: skill
brainstorm: "plans/reports/brainstorm-260603-my-stats-api-report.md"
---

# My Stats API — Server-side dashboard metrics

## Overview

Dashboard displays 4 metrics (remaining days, pending count, approved count, used days) currently computed client-side from 3+ API calls. Backend endpoint `GET /api/my-stats` already exists and compiles — this plan wires it into the frontend.

**Backend**: DONE ✅ (MyStatsEndpoint, MyStatsResponse, MyStatsGroup)
**Frontend**: TODO — API client, React Query hook, dashboard refactor

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Implement FE API + Hook](./phase-01-implement-fe-api-hook.md) | Pending |
| 2 | [Integrate Dashboard](./phase-02-integrate-dashboard.md) | Pending |
| 3 | [Test & Verify](./phase-03-test-verify.md) | Pending |

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API path | `GET /api/my-stats` | Matches backend MyStatsGroup prefix |
| Hook location | `dashboard/hooks/use-my-stats.ts` | Co-located with dashboard, single concern |
| Response shape | `{ remainingDays, pendingCount, approvedCount, usedDays }` | Matches MyStatsResponse backend DTO |
| Replace useDashboardStats? | Partial — keep balance/type/config data for activity feed; replace metric computation | Activity feed still needs leaveTypes + recentRequests |

## Dependencies

No cross-plan dependencies. Existing plans (React Router migration, Approvable Requests, Auto-Approve) don't overlap.