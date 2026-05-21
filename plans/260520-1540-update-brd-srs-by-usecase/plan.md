---
title: Update BRD & SRS theo Usecase thực tế
description: >-
  Cập nhật BRD và SRS để bao phủ đầy đủ 7 use case thực tế từ
  docs/usecase/usecase.md. Gap analysis đã xác định 8 gap chính: LĐ.PCM sửa đơn,
  approver cập nhật đơn, export Excel thay CSV, filter báo cáo, báo cáo
  tháng/quý, history view, search nâng cao, soft-cancel thay hard-delete.
status: completed
priority: P2
branch: toanhv/add-apis-for-qlnp
tags:
  - documentation
  - brd
  - srs
  - usecase-alignment
blockedBy: []
blocks: []
created: '2026-05-20T08:53:53.954Z'
createdBy: 'ck:plan'
source: skill
---

# Update BRD & SRS theo Usecase thực tế

## Overview

Cập nhật BRD (`docs/vision/brd.md`) và SRS (`docs/vision/srs.md`) để alignment 100% với 7 use case thực tế trong `docs/usecase/usecase.md`. Brainstorm report tại `plans/reports/brainstorm-update-brd-srs-by-usecase.md`.

## Key Decisions (from brainstorm)

1. **Hủy (soft-cancel)** — Không hard-delete, giữ audit trail
2. **LĐ.PCM sửa đơn** — Được sửa đơn pending trong phòng
3. **Export Excel (.xlsx)** — Có formatting thay vì CSV
4. **Approver cập nhật đơn** — Cho phép với audit log

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Update BRD](./phase-01-update-brd.md) | Completed |
| 2 | [Update SRS](./phase-02-update-srs.md) | Completed |
| 3 | [Review & Consistency Check](./phase-03-review-consistency-check.md) | Completed |

## Dependencies

- No cross-plan dependencies
- Brainstorm report: `plans/reports/brainstorm-update-brd-srs-by-usecase.md`
- Source use case: `docs/usecase/usecase.md`
