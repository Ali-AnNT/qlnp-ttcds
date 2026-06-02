---
title: setup-playwright-e2e-testing
description: Setup Playwright E2E testing for QLNP-TTCDS React app
status: pending
priority: P2
branch: "refactor/adjust-api-arch-follow-vsa-and-fastendpoint"
tags: [testing, e2e, playwright]
blockedBy: []
blocks: []
created: "2026-05-28T08:13:34.400Z"
createdBy: "ck:plan"
source: skill
---

# setup-playwright-e2e-testing

## Overview

Add Playwright E2E testing to QLNP-TTCDS for cross-browser smoke tests of critical user flows (login, leave requests, approval). Tests run against real API via `VITE_DEV_MODE=true`.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Setup Infrastructure](./phase-01-setup-infrastructure.md) | Pending |
| 2 | [Create Fixtures and Page Objects](./phase-02-create-fixtures-and-page-objects.md) | Pending |
| 3 | [Write Smoke Tests](./phase-03-write-smoke-tests.md) | Pending |

## Context Links

- Research: [plans/reports/research-playwright-e2e-testing-260528.md](../reports/research-playwright-e2e-testing-260528.md)

## Dependencies

- Vite dev server running on port 5100
- API server running on port 5000
- `VITE_DEV_MODE=true` for dev login endpoint

## Confirmed Answers

| Question | Answer |
|----------|--------|
| E2E target | Real API (`VITE_DEV_MODE=true`) |
| CI env | Confirmed |
| DB cleanup | Not needed |
| Visual regression | TBD |