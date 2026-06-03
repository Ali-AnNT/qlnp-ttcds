---
phase: 2
title: "Fix error response handling in client.ts"
status: pending
priority: P1
effort: "1h"
dependencies: []
---

# Phase 2: Fix error response handling in client.ts

## Overview

When the API returns a non-ok response (400, 409, etc.), `client.ts` calls `res.text()` which returns the raw JSON string. This string becomes the `error` field, passed through `unwrap()` as `new Error(rawJsonString)`, and shown in the toast — appearing as unreadable JSON or "no response".

Fix: attempt JSON parse on non-ok responses to extract structured error messages; fall back to plain text if parse fails.

## Key Insights

- Current flow: `res.text()` → raw JSON string like `{"success":false,"message":"Validation failed","errors":["..."]}` → shown in toast
- Backend uses `Result<T>` envelope with `Success`, `Data`, `Message`, `Errors` properties
- FastEndpoints serializes with camelCase by default (verified: no `PropertyNamingPolicy` override in Program.cs), so frontend `unwrapEnvelope` check for `"success" in raw` works correctly for 2xx responses
- For 4xx/5xx responses, FastEndpoints uses `Result<object>.Fail(...)` (same envelope structure)
- Two locations use `res.text()`: main error path (line 56) and 401 retry error path (line 46)

## Requirements

- Functional: Error messages shown to users must be human-readable Vietnamese strings, not raw JSON
- Non-functional: Must handle both envelope (`Result<T>`) and non-envelope error responses gracefully

## Architecture

```
Non-ok response → try JSON parse
  ├─ Has envelope ({success, message, errors}) → extract message + errors → readable string
  └─ Plain JSON or text → use as-is or fallback to HTTP status text
```

## Related Code Files

- Modify: `packages/web/src/shared/api/client.ts` (lines 44-57)

## Implementation Steps

1. Add a helper function `extractErrorMessage` above `request<T>` in `client.ts`:
   ```typescript
   function extractErrorMessage(body: string): string {
     try {
       const parsed = JSON.parse(body);
       if (typeof parsed === "object" && parsed !== null) {
         // Backend Result<T> envelope (camelCase from FastEndpoints)
         if ("success" in parsed) {
           const env = parsed as { success: boolean; message?: string; errors?: string[] };
           const msg = env.message || "Request failed";
           const errs = env.errors?.length ? env.errors.join("; ") : "";
           return errs ? `${msg}: ${errs}` : msg;
         }
         // Fallback: try common error fields
         if ("message" in parsed) return String(parsed.message);
         if ("error" in parsed) return String(parsed.error);
       }
       return body;
     } catch {
       return body || "Request failed";
     }
   }
   ```

2. Replace `res.text()` error handling (line 55-57):
   ```typescript
   // Before:
   if (!res.ok) {
     const errBody = await res.text();
     return { data: null, error: errBody || `HTTP ${res.status}` };
   }
   
   // After:
   if (!res.ok) {
     const errBody = await res.text();
     return { data: null, error: extractErrorMessage(errBody) || `HTTP ${res.status}` };
   }
   ```

3. Apply the same fix to the 401 retry error path (line 44-46):
   ```typescript
   // Before:
   if (!retryRes.ok) {
     const errBody = await retryRes.text();
     return { data: null, error: errBody || `HTTP ${retryRes.status}` };
   }
   
   // After:
   if (!retryRes.ok) {
     const errBody = await retryRes.text();
     return { data: null, error: extractErrorMessage(errBody) || `HTTP ${retryRes.status}` };
   }
   ```

4. The `unwrapEnvelope` function (lines 71-82) already handles the success case correctly — no changes needed there.

5. Verify the `unwrap` helper in `use-leave-requests.ts` still works: it throws `new Error(res.error)` which will now contain a human-readable message.

## Success Criteria

- [ ] `extractErrorMessage` helper added to `client.ts`
- [ ] Both non-ok error paths (main + 401 retry) use `extractErrorMessage`
- [ ] Validation errors from FastEndpoints show readable Vietnamese messages in toast (e.g., "Validation failed: Ngày bắt đầu không được là ngày quá khứ")
- [ ] Non-JSON error responses still handled gracefully (fallback to HTTP status)
- [ ] No TypeScript errors introduced