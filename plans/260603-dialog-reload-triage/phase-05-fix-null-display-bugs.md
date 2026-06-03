---
phase: 5
title: "Fix Null Display Bugs"
status: pending
priority: P3
effort: "15min"
dependencies: []
---

# Phase 5: Fix Null Display Bugs

## Overview

Sửa 4 vị trí `tenDonVi` (string | null) hiển thị chữ "null" trong UI khi giá trị là null. React render `null` thành chuỗi rỗng "null" — gây nhầm lẫn cho người dùng.

## Requirements

- Functional: `tenDonVi === null` hiển thị chuỗi rỗng thay vì "null"
- Non-functional: Không thay đổi behavior khi `tenDonVi` có giá trị

## Architecture

4 vị trí cần sửa:

| File | Line | Mã hiện tại | Sửa thành |
|------|------|-------------|------------|
| `violation-dept-table.tsx` | 42 | `{d.dept.tenDonVi}` | `{d.dept.tenDonVi ?? ""}` |
| `violation-chart.tsx` | 77 | `name: d.dept.tenDonVi` | `name: d.dept.tenDonVi ?? ""` |
| `dept-summary-table.tsx` | 34 | `{d.tenDonVi}` | `{d.tenDonVi ?? ""}` |
| `calendar-page.tsx` | 39 | `{d.tenDonVi}` | `{d.tenDonVi ?? ""}` |

## Related Code Files

- Modify: `packages/web/src/features/violations/components/violation-dept-table.tsx`
- Modify: `packages/web/src/features/violations/components/violation-chart.tsx`
- Modify: `packages/web/src/features/summary/components/dept-summary-table.tsx`
- Modify: `packages/web/src/features/calendar/components/calendar-page.tsx`

## Implementation Steps

1. **violation-dept-table.tsx:42** — Thay `{d.dept.tenDonVi}` thành `{d.dept.tenDonVi ?? ""}`

2. **violation-chart.tsx:77** — Thay `name: d.dept.tenDonVi` thành `name: d.dept.tenDonVi ?? ""`

3. **dept-summary-table.tsx:34** — Thay `{d.tenDonVi}` thành `{d.tenDonVi ?? ""}`

4. **calendar-page.tsx:39** — Thay `{d.tenDonVi}` thành `{d.tenDonVi ?? ""}`

5. Chạy `pnpm --filter web lint` để verify

## Success Criteria

- [ ] `tenDonVi === null` hiển thị chuỗi rỗng (không hiển thị "null")
- [ ] `tenDonVi` có giá trị hiển thị đúng
- [ ] Chart label không hiện "null"
- [ ] Lint pass

## Risk Assessment

Very low risk. `??` chỉ thay đổi behavior khi giá trị là `null` hoặc `undefined`. Giá trị string không thay đổi.

## Next Steps

- Hoàn thành tất cả 5 phase. Chạy `pnpm --filter web build` để verify toàn bộ.