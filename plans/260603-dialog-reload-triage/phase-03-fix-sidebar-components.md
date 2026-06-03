---
phase: 3
title: "Fix Sidebar Components"
status: completed
priority: P2
effort: "15min"
dependencies: []
---

# Phase 3: Fix Sidebar Components

## Overview

Thêm `type="button"` mặc định cho 3 sidebar component sử dụng pattern `asChild ? Slot : "button"`, giống pattern đã áp dụng cho `Button.tsx`. Không có `type`, button mặc định là `type="submit"` trong `<form>`.

## Requirements

- Functional: Component render `<button>` phải có `type="button"` mặc định (trừ khi consumer truyền `type` khác)
- Non-functional: Tương thích ngược — `type` prop vẫn override được

## Architecture

Pattern hiện tại (3 component):
```tsx
const Comp = asChild ? Slot : "button";
return <Comp className={...} ref={ref} {...props} />;
```

Pattern mục tiêu (giống Button.tsx):
```tsx
const Comp = asChild ? Slot : "button";
return <Comp className={...} ref={ref} type={type} {...props} />;
// với default: type = "button"
```

Khi `asChild=true`, `Slot` merge props vào child element → `type` prop được forward đúng. Khi `asChild=false`, `<button type="button">` rõ ràng.

## Related Code Files

- Modify: `packages/web/src/shared/ui/sidebar.tsx` (SidebarGroupAction, SidebarMenuButton, SidebarMenuAction)

## Implementation Steps

1. **SidebarGroupAction** (line ~375-394) — Thêm `type = "button"` default param và truyền vào Comp:
   ```tsx
   const SidebarGroupAction = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button"> & { asChild?: boolean }>(
     ({ className, asChild = false, type = "button", ...props }, ref) => {
       const Comp = asChild ? Slot : "button";
       return (
         <Comp
           ref={ref}
           type={type}
           data-sidebar="group-action"
           className={cn(...)}
           {...props}
         />
       );
     },
   );
   ```

2. **SidebarMenuButton** (line ~436-475) — Thêm `type = "button"` default param:
   ```tsx
   >(({ asChild = false, isActive = false, variant = "default", size = "default", tooltip, className, type = "button", ...props }, ref) => {
     const Comp = asChild ? Slot : "button";
     const button = (
       <Comp
         ref={ref}
         type={type}
         data-sidebar="menu-button"
         data-size={size}
         data-active={isActive}
         className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
         {...props}
       />
     );
   ```

3. **SidebarMenuAction** (line ~477-506) — Thêm `type = "button"` default param:
   ```tsx
   const SidebarMenuAction = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button"> & {
     asChild?: boolean;
     showOnHover?: boolean;
   }>(
     ({ className, asChild = false, showOnHover = false, type = "button", ...props }, ref) => {
       const Comp = asChild ? Slot : "button";
       return (
         <Comp
           ref={ref}
           type={type}
           data-sidebar="menu-action"
           className={cn(...)}
           {...props}
         />
       );
     },
   );
   ```

4. Chạy `pnpm --filter web lint` để verify
5. Chạy `pnpm --filter web build` để kiểm tra type errors

## Success Criteria

- [x] 3 sidebar component có `type="button"` mặc định
- [x] Consumer vẫn override được `type` prop (ví dụ `type="submit"`)
- [x] Sidebar render đúng, không có visual regression
- [x] Lint pass, Build pass

## Risk Assessment

Low risk. Pattern đã được verify với Button.tsx. `type="button"` là giá trị an toàn nhất cho button không-submit. `type` prop trong `...props` bị override bởi `type={type}` explicit prop (React merge order: explicit wins over spread).

**Lưu ý**: Đặt `type={type}` TRƯỚC `{...props}` để consumer vẫn override được qua props. Nếu đặt sau `{...props}`, consumer không thể override. Như Button.tsx đã làm đúng: `type={type} {...props}`.

## Next Steps

- Chuyển sang Phase 4 (Add Route Error Boundary)