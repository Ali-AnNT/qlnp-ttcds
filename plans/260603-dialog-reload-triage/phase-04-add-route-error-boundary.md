---
phase: 4
title: "Add Route Error Boundary"
status: pending
priority: P2
effort: "30min"
dependencies: [1]
---

# Phase 4: Add Route Error Boundary

## Overview

Thêm route-level error boundary cho React Router. Hiện tại ErrorBoundary toàn app đã hoạt động (App.tsx) nhưng lỗi trong 1 route làm sập toàn bộ app (mất sidebar, mất điều hướng). Cần errorElement cho layout route để chỉ ảnh hưởng nội dung route, giữ sidebar hiển thị.

## Requirements

- Functional: Lỗi render trong route con chỉ ảnh hưởng nội dung route, không sập toàn app
- Non-functional: Fallback UI hiển thị nút "Thử lại" hoặc "Quay lại", giữ sidebar hiển thị
- Constraint: Tương thích với React Router v7 data router API (`errorElement` hoặc `ErrorBoundary` component)

## Architecture

```
App.tsx (top-level ErrorBoundary — CATCHES EVERYTHING)
  └── Providers
      └── RouterProvider
          └── AppLayout (sidebar + outlet)
              └── <Outlet /> ← ROUTE CONTENT
                  └── [errorElement] ← NEW: catches route-level errors
```

React Router data router hỗ trợ `errorElement` prop trên route definition. Khi route throw error, `errorElement` render thay vì route component. Sidebar (trong AppLayout) vẫn hiển thị bình thường.

## Related Code Files

- Modify: `packages/web/src/app/router.tsx` — thêm `errorElement` cho layout route
- Create: `packages/web/src/shared/ui/route-error-boundary.tsx` — route-level error fallback component

## Implementation Steps

1. **Tạo `route-error-boundary.tsx`** trong `packages/web/src/shared/ui/`:
   ```tsx
   import { useRouteError, isRouteErrorResponse, Link } from "react-router";

   /**
    * Fallback UI cho route-level errors.
    * Hiển thị lỗi + nút quay lại, giữ sidebar hiển thị.
    */
   export function RouteErrorBoundary() {
     const error = useRouteError();
     const message = isRouteErrorResponse(error)
       ? `${error.status} ${error.statusText}`
       : error instanceof Error
         ? error.message
         : "Lỗi không xác định";

     return (
       <div className="flex items-center justify-center min-h-[400px] p-6">
         <div className="text-center space-y-3">
           <p className="text-destructive font-medium">
             Có lỗi khi tải trang
           </p>
           <p className="text-sm text-muted-foreground">{message}</p>
           <Link to="/" className="text-sm text-accent hover:underline">
             Quay lại trang chủ
           </Link>
         </div>
       </div>
     );
   }
   ```

2. **Cập nhật `router.tsx`** — thêm `errorElement` cho layout route:
   ```tsx
   import { RouteErrorBoundary } from "@/shared/ui/route-error-boundary";

   export const router = createBrowserRouter([
     { path: ROUTES.login, Component: LoginPage },
     { path: "/", loader: () => { throw redirect(ROUTES.layout); } },
     {
       path: ROUTES.layout,
       loader: authLoader,
       Component: AppLayout,
       errorElement: <RouteErrorBoundary />,  // ← NEW
       children: [
         // ... existing routes (no individual errorElement needed)
       ],
     },
     { path: "*", Component: NotFound },
   ]);
   ```

3. **Verify**: Throwing error trong 1 route (tạm thời) → sidebar vẫn hiển thị, chỉ nội dung route hiện fallback

4. Chạy `pnpm --filter web lint` và `pnpm --filter web build`

## Success Criteria

- [ ] Lỗi render trong route con không làm sập sidebar
- [ ] Fallback UI hiển thị nút "Quay lại trang chủ"
- [ ] ErrorBoundary toàn app vẫn bắt lỗi ngoài route (Providers, Layout)
- [ ] Lint pass, Build pass

## Risk Assessment

Medium risk. Thêm `errorElement` vào layout route có thể thay đổi cách React Router xử lý lỗi loader. Cần test:
- `authLoader` throw → fallback hiển thị đúng (chưa đăng nhập)
- Route component throw → sidebar giữ, nội dung hiện fallback
- Network error → fallback hiển thị đúng

## Next Steps

- Chuyển sang Phase 5 (Fix Null Display Bugs)