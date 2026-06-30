---
phase: 4
title: "Tests"
status: pending
effort: "1h"
dependencies: [1, 2]
---

# Phase 4: Tests

## Overview

Cập nhật `leave-types.api.test.ts`: giữ case `list()` không param, thêm case `list({q, includeInactive})`. Backend: kiểm tra compile + query param parse (nếu có integration test pattern).

## Requirements

- Functional:
  - Test `list()` → `api.get("/leave-types")` (giữ).
  - Test `list({q:"an", includeInactive:true})` → `api.get("/leave-types?q=an&includeInactive=true")`.
  - Test `list({q:"x"})` → `?q=x`.
  - Test `list({includeInactive:true})` → `?includeInactive=true`.
- Non-functional: mock api như test hiện tại.

## Architecture

Test hiện tại mock `api.get`/`post`/`put`/`delete`. Pattern giữ, thêm assertions cho query string.

## Related Code Files

- Modify: `packages/web/src/test/leave-types.api.test.ts`

## Implementation Steps

1. Thêm case `it("list with q + includeInactive builds query string", ...)`:
   - `api.get` mock return `{data:[mockType], error:null}`.
   - `await leaveTypesApi.list({q:"an", includeInactive:true})`.
   - `expect(api.get).toHaveBeenCalledWith("/leave-types?q=an&includeInactive=true")`.
2. Thêm case `list({q:"x"})` → `/leave-types?q=x`.
3. Thêm case `list({includeInactive:true})` → `/leave-types?includeInactive=true`.
4. Giữ case `list()` hiện tại (không param → `/leave-types`).
5. Chạy `pnpm test` (frontend) + `dotnet build` (backend).

## Success Criteria

- [ ] Test cũ pass (backward-compat).
- [ ] Test mới pass cho 3 combination param.
- [ ] `dotnet build` backend pass.
- [ ] `pnpm test` pass.

## Risk Assessment

- Nếu thứ tự `URLSearchParams` không ổn định (q trước includeInactive) → assertion fail. Mitigation: build string cố định theo thứ tự `q` rồi `includeInactive` (không dùng `URLSearchParams` trong test expectation, hoặc dùng trong impl với thứ tự chèn cố định). Ưu tiên thứ tự chèn cố định trong impl.

## Security Considerations

- Không có.