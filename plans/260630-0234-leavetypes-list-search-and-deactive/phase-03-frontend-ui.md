---
phase: 3
title: "Frontend UI"
status: pending
effort: "1.5h"
dependencies: [2]
---

# Phase 3: Frontend UI

## Overview

Thêm input search + toggle "Hiện đã tắt" lên `LeaveTypeManager`. State local, truyền xuống `useLeaveTypes` args.

## Requirements

- Functional:
  - Input search (`q`) — gửi lên backend (server-side search).
  - Toggle/checkbox "Hiện đã tắt" (`includeInactive`) — default off.
  - Khi bật includeInactive, list hiện cả row deactivated (Switch off).
- Non-functional: data nhỏ, không cần debounce.

## Architecture

State `q` + `showInactive` ở component cha (config-page) hoặc trong `LeaveTypeManager`. Truyền vào `useLeaveTypes` để query. Component render thêm toolbar trên table.

Cần xem `config-page.tsx` wire `useLeaveTypes` hiện tại để chọn chỗ đặt state.

## Related Code Files

- Modify: `packages/web/src/features/config/components/leave-type-manager.tsx`
- Modify: `packages/web/src/features/config/components/config-page.tsx` (nếu state đặt ở cha)

## Implementation Steps

1. Đọc `config-page.tsx` xác định chỗ gọi `useLeaveTypes()` + truyền props xuống `LeaveTypeManager`.
2. Thêm state `q` (string), `showInactive` (bool) ở component sở hữu `useLeaveTypes`.
3. `useLeaveTypes({ q, includeInactive: showInactive })`.
4. Trong `LeaveTypeManager` thêm toolbar: `<Input placeholder="Tìm tên/mã..." value={q} onChange=.../>` và `<Switch/Checkbox "Hiện đã tắt" checked={showInactive} onCheckedChange=.../>` ở `CardHeader` (sau nút "Thêm loại phép").
5. Giữ `toggleMutation` hiện tại (merge full object). Khi includeInactive off, item tắt → biến khỏi list (invalidate refetch) → behavior cũ.

## Success Criteria

- [ ] Input search filter danh sách theo tên/mã.
- [ ] Toggle "Hiện đã tắt" hiện row deactivated.
- [ ] Toggle isActive vẫn hoạt động (không 400).
- [ ] UI không vỡ layout.

## Risk Assessment

- Khi `showInactive=false`, toggle một item off → item biến khỏi list ngay (refetch chỉ active). Có thể confuse user. Mitigation: giữ behavior (đã có sẵn, user confirm ở brainstorm). Hoặc: bật tự động includeInactive khi toggle off — **không làm** (YAGNI, tránh side-effect).
- Nếu state đặt sai component → re-render thừa. Đặt ở component gần `useLeaveTypes` nhất.

## Security Considerations

- Không có.