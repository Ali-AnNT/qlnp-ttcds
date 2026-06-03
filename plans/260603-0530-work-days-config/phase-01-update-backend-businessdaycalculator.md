---
phase: 1
title: "Update Backend BusinessDayCalculator"
status: pending
priority: P2
effort: "30m"
dependencies: []
---

# Phase 1: Update Backend BusinessDayCalculator

## Overview

Thay đổi `BusinessDayCalculator.Count()` từ `bool includeSaturday` sang `HashSet<DayOfWeek> workDays`. Thêm helper method parse config string thành HashSet.

## Requirements

- `Count(DateTime start, DateTime end, HashSet<DayOfWeek> workDays)` — đếm ngày theo config
- Helper `ParseWorkDays(string configValue)` — parse `"1,2,3,4,5"` thành `HashSet<DayOfWeek>`
- Default khi config null/empty: Mon-Fri (`{1,2,3,4,5}`)

## Architecture

```
BusinessDayCalculator.cs
├── Count(start, end, workDays)  ← main method
├── DefaultWorkDays              ← static readonly HashSet = {Mon..Fri}
└── ParseWorkDays(configValue)   ← static helper
```

## Related Code Files

- Modify: `packages/api/Shared/Domain/BusinessDayCalculator.cs`

## Implementation Steps

1. Mở `BusinessDayCalculator.cs`
2. Xóa method `Count(DateTime start, DateTime end, bool includeSaturday = false)` cũ
3. Thêm `public static readonly HashSet<DayOfWeek> DefaultWorkDays = [DayOfWeek.Monday..DayOfWeek.Friday]`
4. Thêm `Count(DateTime start, DateTime end, HashSet<DayOfWeek> workDays)` — loop, check `workDays.Contains(d.DayOfWeek)`
5. Thêm `ParseWorkDays(string? configValue)` — parse comma-separated ints, fallback to DefaultWorkDays
6. Thêm overload `Count(DateTime start, DateTime end)` — gọi với DefaultWorkDays (backward compat)

## Success Criteria

- [ ] BusinessDayCalculator.Count() hoạt động với arbitrary workDays set
- [ ] ParseWorkDays("1,2,3,4,5,6") trả về {Mon,Tue,Wed,Thu,Fri,Sat}
- [ ] ParseWorkDays(null/empty) fallback về Mon-Fri
- [ ] Build thành công

## Risk Assessment

Low risk — internal static class, chỉ 2 callers (Create/Update endpoints).