---
phase: 5
title: "Verify & Test"
status: pending
priority: P2
effort: "30m"
dependencies: [4]
---

# Phase 5: Verify & Test

## Overview

Kiểm tra end-to-end: config UI → API storage → day calculation (backend & frontend).

## Implementation Steps

1. `dotnet build` — đảm bảo backend compile
2. `pnpm --filter web exec tsc --noEmit` — đảm bảo frontend compile
3. Chạy `dotnet ef database update` — apply migration
4. Kiểm tra DB: row `work_days` tồn tại với value `"1,2,3,4,5"`, row `include_saturday` đã xóa
5. Test thủ công trên UI:
   - Vào Config page → General settings → Toggle Button Group hiển thị T2-T6 active
   - Bật T7 → toggle T7 on → lưu → reload → T7 vẫn on
   - Tắt tất cả → validation error (min 1 day)
   - Tạo đơn nghỉ phép: chọn T2-T7 → số ngày tính bao gồm T7
   - Tạo đơn nghỉ phép: chọn T2-T6 → số ngày KHÔNG bao gồm T7
6. Kiểm tra API: POST/PUT leave request trả về totalDays đúng theo work_days config

## Success Criteria

- [ ] Backend build thành công
- [ ] Frontend TypeScript compile thành công
- [ ] Migration apply thành công
- [ ] DB có row `work_days`, không có row `include_saturday`
- [ ] UI Toggle Button Group hoạt động đúng
- [ ] Config save/load đúng
- [ ] Day calculation đúng trên cả frontend và backend với các config khác nhau
- [ ] Tạo đơn nghỉ phép với config T2-T7 tính đúng số ngày bao gồm T7

## Risk Assessment

Low — verification step. Nếu có bug, fix trong phase này.