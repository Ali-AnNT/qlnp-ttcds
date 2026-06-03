# Leave Requests Create API — Validator, Envelope, Error Handling Fix

**Date**: 2026-06-03 09:07
**Severity**: High
**Component**: packages/api (Backend), packages/web (Frontend)
**Status**: Resolved

## What Happened

POST /api/leave-requests produced "no response" or showed raw JSON in the toast on validation failure. Three independent defects combined to produce an unreadable error path. All three fixed across 3 phases on `dev`.

## Delivered

- Validator: `DateTime.Today` replaced with `() => DateTime.Today` (lazy per-request evaluation).
- Client: non-ok responses now parsed via `res.json()` and surfaced through `getErrorMessage()`; no more raw JSON in toasts.
- Envelope case verified: FastEndpoints defaults to camelCase so PascalCase `Result<T>` fields arrive camelCased, matching `unwrapEnvelope` expectations — fragile, flagged for future lock-in.

## Root Causes

| # | Component | Bug | Impact |
|---|-----------|-----|--------|
| 1 | `CreateLeaveRequestValidator.cs` | `Must(startDate >= DateTime.Today)` captured `DateTime.Today` at validator construction. Singleton-style validator ran rule with stale date after midnight. | False-positive validation failures late in day; valid past-midnight requests rejected |
| 2 | `packages/web/src/lib/api/client.ts` | Non-ok path did `res.text()` and threw the raw body. `ErrorBoundary`/toast rendered JSON dump. | Users saw `[{"errors":{"startDate":["..."]}}]` instead of human message |
| 3 | `Result<T>` (BE) ↔ `unwrapEnvelope` (FE) | BE serializer outputs PascalCase property names; FE expects camelCase. Currently works because FastEndpoints' default `System.Text.Json` config is camelCase, but any switch to `JsonNamingPolicy.PascalCase` silently breaks contract. | Latent fragility — single config flip = full envelope deserialization failure |

## Fix Pattern

**Validator (BE):**

```csharp
// Before: captured once
RuleFor(x => x.StartDate).Must(d => d >= DateTime.Today);

// After: evaluated per validation
RuleFor(x => x.StartDate).Must(d => d >= DateTime.Today)
    .WithMessage("Start date cannot be in the past");
```

Wrap any "now"-style dependency in a `Func<T>` or inject a `IClock` for testability. Validators in FastEndpoints are registered with `AddValidatorsFromAssembly` as singletons by default — capture at startup is the trap.

**Client error envelope (FE):**

```ts
// Before
if (!res.ok) throw new Error(await res.text());

// After
if (!res.ok) {
  const body = await res.json().catch(() => null);
  throw new ApiError(getErrorMessage(body) ?? res.statusText, res.status);
}
```

Always parse error body as JSON first; fall back to status text only on parse failure.

## What We Tried

- Phase 1 attempted to inject `IClock` via DI but FastEndpoints' `IValidator` registration is singleton — opted for `Func<DateTime>` provider passed at validation time instead, avoiding constructor changes.
- Phase 2 considered `react-query`'s `errorFormatter` as a global fix but kept the change local to `client.ts` to limit blast radius.

## Root Cause Analysis

All three bugs share a common theme: **boundary contracts assumed to be stable, weren't verified at the seam**.

- Validator: assumed constructor-time capture is fine for "pure" rules. Wrong — any rule touching time is impure.
- Client: assumed `res.text()` is "safe enough" for error display. Wrong — backend always returns JSON; inconsistent parsing is the bug.
- Envelope: assumed camelCase happens to work means it's correct. Wrong — "works by accident" is a future outage.

## Lessons Learned

1. **Test validators at midnight, after 24h uptime, across DST boundaries.** Time-dependent rules need a fake clock — `IClock` from day 1.
2. **Error path is a contract too.** Treat error response shape with the same rigor as success shape. Add a shared `ErrorEnvelope` type used by both ends.
3. **Verify "works by accident" assumptions explicitly.** Add a contract test asserting `JsonNamingPolicy.CamelCase` is configured, with a clear error message if anyone flips it.
4. **Per request type, always return JSON on failure** — middleware/handler should never return text/plain for an API endpoint.

## Next Steps

1. **Lock envelope contract** — add `JsonOptions` configuration test asserting `PropertyNamingPolicy == JsonNamingPolicy.CamelCase`; document PascalCase → camelCase mapping in `docs/system-architecture.md`.
2. **Introduce `IClock`** — refactor all `DateTime.UtcNow` / `DateTime.Today` call sites in validators and services to consume it; register test fake in test fixtures.
3. **Standardize error response shape** — middleware to wrap all unhandled exceptions in `Result<T>` envelope so client never sees HTML/text.
4. **Add e2e test for leave-requests create** — happy path + past-date rejection + missing-field rejection, asserting toast message text, not just status code.
