---
title: "Dialog Reload Triage: 5-Layer Defense Fix"
description: "Sửa triệt để sự cố dialog reload trang: null crash, button type mặc định, thiếu error boundary, và hiển thị null string"
status: completed
priority: P1
branch: "feat/update-deploy-cjs-ttcds-preset"
tags: [bugfix, defensive-programming, react, ui]
blockedBy: []
blocks: []
created: "2026-06-03T03:14:24.670Z"
createdBy: "ck:plan"
source: skill
brainstorm: plans/reports/brainstorm-260603-dialog-reload-triage.md
---

# Dialog Reload Triage: 5-Layer Defense Fix

## Overview

Sự cố: dialog reload toàn bộ trang khi tương tác. 2 nguyên nhân gốc đã sửa (null crash trong DeptDetailDialog + button type mặc định). Báo cáo brainstorm phát hiện thêm: 1 lỗi crash cùng loại CRITICAL, 10 native button thiếu type, 3 sidebar component thiếu type mặc định, thiếu route-level error boundary, và 4 vị trí hiển thị "null" string.

Kế hoạch 5 phase áp dụng bảo vệ đa lớp: mỗi lỗi được bắt ở nhiều lớp, không có điểm lỗi đơn.

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [Fix Critical Crash](./phase-01-fix-critical-crash.md) | Completed | 15min |
| 2 | [Fix Native Buttons](./phase-02-fix-native-buttons.md) | Completed | 20min |
| 3 | [Fix Sidebar Components](./phase-03-fix-sidebar-components.md) | Completed | 15min |
| 4 | [Add Route Error Boundary](./phase-04-add-route-error-boundary.md) | Completed | 30min |
| 5 | [Fix Null Display Bugs](./phase-05-fix-null-display-bugs.md) | Completed | 15min |

## Dependencies

- Phase 1–3: Độc lập, có thể chạy song song
- Phase 4: Nên thực hiện sau Phase 1 (cần ErrorBoundary component hoạt động tốt)
- Phase 5: Độc lập, nhưng nên chạy cuối để dễ verify

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Sidebar component API change | Low | `type="button"` là giá trị mặc định, tương thích ngược |
| Route ErrorBoundary fallback UX | Medium | Test thủ công sau khi triển khai |
| Null guard che dấu dữ liệu null thực | Low | API nên không trả null, guard chỉ phòng vệ |

## Related Files

- Brainstorm report: `plans/reports/brainstorm-260603-dialog-reload-triage.md`
- Already fixed: `dept-detail-dialog.tsx` (null crash), `button.tsx` (type="button")