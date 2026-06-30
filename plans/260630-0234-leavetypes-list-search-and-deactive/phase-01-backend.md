---
phase: 1
title: "Backend"
status: pending
effort: "1h"
dependencies: []
---

# Phase 1: Backend

## Overview

Thêm query param `q` (search Name+Code) và `includeInactive` cho `ListLeaveTypesEndpoint`. Backward-compat: omit param → chỉ active.

## Requirements

- Functional:
  - `q` (string?, optional): filter `t.Name.Contains(q) || t.Code.Contains(q)`, case-insensitive.
  - `includeInactive` (bool?, optional, default false): khi true, bỏ filter `IsActive`.
  - Kết hợp cả hai param.
- Non-functional: data nhỏ, không pagination.

## Architecture

Endpoint hiện `EndpointWithoutRequest`, đọc query param qua `Query<T>(...)` (pattern của `ListLeaveBalancesEndpoint`). Build `IQueryable` rồi apply filter điều kiện, `OrderBy(Name)`, `ToListAsync`.

## Related Code Files

- Modify: `packages/api/Features/LeaveTypes/List/ListLeaveTypesEndpoint.cs`

## Implementation Steps

1. Đổi `HandleAsync`: đọc `var q = Query<string?>("q", isRequired: false);` và `var includeInactive = Query<bool?>("includeInactive", isRequired: false) ?? false;`.
2. `var query = Db.LeaveTypes.AsQueryable();`
3. `if (!includeInactive) query = query.Where(t => t.IsActive);`
4. `if (!string.IsNullOrWhiteSpace(q)) { var term = q.Trim().ToLower(); query = query.Where(t => t.Name.ToLower().Contains(term) || t.Code.ToLower().Contains(term)); }`
5. Giữ `OrderBy(t => t.Name)`, map DTO như cũ, `Send.OkAsync`.

## Success Criteria

- [ ] `GET /leave-types` → chỉ active (backward-compat).
- [ ] `GET /leave-types?includeInactive=true` → cả active+inactive.
- [ ] `GET /leave-types?q=an` → filter Name/Code chứa "an" (case-insensitive).
- [ ] Compile pass (`dotnet build`).

## Risk Assessment

- `ToLower()` + `Contains` → SQL Server dịch `LIKE '%q%'` lower. OK cho data nhỏ. Không cần index/full-text.
- `Query<bool?>` parse: FastEndpoints parse "true"/"false". Test query string.

## Security Considerations

- Endpoint đã `RequireAuthorization()`. Search term đi vào EF `Contains` → parameterized, không SQL injection.