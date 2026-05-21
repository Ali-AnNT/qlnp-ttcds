# Debugger Report — 404 on GET /api/auth/me

## Findings

1. **Route IS registered.**
   - File: `packages/api/Features/Auth/Me/Endpoint.cs`
   - Config: `Get("/api/auth/me")`
   - FastEndpoints scans correctly; no missing route.

2. **Base path /api is correct.**
   - No `RoutePrefix` or double-prefix in `Program.cs`.
   - Actual URL = `http://localhost:8003/api/auth/me`.

3. **CORS is NOT the blocker.**
   - Request reaches the handler and returns a response (404 body empty, headers present).

4. **Root cause: business logic returns 404 for unauthenticated requests.**
   - Endpoint has `AllowAnonymous()`.
   - Without JWT token, `CurrentUserProvider.GetCurrentUser()` parses `UserId = 0`.
   - `Data.BuildResponseAsync(0, ct)` queries `UserMasterId == 0` → returns null.
   - `HandleAsync` sends `Send.NotFoundAsync()` when `response is null`.

## Evidence

- No token:
  ```
  curl -i http://localhost:8003/api/auth/me
  HTTP/1.1 404 Not Found
  ```
- With valid JWT (userId=1):
  ```
  curl -i http://localhost:8003/api/auth/me -H "Authorization: Bearer ..."
  HTTP/1.1 200 OK
  {"userId":1,"userName":"quantri",...}
  ```

## Recommendations

1. **Remove `AllowAnonymous()`** from `/api/auth/me` so missing/invalid tokens yield 401 instead of 404.
2. **OR** change the anonymous branch to return 401 explicitly when `GetCurrentUser()` yields default/anonymous claims.
3. If 404 persists *with* a valid token, the `UserMasterId` in the token does not exist in the `UserMaster` table — check data consistency.

## Unresolved Questions

- Was the original failing request sent with a JWT token? If yes, which `UserId` does it contain?
