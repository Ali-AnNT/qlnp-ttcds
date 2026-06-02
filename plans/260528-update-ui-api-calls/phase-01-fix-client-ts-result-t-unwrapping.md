---
phase: 1
title: Fix client.ts Result<T> unwrapping
status: completed
priority: P1
effort: 30min
dependencies: []
---

# Phase 1: Fix client.ts Result<T> unwrapping

## Overview

Backend wraps ALL responses in `Result<T>`: `{ success, data, message, errors }`. Current `client.ts` returns `res.json()` directly — UI receives the envelope instead of the data. Fix `request()` to unwrap automatically.

## Requirements
- When `success === true`, return `.data` as `ApiResponse.data`
- When `success === false`, return `.message` + `.errors` joined as `ApiResponse.error`
- No signature change — still returns `Promise<ApiResponse<T>>`
- Handle non-JSON responses (file downloads) gracefully

## Related Code Files
- Modify: `packages/web/src/api/client.ts`

## Implementation Steps

1. Add `ResultEnvelope` interface to `client.ts`:
   ```ts
   interface ResultEnvelope<T> {
     success: boolean;
     data: T | null;
     message?: string | null;
     errors?: string[] | null;
   }
   ```

2. In `request()`, after `res.json()`, check if response has `success` field:
   ```ts
   const raw = await res.json();
   // Unwrap Result<T> envelope from backend
   if (typeof raw.success === "boolean") {
     if (raw.success) {
       return { data: raw.data as T, error: null };
     }
     const msg = raw.message || "Request failed";
     const errs = raw.errors?.length ? raw.errors.join("; ") : "";
     return { data: null, error: errs ? `${msg}: ${errs}` : msg };
   }
   // Fallback for non-Result<T> responses
   return { data: raw as T, error: null };
   ```

3. Keep existing error handling for `!res.ok` (non-2xx status codes) — backend returns `Result<T>` even for validation errors, but guard against non-JSON responses.

## Success Criteria
- [ ] `request()` unwraps `Result<T>` when `success` field present
- [ ] Failed requests return error message from `Result<T>.message` + `.errors`
- [ ] Successful requests return `.data` directly
- [ ] Existing `ApiResponse<T>` type unchanged
