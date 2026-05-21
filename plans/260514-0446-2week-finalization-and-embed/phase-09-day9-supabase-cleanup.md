---
phase: 9
title: "Day 9 — Supabase Cleanup + Integration Testing"
status: pending
priority: P1
effort: "1d"
dependencies: [8]
---

# Phase 09: Day 9 — Supabase Cleanup + Integration Testing

## Overview

Remove all Supabase dependencies and code. Run integration tests to verify the .NET API works end-to-end.

## Supabase Cleanup

- Remove `packages/web/supabase/` directory
- Remove `@supabase/supabase-js` from package.json
- Remove Supabase env vars from .env files
- Remove Supabase client imports from all frontend code
- Verify no remaining references to `supabase` in codebase

## Integration Testing

- Run API server + frontend dev server
- Test all 19 endpoints with real JWT tokens
- Test embed mode flow
- Test role-based access (CB.PCM, LD.PCM, GD.PGD, QTHT)
- Verify CSP headers in responses

## Success Criteria

- [ ] No Supabase imports/references in codebase
- [ ] `npm install` works without supabase dependency
- [ ] All 19 endpoints respond correctly with valid JWT
- [ ] Role-based access works as expected
- [ ] Embed mode works with sample host page

## Next Steps

→ Phase 10: [Day 10 — Unit Tests + Docs + Release](phase-10-day10-tests-docs-release.md)