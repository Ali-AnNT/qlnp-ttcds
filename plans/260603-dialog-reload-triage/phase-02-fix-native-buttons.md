---
phase: 2
title: "Fix Native Buttons"
status: completed
priority: P2
effort: "20min"
dependencies: []
---

# Phase 2: Fix Native Buttons

## Overview

Thêm `type="button"` cho 7 native `<button>` elements thiếu thuộc tính. Không có `type`, button mặc định là `type="submit"` khi nằm trong `<form>`, gây page reload ngoài ý muốn.

## Requirements

- Functional: Mọi `<button>` không phải submit phải có `type="button"`
- Non-functional: Không thay đổi behavior hiện tại (các button đã hoạt động đúng vì không nằm trong `<form>`)

## Architecture

7 vị trí cần sửa:

| File | Line | Component | Context |
|------|------|-----------|---------|
| `error-boundary.tsx` | 40 | "Thử lại" button | Error fallback UI |
| `sidebar.tsx` (SidebarRail) | 249 | Toggle sidebar | Sidebar resize rail |
| `app-sidebar.tsx` | 125 | Close sidebar (X) | Mobile sidebar close |
| `app-sidebar.tsx` | 145 | Expand menu item | Sidebar nav item |
| `app-sidebar.tsx` | 215 | Logout button | Sidebar footer |
| `dept-summary-table.tsx` | 36 | Total employees link | Department table |
| `dept-summary-table.tsx` | 44 | Total leave link | Department table |

## Related Code Files

- Modify: `packages/web/src/shared/ui/error-boundary.tsx`
- Modify: `packages/web/src/shared/ui/sidebar.tsx`
- Modify: `packages/web/src/features/layout/components/app-sidebar.tsx`
- Modify: `packages/web/src/features/summary/components/dept-summary-table.tsx`

## Implementation Steps

1. **error-boundary.tsx:40** — Thêm `type="button"` cho nút "Thử lại":
   ```tsx
   <button
     type="button"
     className="text-sm text-accent hover:underline"
     onClick={() => this.setState({ hasError: false, error: null })}
   >
   ```

2. **sidebar.tsx:249** (SidebarRail) — Thêm `type="button"` cho native button:
   ```tsx
   <button
     type="button"
     ref={ref}
     data-sidebar="rail"
     ...
   />
   ```

3. **app-sidebar.tsx:125** — Thêm `type="button"` cho nút đóng sidebar:
   ```tsx
   <button
     type="button"
     onClick={onClose}
     className="ml-auto p-1 rounded hover:bg-sidebar-accent"
   >
   ```

4. **app-sidebar.tsx:145** — Thêm `type="button"` cho nút mở rộng menu:
   ```tsx
   <button
     type="button"
     onClick={() => toggleExpand(item.label)}
     ...
   >
   ```

5. **app-sidebar.tsx:215** — Thêm `type="button"` cho nút đăng xuất:
   ```tsx
   <button
     type="button"
     onClick={logout}
     ...
   >
   ```

6. **dept-summary-table.tsx:36** — Thêm `type="button"` cho link tổng CB:
   ```tsx
   <button
     type="button"
     className="text-primary underline hover:text-primary/80 font-semibold"
     onClick={() => onEmpClick(d.donViId)}
   >
   ```

7. **dept-summary-table.tsx:44** — Thêm `type="button"` cho link tổng ngày phép:
   ```tsx
   <button
     type="button"
     className="text-primary underline hover:text-primary/80 font-semibold"
     onClick={() => onDetailClick(d.donViId)}
   >
   ```

8. Chạy `pnpm --filter web lint` để verify

## Success Criteria

- [x] Mọi native `<button>` trong 4 file có `type="button"`
- [x] Không có sự cố hồi quy (sidebar, logout, table links hoạt động bình thường)
- [x] Lint pass

## Risk Assessment

Very low risk. `type="button"` chỉ override default `type="submit"` — không thay đổi behavior hiện tại vì không button nào nằm trong `<form>`.

## Next Steps

- Chuyển sang Phase 3 (Fix Sidebar Components) — sửa 3 component sidebar pattern