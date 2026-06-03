---
title: "Replace include_saturday with work_days config"
description: "Thay config include_saturday (boolean) bằng work_days (comma-separated DayOfWeek). UI: Toggle Button Group chọn ngày làm việc. Backend: BusinessDayCalculator nhận HashSet<DayOfWeek> thay bool. Frontend: countBusinessDays nhận number[]."
status: completed
priority: P2
branch: "dev"
tags: [config, leave-requests, business-days]
blockedBy: []
blocks: []
created: "2026-06-03T05:30:53.107Z"
createdBy: "ck:plan"
source: skill
---

# Replace include_saturday with work_days config

## Overview

Thay config `include_saturday` (boolean) bằng `work_days` (chuỗi DayOfWeek cách nhau bởi phẩy, VD: `"1,2,3,4,5"` = T2-T6). UI dùng Toggle Button Group thay Switch đơn. Backend & Frontend tính ngày làm việc dựa trên danh sách ngày config thay vì hardcode.

**Motivation:** Config boolean chỉ bật/tắt thứ 7, không linh hoạt. Nếu công ty muốn T2-T7 hoặc chỉ T2-T5, phải đổi code. Config `work_days` cho phép admin tự chọn ngày làm việc qua UI.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Update Backend BusinessDayCalculator](./phase-01-update-backend-businessdaycalculator.md) | Pending |
| 2 | [Update Backend Endpoints & Seed Data](./phase-02-update-backend-endpoints-seed-data.md) | Pending |
| 3 | [Create EF Core Migration](./phase-03-create-ef-core-migration.md) | Pending |
| 4 | [Update Frontend date-utils & UI](./phase-04-update-frontend-date-utils-ui.md) | Pending |
| 5 | [Verify & Test](./phase-05-verify-test.md) | Pending |

## Dependencies

None — standalone config change.

## Key Decisions

- Config value format: comma-separated DayOfWeek integers (0=Sun, 1=Mon, ..., 6=Sat) — same convention as C# `DayOfWeek` enum and JS `Date.getDay()`
- Default: `"1,2,3,4,5"` (Mon-Fri) — preserves current behavior
- Migration: if existing `include_saturday=true` → migrate to `"1,2,3,4,5,6"`, else `"1,2,3,4,5"`
- UI: Toggle Button Group with VN labels (CN, T2-T7), min 1 day selected