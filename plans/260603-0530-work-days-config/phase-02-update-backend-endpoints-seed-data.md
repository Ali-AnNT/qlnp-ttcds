---
phase: 2
title: "Update Backend Endpoints & Seed Data"
status: pending
priority: P2
effort: "30m"
dependencies: [1]
---

# Phase 2: Update Backend Endpoints & Seed Data

## Overview

Cập nhật Create/Update endpoints đọc `work_days` config thay `include_saturday`. Thay seed data trong AppDbContext.

## Requirements

- CreateLeaveRequestEndpoint: đọc `work_days` config, parse, truyền vào BusinessDayCalculator
- UpdateLeaveRequestEndpoint: tương tự
- AppDbContext seed data: xóa row `include_saturday`, thêm row `work_days` với default `"1,2,3,4,5"`

## Architecture

```
CreateLeaveRequestEndpoint.HandleAsync()
  → var workDaysConfig = await Db.SystemConfigs.Where(c => c.ConfigKey == "work_days").Select(c => c.ConfigValue).FirstOrDefaultAsync(ct);
  → var workDays = BusinessDayCalculator.ParseWorkDays(workDaysConfig);
  → var totalDays = BusinessDayCalculator.Count(r.StartDate, r.EndDate, workDays);
```

## Related Code Files

- Modify: `packages/api/Features/LeaveRequests/Create/CreateLeaveRequestEndpoint.cs`
- Modify: `packages/api/Features/LeaveRequests/Update/UpdateLeaveRequestEndpoint.cs`
- Modify: `packages/api/Data/AppDbContext.cs`

## Implementation Steps

1. Mở `CreateLeaveRequestEndpoint.cs`
2. Xóa dòng đọc `include_saturday` config cũ
3. Thay bằng: đọc `work_days` config, parse qua `BusinessDayCalculator.ParseWorkDays()`, truyền vào `Count()`
4. Mở `UpdateLeaveRequestEndpoint.cs` — thay đổi tương tự
5. Mở `AppDbContext.cs`
6. Xóa row seed `Id=9, ConfigKey="include_saturday"`
7. Thêm row seed `Id=9, ConfigKey="work_days", ConfigValue="1,2,3,4,5", Description="Các ngày làm việc trong tuần (0=CN, 1=T2, ..., 6=T7)"`

## Success Criteria

- [ ] Endpoints đọc `work_days` config thay `include_saturday`
- [ ] Fallback đúng khi config null/empty (dùng DefaultWorkDays)
- [ ] Seed data đúng format mới
- [ ] Build thành công

## Risk Assessment

Low risk — thay đổi nhỏ ở 2 endpoints. Cần test thủ công tạo đơn với config khác nhau.