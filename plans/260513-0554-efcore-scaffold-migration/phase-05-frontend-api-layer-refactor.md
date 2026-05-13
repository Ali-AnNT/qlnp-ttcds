---
phase: 5
title: "Frontend API Layer Refactor"
status: completed
priority: P1
effort: "3h"
dependencies: ["4"]
---

# Phase 5: Frontend API Layer Refactor

## Overview

Fetch-based API layer thay Supabase client. JWT intercept, type-safe generics, 6 API modules.

## Related Code Files

| Action | File |
|--------|------|
| Create | `packages/web/src/api/client.ts` |
| Create | `packages/web/src/api/auth.api.ts` |
| Create | `packages/web/src/api/departments.api.ts` |
| Create | `packages/web/src/api/leave-types.api.ts` |
| Create | `packages/web/src/api/leave-requests.api.ts` |
| Create | `packages/web/src/api/leave-balances.api.ts` |
| Create | `packages/web/src/api/config.api.ts` |

## Implementation Steps

1. `api/client.ts` — fetch wrapper: auto JWT header, error normalization, `{ data, error }` response
2. Mỗi API module — module pattern với full CRUD methods
3. `.env`: `VITE_API_URL=http://localhost:5000/api`
4. `bun run build` verify

## Success Criteria

- [ ] client.ts có JWT intercept + error handling
- [ ] 6 API modules đủ methods cho từng feature
- [ ] Types khớp backend DTOs
- [ ] `bun run build` không lỗi
