---
phase: 1
title: "Fix Critical Crash"
status: completed
priority: P1
effort: "15min"
dependencies: []
---

# Phase 1: Fix Critical Crash

## Overview

Sửa lỗi TypeError crash trong `reports-page.tsx` khi `DepartmentDto.tenDonVi` là `null`. Cùng loại lỗi với lỗi gốc đã sửa (null property access → render crash → page reload).

## Requirements

- Functional: `tenDonVi` null không gây TypeError khi gọi `.length` hoặc `.substring()`
- Non-functional: Không thay đổi logic nghiệp vụ, chỉ thêm null guard

## Architecture

```
reports-page.tsx:41-43
  d.tenDonVi.length > 15          ← TypeError nếu null
  d.tenDonVi.substring(0, 15)      ← TypeError nếu null
```

Fix: Null coalescing `(d.tenDonVi ?? "")` trước khi gọi string methods.

## Related Code Files

- Modify: `packages/web/src/features/reports/components/reports-page.tsx`

## Implementation Steps

1. Mở `reports-page.tsx`, dòng 40-43
2. Thay đổi biểu thức `label` từ:
   ```tsx
   const label =
     d.tenDonVi.length > 15
       ? d.tenDonVi.substring(0, 15) + "..."
       : d.tenDonVi;
   ```
   Thành:
   ```tsx
   const name = d.tenDonVi ?? "";
   const label = name.length > 15 ? name.substring(0, 15) + "..." : name;
   ```
3. Chạy `pnpm --filter web lint` để verify không có lỗi

## Success Criteria

- [x] `d.tenDonVi` null không gây TypeError
- [x] `d.tenDonVi` có giá trị vẫn hiển thị đúng (truncate nếu > 15 chars)
- [x] Lint pass
- [x] Build pass

## Risk Assessment

Low risk. Null coalescing `??` là defensive guard — nếu API không bao giờ trả null, behavior không thay đổi.

## Next Steps

- Chuyển sang Phase 2 (Fix Native Buttons) — độc lập, có thể chạy song song