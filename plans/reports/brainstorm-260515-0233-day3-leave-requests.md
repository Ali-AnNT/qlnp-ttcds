---
name: brainstorm-day3-leave-requests-p1
description: Brainstorm Day 3 — LeaveRequests P1 (List/Create/Update) design decisions
metadata:
  type: project
---

# Brainstorm — Day 3: LeaveRequests P1

## Quyết định chốt

| Câu hỏi | Quyết định | Lý do |
|---------|-----------|-------|
| List scope | CB.PCM=own, LD.PCM=toàn phòng, GD.PGD/QTHT=all | Role-based đầy đủ, dùng chung cho cả LeaveMy và Approval list |
| RequestedApproverId | Thêm ngay + EF migration | Cần cho Create; task.md đã ghi rõ |
| Overlap check | `approved_leader` + `approved_director` only (BRULE-002) | Đơn pending chưa chắc xác nhận, không nên chặn |

## Cấu trúc file quyết định

```
Features/LeaveRequests/
├── LeaveRequestDto.cs          ← shared DTO
├── BusinessDayCalculator.cs    ← static util (Mon–Fri)
├── List/{Endpoint,Data,Models}.cs
├── Create/{Endpoint,Data,Models}.cs
└── Update/{Endpoint,Data,Models}.cs
```

## Lưu ý kỹ thuật

- Role names trong `Roles(...)` phải khớp JWT claims — verify trước khi test
- `DateTime.Today` timezone cần nhất quán với server (UTC vs local)
- `HasOverlapAsync` trong Update phải exclude `Id` của đơn đang sửa
- `UserMaster` có thể không có `TenPhongBan` — check entity trước khi mapping DTO

## Unresolved Questions

- Role strings chính xác trong JWT: `nhanvien`/`lanhdao`/`giamdoc`/`quantri` hay khác? → Verify ở Phase 5
