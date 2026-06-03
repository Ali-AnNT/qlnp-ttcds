# Scout Report: POST /api/leave-requests "no response" issue

## Relevant Files

| File | Role |
|------|------|
| `packages/api/Features/LeaveRequests/Create/CreateLeaveRequestEndpoint.cs` | Endpoint handler |
| `packages/api/Features/LeaveRequests/Create/CreateLeaveRequestRequest.cs` | Request DTO |
| `packages/api/Features/LeaveRequests/Create/CreateLeaveRequestValidator.cs` | FluentValidation rules |
| `packages/api/Features/LeaveRequests/Create/CreateLeaveRequestMapper.cs` | Entity mapper |
| `packages/api/Shared/Contracts/Result.cs` | Result envelope (`Success`, `Data`, `Message`, `Errors`) |
| `packages/api/Program.cs:85-89` | Custom validation error builder using `Result<object>.Fail(...)` |
| `packages/web/src/shared/api/client.ts:55-57` | Non-ok response handling (`res.text()`) |
| `packages/web/src/shared/api/client.ts:71-82` | `unwrapEnvelope` — checks `"success" in raw` (lowercase) |
| `packages/web/src/features/leave-requests/hooks/use-leave-requests.ts:35-48` | `useSubmitLeaveRequest` mutation |

## Root Cause Analysis

### Issue 1 — Validator uses `DateTime.Today` captured at startup (most likely cause)

**File:** `CreateLeaveRequestValidator.cs:9`
```csharp
RuleFor(x => x.StartDate)
    .GreaterThanOrEqualTo(DateTime.Today)  // ← evaluated ONCE when Validator is constructed
```

`DateTime.Today` is evaluated when FluentValidation constructs the `Validator` singleton at app startup. If the API was started on June 2, the check becomes `StartDate >= 2026-06-02`. On June 3, `2026-06-03 >= 2026-06-02` still passes. **But** if the API was started days ago, or if there's a timezone difference (server in UTC vs Vietnam UTC+7), this can silently pass or fail unexpectedly.

For the curl test with `startDate: "2026-06-03"`: this passes today only if the server was started on June 3 or earlier. If the server's `DateTime.Today` is > June 3, validation fails with 400.

**Fix:** Use a lambda so it's evaluated per-request:
```csharp
.GreaterThanOrEqualTo(_ => DateTime.Today)
```

### Issue 2 — Case mismatch between backend `Result<T>` and frontend `unwrapEnvelope`

**Backend** (`Result.cs`): Properties are PascalCase (`Success`, `Data`, `Message`, `Errors`).

**FastEndpoints** default: Serializes with `CamelCaseNamingPolicy` → `success`, `data`, `message`, `errors`.

**Frontend** (`client.ts:72`): Checks `"success" in raw` (lowercase).

If FastEndpoints is using camelCase (default), this works. But if any config overrides to PascalCase, `unwrapEnvelope` would miss the `success` key and treat the envelope as raw data → `res.data` = `{Success:false, ...}` → `unwrap()` returns this as "data" → `onSuccess` fires with garbage data.

### Issue 3 — Non-ok response handling returns raw text, not parsed error

**File:** `client.ts:55-57`
```typescript
if (!res.ok) {
    const errBody = await res.text();
    return { data: null, error: errBody || `HTTP ${res.status}` };
}
```

When validation fails (400), `res.text()` returns the raw JSON string (e.g., `{"success":false,"message":"Validation failed","errors":["..."]}`). This raw string becomes the `error`. The toast then shows the entire JSON string, which the user might interpret as "no response" because it's not human-readable.

## Frontend flow trace

1. `leave-new-page.tsx:158` → `submitLeaveRequest(data)` 
2. `use-leave-requests.ts:40` → `leaveRequestsApi.create(data)` → `api.post("/leave-requests", data)`
3. `client.ts:87` → `request<T>(path, { method: "POST", body: JSON.stringify(body) })`
4. `client.ts:55` → if 400: returns `{ data: null, error: rawJsonString }`
5. `use-leave-requests.ts:42` → `unwrap(res)` → throws `Error(rawJsonString)`
6. `leave-new-page.tsx:170` → `toast.error(rawJsonString)` — shows raw JSON, looks like "no response"

## Unresolved Questions

1. **What HTTP status code does the curl actually receive?** (201, 400, 401, 500?) — need to verify with actual server logs or `curl -v`
2. **What is the server's `DateTime.Today` right now?** — timezone mismatch could cause validation failure
3. **Is Fast la endpoints actually using camelCase?** — if not, the `unwrapEnvelope` case check is broken for ALL endpoints
4. **Is the API server accessible and running?** — the user tested against `apigw.vietinfo.tech` which is a gateway; the actual API might be down
