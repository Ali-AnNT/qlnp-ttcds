---
phase: 4
title: "Update Frontend date-utils & UI"
status: pending
priority: P2
effort: "1h"
dependencies: [3]
---

# Phase 4: Update Frontend date-utils & UI

## Overview

Cập nhật `countBusinessDays()` nhận `workDays: number[]` thay `includeSaturday: boolean`. Thay Switch `include_saturday` bằng Toggle Button Group chọn ngày làm việc trong General Settings. Cập nhật leave-new-page và leave-my-page đọc `work_days` config.

## Requirements

- `countBusinessDays(start, end, workDays?)` — nhận mảng số DayOfWeek, default `[1,2,3,4,5]`
- Toggle Button Group UI: CN, T2, T3, T4, T5, T6, T7 — toggle on/off, min 1 selected
- GeneralSettings: thay Switch include_saturday bằng Toggle Button Group
- leave-new-page & leave-my-page: đọc `work_days` config, parse, truyền vào countBusinessDays

## Architecture

```
date-utils.ts
├── countBusinessDays(start, end, workDays = [1,2,3,4,5])
├── parseWorkDays(configValue: string): number[]
└── WORK_DAY_LABELS constant [{value: 0, label: 'CN'}, {value: 1, label: 'T2'}, ...]

general-settings.tsx
├── Replace Switch with Toggle Button Group
├── Read work_days config, parse to number[]
├── Toggle day → onChange('work_days', newValue.join(','))
└── Validate min 1 day selected

leave-new-page.tsx / leave-my-page.tsx
├── useSystemConfigs() → find work_days
├── parseWorkDays(configValue) → number[]
└── countBusinessDays(start, end, workDays)
```

## Related Code Files

- Modify: `packages/web/src/shared/lib/date-utils.ts`
- Modify: `packages/web/src/features/config/components/general-settings.tsx`
- Modify: `packages/web/src/features/leave-requests/components/leave-new-page.tsx`
- Modify: `packages/web/src/features/leave-requests/components/leave-my-page.tsx`

## Implementation Steps

1. Mở `date-utils.ts`
2. Sửa `countBusinessDays(start, end, workDays = [1,2,3,4,5])` — thay vòng while check `day !== 0 && day !== 6` bằng `workDays.includes(day)`
3. Thêm `parseWorkDays(configValue: string): number[]` — parse `"1,2,3,4,5"` → `[1,2,3,4,5]`, fallback `[1,2,3,4,5]`
4. Thêm `WORK_DAY_OPTIONS` constant cho UI labels
5. Mở `general-settings.tsx`
6. Xóa Switch `include_saturday`
7. Thêm Toggle Button Group: 7 buttons (CN, T2-T7), active state khi included trong work_days
8. Xử lý onChange: toggle day → update config value thành comma-separated string
9. Validate: ít nhất 1 ngày phải được chọn
10. Mở `leave-new-page.tsx`
11. Xóa `includeSaturday` logic cũ
12. Thay bằng: `const workDays = parseWorkDays(systemConfigs.find(c => c.configKey === 'work_days')?.configValue)`
13. Truyền `workDays` vào `countBusinessDays(start, end, workDays)`
14. Mở `leave-my-page.tsx` — thay đổi tương tự

## Success Criteria

- [ ] countBusinessDays hoạt động với workDays tùy ý
- [ ] parseWorkDays parse đúng, fallback khi null/empty
- [ ] Toggle Button Group hiển thị đúng VN labels (CN, T2-T7)
- [ ] Toggle day cập nhật config value dạng comma-separated
- [ ] Min 1 ngày validation hoạt động
- [ ] leave-new-page tính ngày đúng theo work_days config
- [ ] leave-my-page tính ngày đúng theo work_days config
- [ ] TypeScript compile thành công

## Risk Assessment

Medium — UI thay đổi đáng kể (Switch → Toggle Group). Cần test thủ công trên browser.