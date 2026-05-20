---
phase: 8
title: "Day 8 — Embed Host Sample + Docs"
status: pending
priority: P1
effort: "4h"
dependencies: [7]
---

# Phase 08: Day 8 — Embed Host Sample

## Overview

Create sample embed host page that demonstrates postMessage → /api/auth/me → dashboard flow. This is the integration pattern for external apps to embed QLNP.

## Requirements

- HTML sample page that embeds QLNP via iframe
- postMessage to send JWT token to iframe
- iframe receives token, calls /api/auth/me, shows dashboard
- CSP frame-ancestors configuration for host domain
- Documentation for embed integration

## Related Code Files

- **Create:** `packages/web/public/embed-host-sample.html` — standalone sample
- **Modify:** `packages/web/src/App.tsx` — postMessage listener for embed mode
- **Modify:** `packages/web/src/store/useStore.ts` — receive token via postMessage

## Success Criteria

- [ ] embed-host-sample.html loads QLNP in iframe
- [ ] postMessage sends token → iframe receives → /api/auth/me → dashboard
- [ ] CSP frame-ancestors allows configured host domain
- [ ] Integration docs written

## Next Steps

→ Phase 09: [Day 9 — Supabase Cleanup + Integration Testing](phase-09-day9-supabase-cleanup.md)