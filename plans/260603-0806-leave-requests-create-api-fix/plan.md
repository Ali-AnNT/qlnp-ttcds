---
title: 'Fix leave-requests create API — validator, envelope, error handling'
description: >-
  Fix 3 bugs identified in scout report: (1) DateTime.Today captured at startup
  in validators, (2) raw JSON error shown to users, (3) envelope case mismatch
  risk. Root cause: POST /api/leave-requests returns unreadable error to
  frontend.
status: in-progress
priority: P1
branch: dev
tags:
  - bug-fix
  - backend
  - frontend
blockedBy: []
blocks: []
created: '2026-06-03T08:07:16.060Z'
createdBy: 'ck:plan'
source: skill
---

# Fix leave-requests create API — validator, envelope, error handling

## Overview

POST /api/leave-requests shows "no response" or raw JSON in toast on validation failure. Root causes:
1. **Validator captures `DateTime.Today` at startup** — evaluated once, stale after day change
2. **Frontend `client.ts` returns raw JSON string as error** — `res.text()` on non-ok response
3. **Envelope case mismatch risk** — backend `Result<T>` PascalCase vs frontend `unwrapEnvelope` expecting camelCase (verified: FastEndpoints defaults to camelCase, so currently works, but fragile)

Scout report: [`scout-260603-0801-leave-requests-create-api-report.md`](../reports/scout-260603-0801-leave-requests-create-api-report.md)

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Fix DateTime.Today in validators](./phase-01-fix-datetime-today-in-validators.md) | In Progress |
| 2 | [Fix error response handling in client.ts](./phase-02-fix-error-response-handling-in-client-ts.md) | Pending |
| 3 | [Verify and test](./phase-03-verify-and-test.md) | Pending |

## Dependencies

- Phase 1 and 2 are independent — can run in parallel
- Phase 3 depends on both Phase 1 and Phase 2
