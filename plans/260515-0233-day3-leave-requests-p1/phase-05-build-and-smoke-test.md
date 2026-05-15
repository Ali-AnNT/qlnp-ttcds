---
phase: 5
title: "Build + Smoke Test"
status: complete
priority: P0
effort: "15m"
dependencies: [2, 3, 4]
---

# Phase 5: Build + Smoke Test

## Overview

Chạy `dotnet build`, kiểm tra 0 errors, smoke test 3 endpoints bằng `.http` file hoặc curl.

## Implementation Steps

1. **Build**:
   ```bash
   cd packages/api && dotnet build
   ```
   → Phải 0 errors, 0 warnings (ngoài nullable warnings nếu có).

2. **Kiểm tra role names** — xác nhận role strings trong `Roles(...)` khớp với claims JWT:
   ```bash
   # Decode JWT token dev và xem claims
   # Kiểm tra field "role" hoặc ClaimTypes.Role
   ```

3. **Smoke test** (dùng `.http` file hoặc curl với Bearer token dev):

   ```http
   ### List — CB.PCM
   GET {{baseUrl}}/api/leave-requests
   Authorization: Bearer {{cbToken}}

   ### Create — hợp lệ
   POST {{baseUrl}}/api/leave-requests
   Authorization: Bearer {{cbToken}}
   Content-Type: application/json

   {
     "leaveTypeId": 1,
     "startDate": "2026-05-20",
     "endDate": "2026-05-22",
     "reason": "Nghỉ phép cá nhân"
   }

   ### Create — ngày quá khứ (expect 400)
   POST {{baseUrl}}/api/leave-requests
   Authorization: Bearer {{cbToken}}
   Content-Type: application/json

   {
     "leaveTypeId": 1,
     "startDate": "2026-01-01",
     "endDate": "2026-01-03",
     "reason": "Test"
   }

   ### Update — hợp lệ (dùng Id từ Create)
   PUT {{baseUrl}}/api/leave-requests/{{createdId}}
   Authorization: Bearer {{cbToken}}
   Content-Type: application/json

   {
     "id": {{createdId}},
     "leaveTypeId": 1,
     "startDate": "2026-05-20",
     "endDate": "2026-05-23",
     "reason": "Cập nhật lý do"
   }
   ```

4. **Update tasks.md** — đánh dấu Day 3 hoàn thành:
   ```
   docs/vision/tasks.md → checkbox Day 3 → [x]
   ```

5. **Commit**:
   ```bash
   git add packages/api/Entities/LeaveRequest.cs \
           packages/api/Data/Migrations/ \
           packages/api/Features/LeaveRequests/
   git commit -m "feat(api): LeaveRequests List/Create/Update + RequestedApproverId migration"
   ```

## Success Criteria

- [x] `dotnet build` 0 errors
- [x] GET trả 200 với list đúng scope
- [x] POST hợp lệ → 201; invalid → 400/422/409
- [x] PUT hợp lệ → 200; không phải pending → 409; không phải owner → 403
- [x] `tasks.md` Day 3 checkboxes = [x]
- [x] Commit sạch trên feature branch
