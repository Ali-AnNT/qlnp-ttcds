---
phase: 2
title: "Frontend API + hook"
status: pending
effort: "1h"
dependencies: [1]
---

# Phase 2: Frontend API + hook

## Overview

`leaveTypesApi.list` nhận optional `{q?, includeInactive?}` → query string. `useLeaveTypes` nhận args, queryKey include params.

## Requirements

- Functional:
  - `list(params?)` build `URLSearchParams` cho `q`, `includeInactive`.
  - `useLeaveTypes({q?, includeInactive?})` truyền vào queryFn, queryKey `["leave-types", {q, includeInactive}]`.
- Non-functional: 4 hook khác dùng `["leave-types"]` plain → giữ nguyên (prefix match, invalidate vẫn refetch all).

## Architecture

Config hook tách cache theo params. 4 hook khác (dashboard, leave-requests, summary, violations) fetch `list()` không param → `/leave-types` active only, không va chạm.

## Related Code Files

- Modify: `packages/web/src/features/config/api/leave-types.api.ts`
- Modify: `packages/web/src/features/config/hooks/use-leave-types.ts`

## Implementation Steps

1. `leave-types.api.ts`:
   ```ts
   list: (params?: { q?: string; includeInactive?: boolean }) => {
     const s = new URLSearchParams();
     if (params?.q) s.set("q", params.q);
     if (params?.includeInactive) s.set("includeInactive", "true");
     const qs = s.toString();
     return api.get<LeaveTypeDto[]>(`/leave-types${qs ? `?${qs}` : ""}`);
   },
   ```
2. `use-leave-types.ts`: thêm args `useLeaveTypes(opts?: {q?: string; includeInactive?: boolean})`.
3. queryKey: `["leave-types", { q: opts?.q, includeInactive: opts?.includeInactive }]`.
4. queryFn: `leaveTypesApi.list({ q: opts?.q, includeInactive: opts?.includeInactive })`.
5. `invalidateQueries({ queryKey: ["leave-types"] })` giữ nguyên (prefix match → refetch cả config lẫn 4 hook khác).

## Success Criteria

- [ ] `list()` không param → `GET /leave-types`.
- [ ] `list({q:"an", includeInactive:true})` → `GET /leave-types?q=an&includeInactive=true`.
- [ ] queryKey phân biệt theo params.
- [ ] TypeScript compile pass.

## Risk Assessment

- Đổi queryKey → cache tách. 4 hook khác vẫn key `["leave-types"]` nên không bị ảnh hưởng. Invalidate prefix an toàn.

## Security Considerations

- Không có. Param đi qua `URLSearchParams` (auto-encode).