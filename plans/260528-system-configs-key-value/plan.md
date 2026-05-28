---
title: "SystemConfigs Key-Value Table"
description: "Add SystemConfigs key-value table for general settings (max_annual_leave, min_request_days, max_carry_over, leave_cycle) and per-role default days. Wire ConfigPage General tab to real backend. Enhance LeaveBalance lazy seed with role-based NPN defaults."
status: pending
priority: P2
branch: "feat/configurable-approval-levels"
tags: [system-configs, key-value, config, seed, leave-balance]
blockedBy: []
blocks: []
created: "2026-05-28T02:40:50.440Z"
createdBy: "ck:plan"
source: skill
brainstorm: plans/260528-system-configs-key-value/brainstorm-report.md
---

# SystemConfigs Key-Value Table

## Overview

Add persistent system-level configuration storage. Currently general settings (max annual leave, min request days, carry-over, leave cycle) and per-role default days have no backend persistence — `ConfigPage.tsx:151` has a TODO stub. The new `SystemConfigs` table stores these as key-value rows, with GET/PUT endpoints for QTHT-only management.

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [Entity + Migration](./phase-01-entity-migration.md) | Pending | 1h |
| 2 | [API Endpoints](./phase-02-api-endpoints.md) | Pending | 1.5h |
| 3 | [Frontend ConfigPage](./phase-03-frontend-configpage.md) | Pending | 1.5h |
| 4 | [LeaveBalance Seed Enhancement](./phase-04-leavebalance-seed-enhancement.md) | Pending | 1h |

## Dependencies

- **Parallel with** existing LeaveConfigs (N-level approval) — no changes to that system
- **Builds on** T-08 lazy-seed pattern (phase 4 enhances existing seed logic)
- **No blocking plans** detected

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Table approach | Key-value | Flexible, KISS, matches user mental model |
| approval_flow config | Not needed | LeaveConfigs N-level covers this |
| NPN balance seed | Lazy seed per-role | Startup uses LeaveType.DefaultDays; per-request uses SystemConfigs |
| Access control | QTHT-only | Matches current ConfigPage pattern |

## Config Keys (8 seed rows)

| ConfigKey | DefaultValue | Description |
|-----------|-------------|-------------|
| `max_annual_leave` | `12` | So ngay phep nam toi da |
| `min_request_days` | `1` | So ngay toi thieu khi tao don |
| `max_carry_over` | `5` | So ngay phep chuyen sang nam sau |
| `leave_cycle` | `yearly` | Chu ky tinh phep |
| `default_days_CB.PCM` | `14` | Mac dinh CB.PCM |
| `default_days_LD.PCM` | `14` | Mac dinh LD.PCM |
| `default_days_GD.PGD` | `16` | Mac dinh GD.PGD |
| `default_days_QTHT` | `12` | Mac dinh QTHT |

## Scope

**In:** SystemConfigs table, endpoints, ConfigPage General tab, role-based NPN lazy seed
**Out:** Validation enforcement (max/min days), carry-over calc, leave cycle logic, LeaveConfigs changes