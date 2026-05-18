---
title: "Day 4 — LeaveRequests P2 (Approve/Reject/Cancel)"
status: complete
priority: P0
effort: "1d"
branch: feat/efcore-migration-net9-fastendpoints
created: 2026-05-15
blockedBy: [260515-0233-day3-leave-requests-p1]
blocks: [260514-0446-2week-finalization-and-embed]
source:
  - docs/vision/brd.md
  - docs/vision/srs.md
  - docs/vision/tasks.md
---

# Plan: Day 4 — LeaveRequests P2 (Approve/Reject/Cancel)

## Mục tiêu

Implement 3 endpoints còn lại của `LeaveRequests` feature slice theo Vertical Slice Pattern (VSP):

| Endpoint | Path | Role |
|----------|------|------|
| Approve | `PUT /api/leave-requests/{id}/approve` | LD.PCM, GD.PGD |
| Reject | `PUT /api/leave-requests/{id}/reject` | LD.PCM, GD.PGD |
| Cancel | `DELETE /api/leave-requests/{id}` | CB.PCM, LD.PCM (owner) |

## Tham chiếu

- BRD: BRULE-003, BRULE-006, FR-052, AC-007→AC-012, Appendix B
- SRS: FR-05, FR-043, FR-044, FR-045
- Tasks: `docs/vision/tasks.md` Day 4 + Action items

## Trạng thái khởi điểm

- `Approve/`, `Reject/`, `Cancel/` folders tồn tại nhưng rỗng
- Pattern VSP đã ổn định từ Create + Update slices
- `ICurrentUserProvider`, `AppDbContext`, `LeaveBalance` entity sẵn sàng

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Approve Endpoint](phase-01-approve-endpoint.md) | complete | 3h |
| 2 | [Reject Endpoint](phase-02-reject-endpoint.md) | complete | 1.5h |
| 3 | [Cancel Endpoint](phase-03-cancel-endpoint.md) | complete | 1h |

## Quyết định kỹ thuật (chốt)

1. **ApprovedBy** = `currentUser.UserId` (người duyệt thực tế), không đọc từ request body
2. **LeaveBalance.UsedDays** cộng thêm CHỈ khi `approved_director` (FR-052), Year = `StartDate.Year`
3. **Lazy-init**: Nếu không có `LeaveBalance` row → tạo mới với `TotalDays = LeaveType.DefaultDays`
4. **LD.PCM scope**: Verify `entity.User.PhongBanId == currentUser.PhongBanId` khi approve
5. **Ngoại lệ 1 cấp (BRULE-003)**: DEFER sang Day 5 sau khi LeaveConfigs slice sẵn sàng
6. **Cancel HTTP method**: DELETE (BRD Appendix B)
7. **Reject status scope**: LD.PCM reject khi pending; GD.PGD reject khi approved_leader

## Checklist nghiệm thu

- [x] `dotnet build` không lỗi sau khi implement cả 3 endpoint
- [x] AC-007: LD.PCM duyệt → status = approved_leader, approved_by = LD id
- [x] AC-008: GD.PGD duyệt → status = approved_director, used_days tăng
- [x] AC-009: Từ chối + lý do → status = rejected
- [x] AC-010: Owner hủy đơn pending → status = cancelled
- [x] AC-011: LD.PCM không approve đơn phòng khác → 403
- [x] AC-012: used_days cập nhật đúng sau approved_director
- [x] Commit: `feat(api): LeaveRequests P2 - Approve/Reject/Cancel`
