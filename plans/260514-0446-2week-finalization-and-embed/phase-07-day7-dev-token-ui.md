---
phase: 7
title: "Day 7 — Dev Token Input UI (Frontend)"
status: pending
priority: P1
effort: "4h"
dependencies: [6]
---

# Phase 07: Day 7 — Dev Token Input UI

## Overview

Frontend UI for developers to input/paste JWT token for local development. This replaces the need for a running API Gateway during development.

## Requirements

- Token input form on dev mode (hidden in production)
- Store token in localStorage
- api/client.ts reads token from localStorage for Authorization header
- Show current user info when token is valid
- Logout/clear token action

## Related Code Files

- **Modify:** `packages/web/src/api/client.ts` — Authorization header from localStorage
- **Modify:** `packages/web/src/store/useStore.ts` — token state management
- **Create:** `packages/web/src/components/DevTokenInput.tsx` — token input component
- **Modify:** `packages/web/src/App.tsx` — conditionally show DevTokenInput in dev mode

## Success Criteria

- [ ] Dev mode: token input visible, can paste JWT
- [ ] Token stored in localStorage, sent with API requests
- [ ] Valid token → user info displayed, API calls work
- [ ] Invalid/expired token → clear error message
- [ ] Clear token → logout, API calls return 401
- [ ] Production: token input hidden

## Next Steps

→ Phase 08: [Day 8 — Embed Host Sample + Docs](phase-08-day8-embed-host-sample.md)