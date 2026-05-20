# Plan Review: EFCore Scaffold Migration (260513-0554)

**Date**: 2026-05-13 05:54
**Severity**: Medium (process)
**Component**: Migration Planning
**Status**: Resolved

## What Happened

Completed 10-phase plan for the Supabase-to-.NET-9 migration. This plan superseded the earlier 260513-0221 plan which was too vague. Key decisions settled: scaffold USER_MASTER and DM_DONVI from the production DB (reverse-engineered), Code First for 5 new QLNP tables, bigint PK throughout, API Gateway SSO headers instead of embedded JWT. All 10 phases delivered: project scaffold, system entities, QLNP entities + migration, middleware, frontend refactor, auth/store, embed mode.

## The Brutal Truth

The 0221 plan failed because it assumed we knew the DB schema well enough to Code First everything. That was wrong -- we wasted time guessing column types for USER_MASTER. Scaffolding from the live DB was the obvious answer, but it took a failed plan to admit it. The 0554 plan was essentially "do what 0221 said but scaffold first." Should have started here.

## Lesson

Always scaffold legacy tables before planning migration scope. The 30 minutes spent reverse-engineering the schema saves hours of speculation. The 10-phase structure worked well -- each phase had a concrete artifact (migration file, middleware class, page component). If a plan phase cannot produce a single deliverable, it is not specific enough.

## Next Steps

- Archive the 0221 plan directory
- Keep the 0554 plan as the migration reference; it contains the actual commands and schema notes
