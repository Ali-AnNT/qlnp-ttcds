---
title: "Update LeaveType & LeaveConfig Seed Data"
description: "Replace 3 English-code LeaveTypes with 5 Vietnamese-code types + add LeaveConfig (approval config) seed data via EF HasData + single migration"
status: completed
priority: P2
branch: "feat/configurable-approval-levels"
tags: [seed-data, migration, leave-type, approval-config]
blockedBy: []
blocks: []
created: "2026-05-27T03:17:57.781Z"
createdBy: "ck:plan"
source: skill
---

# Update LeaveType & LeaveConfig Seed Data

## Overview

Replace 3 existing LeaveType seed rows (annual/sick/personal) with 5 Vietnamese-code rows (NPN/NO/NVR/NKL/NTS). Add LeaveConfig seed data for approval flow configuration. Single migration for both.

## Data Mapping

### LeaveType

| Id | Old Code → New Code | Name | DefaultDays | Description |
|----|---------------------|------|-------------|-------------|
| 1 | `annual` → `NPN` | Nghỉ phép năm | 12 | Nghỉ phép năm theo quy định |
| 2 | `sick` → `NO` | Nghỉ ốm | 30 | Nghỉ ốm đau có giấy xác nhận |
| 3 | `personal` → `NVR` | Nghỉ việc riêng | 3 | Nghỉ việc riêng có lương |
| 4 | **NEW** `NKL` | Nghỉ không lương | 0 | Nghỉ không hưởng lương |
| 5 | **NEW** `NTS` | Nghỉ thai sản | 180 | Nghỉ thai sản |

### LeaveConfig (Approval Flow)

| Config Id | LeaveTypeId | ApprovalLevel | ApproverRole | Flow |
|-----------|------------|---------------|--------------|------|
| 1 | 1 (NPN) | 1 | LD.PCM | 2-level |
| 2 | 1 (NPN) | 2 | GD.PGD | ↑ |
| 3 | 2 (NO) | 1 | LD.PCM | 2-level |
| 4 | 2 (NO) | 2 | GD.PGD | ↑ |
| 5 | 3 (NVR) | 1 | LD.PCM | 2-level |
| 6 | 3 (NVR) | 2 | GD.PGD | ↑ |
| 7 | 4 (NKL) | 1 | LD.PCM | **1-level** |
| 8 | 5 (NTS) | 1 | LD.PCM | 2-level |
| 9 | 5 (NTS) | 2 | GD.PGD | ↑ |

NKL = 1-level approval (PCM only). All others = 2-level (PCM → PGD).

## Impact Assessment

- **LeaveBalances**: Reference LeaveType by Id (1,2,3), not Code. Existing balances unaffected.
- **DefaultDays change** (Id=2: 0→30): Only affects new LeaveBalance rows. Existing balances keep original values.
- **Approval flow**: Already implemented in `Approve/Endpoint.cs`. Seed data provides defaults; admins can override via `PUT /api/config`.
- **No hardcoded references** to old codes outside seed data and one frontend test file.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Update HasData seed (LeaveType + LeaveConfig)](./phase-01-update-hasdata-seed.md) | Pending |
| 2 | [Generate migration](./phase-02-generate-migration.md) | Pending |
| 3 | [Update frontend test](./phase-03-update-frontend-test.md) | Pending |

## Dependencies

None — standalone seed data update.