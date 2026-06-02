---
title: 'Update deploy.cjs: replace presets with QuanLyNghiPhep target'
description: >-
  Replace 2 stale presets (ankhanh, phuongbinhtrung) with single 'ttcds' preset
  pointing to QuanLyNghiPhep DesktopModule on webproduction. Add auto-rebuild of
  web/dist. Fix checkDistExists to point at packages/web/dist (currently checks
  root dist by mistake).
status: done
priority: P2
branch: dev
tags:
  - deploy
  - ops
  - scripts
blockedBy: []
blocks: []
created: '2026-06-02T07:59:39.379Z'
createdBy: 'ck:plan'
source: skill
---

# Update deploy.cjs: replace presets with QuanLyNghiPhep target

## Overview

`scripts/deploy.cjs` đang chỉ support 2 preset cũ (`ankhanh`, `phuongbinhtrung`) cho TPTHUDUC projects đã không còn dùng. Cần thay bằng 1 preset duy nhất `ttcds` trỏ tới DNN DesktopModule `QuanLyNghiPhep` trên server `webproduction`. Đồng thời:

- Sửa `checkDistExists` (đang check sai path `dist` ở root → phải là `packages/web/dist`).
- Thêm `ensureDistBuilt()` tự rebuild `dist` mặc định, opt-out qua `DEPLOY_SKIP_REBUILD=1`.
- Log warning khi user truyền preset không tồn tại.

**Source:** brainstorm report `plans/reports/brainstorm-260602-0737-update-deploy-cjs-ttcds-preset.md`

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Update presets and add auto-rebuild](./phase-01-update-presets-and-auto-rebuild.md) | Done |

## Dependencies

None. Không chạm code ngoài `scripts/deploy.cjs`, không có cross-plan blockers.

## Out of scope (per user decision)

- Không sweep reference preset cũ ở file khác (docs, README, .env.example, makefile).
- Không thêm makefile target mới.
- Không đổi PowerShell/smbclient core logic.
- Folder `GUI\Scripts\build` trên server giả định đã tồn tại (admin đã tạo).
