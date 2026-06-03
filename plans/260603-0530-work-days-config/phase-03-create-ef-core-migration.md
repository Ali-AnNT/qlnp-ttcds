---
phase: 3
title: "Create EF Core Migration"
status: pending
priority: P2
effort: "15m"
dependencies: [2]
---

# Phase 3: Create EF Core Migration

## Overview

Tạo migration: xóa row `include_saturday`, thêm row `work_days`. Nếu DB đang có `include_saturday=true` → migrate thành `work_days=1,2,3,4,5,6`.

## Requirements

- Migration Up: DELETE `include_saturday` row, INSERT `work_days` row
- Migration Down: DELETE `work_days` row, INSERT `include_saturday` row (default false)
- Xóa migration cũ `20260603050447_AddIncludeSaturdayConfig.cs` (vì chưa deploy, thay bằng migration mới)
- Hoặc: giữ migration cũ và thêm migration mới — tùy thuộc trạng thái deploy

## Architecture

```
Migration: ReplaceIncludeSaturdayWithWorkDays
  Up:
    - DELETE FROM SystemConfigs WHERE ConfigKey = 'include_saturday'
    - Check if include_saturday was 'true' → INSERT work_days = '1,2,3,4,5,6'
    - Else → INSERT work_days = '1,2,3,4,5'
  Down:
    - DELETE FROM SystemConfigs WHERE ConfigKey = 'work_days'
    - INSERT include_saturday = 'false'
```

**Lưu ý quan trọng:** Migration `AddIncludeSaturdayConfig` vừa tạo ở session này CHƯA deploy. Nên xóa migration đó và tạo migration mới thay thế.

## Related Code Files

- Delete: `packages/api/Data/Migrations/20260603050447_AddIncludeSaturdayConfig.cs`
- Delete: `packages/api/Data/Migrations/20260603050447_AddIncludeSaturdayConfig.Designer.cs`
- Create: New migration file (via `dotnet ef migrations add`)
- Modify: `packages/api/Data/Migrations/AppDbContextModelSnapshot.cs` (auto-updated)

## Implementation Steps

1. Xóa migration cũ `20260603050447_AddIncludeSaturdayConfig.cs` và `.Designer.cs`
2. Revert seed data trong `AppDbContext.cs` (đổi `work_days` placeholder thành bản chính xác)
3. Chạy `dotnet ef migrations add ReplaceIncludeSaturdayWithWorkDays`
4. Kiểm tra migration generated — đảm bảo xóa include_saturday row, thêm work_days row
5. Nếu migration auto-generated không có logic migrate include_saturday=true → work_days=1,2,3,4,5,6, thì sửa migration thủ công

## Success Criteria

- [ ] Migration cũ đã xóa
- [ ] Migration mới tạo đúng: xóa include_saturday, thêm work_days
- [ ] AppDbContextModelSnapshot cập nhật
- [ ] `dotnet build` thành công

## Risk Assessment

Medium — migration undo/phản hồi cần test thủ công. Chưa deploy nên rủi ro thấp (có thể xóa và tạo lại).