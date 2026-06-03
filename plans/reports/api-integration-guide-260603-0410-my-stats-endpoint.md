# My Stats API — Integration Guide for Web

> Generated: 2026-06-03 | Commit: `4c5c28b` | Branch: `feat/update-deploy-cjs-ttcds-preset`

## Endpoint

```
GET /api/my-stats
Authorization: Bearer <JWT>   ← required
No query params. No request body.
```

## Response

```jsonc
{
  "success": true,
  "data": {
    "remainingDays": 12.0,   // decimal(5,1) — totalDays - usedDays
    "pendingCount": 1,        // int — đơn đang chờ duyệt
    "approvedCount": 3,       // int — đơn đã duyệt
    "usedDays": 3.0           // decimal(5,1) — tổng ngày đã nghỉ
  }
}
```

| Field | Type | Description |
|---|---|---|
| `remainingDays` | `number` | Số ngày phép còn lại = `totalDays - usedDays` (current year) |
| `pendingCount` | `number` | Số đơn nghỉ phép đang chờ duyệt (tất cả năm) |
| `approvedCount` | `number` | Số đơn nghỉ phép đã duyệt (tất cả năm) |
| `usedDays` | `number` | Tổng ngày đã sử dụng phép (current year, từ LeaveBalances) |

## TypeScript Types

```ts
interface MyStatsResponse {
  remainingDays: number
  pendingCount: number
  approvedCount: number
  usedDays: number
}

// Wrapper (dùng cho mọi API trong project)
interface Result<T> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
}
```

## Fetch Example

```ts
const res = await fetch('/api/my-stats')
const json: Result<MyStatsResponse> = await res.json()

if (json.success) {
  const { remainingDays, pendingCount, approvedCount, usedDays } = json.data
}
```

## Integration Notes

### 1. Dashboard Thay Thế 3+ Calls
Endpoint này **thay thế** việc gọi riêng lẻ:
- `GET /api/leave-balances/my` → lấy `remainingDays`, `usedDays`
- `GET /api/leave-requests/my` + client-side filter → lấy `pendingCount`, `approvedCount`

**Chỉ cần 1 call duy nhất** cho dashboard header.

### 2. Auto-Seed Balance
- Nếu user chưa có balance row cho năm hiện tại → **server tự tạo** với default days theo role
- Không cần pre-check hay điều kiện đặc biệt ở client

### 3. Year Filter
- **Không có year param** — endpoint luôn trả về năm hiện tại (`DateTime.UtcNow.Year`)
- Nếu cần năm khác, dùng `GET /api/leave-balances/my?year=2025` (endpoint cũ)

### 4. pendingCount vs approvedCount
- Đếm **tất cả** đơn nghỉ phép của user (không filter theo year)
- `pending` = Status string, `approved` = Status string trong LeaveRequests table

### 5. Error Cases
| HTTP | Meaning |
|------|---------|
| 200 | Luôn trả 200 nếu auth thành công (kể cả 0 đơn, 0 balance) |
| 401 | Không có JWT hoặc token hết hạn |
| 500 | Server error |

## API Mapping cho Dashboard Component

```ts
// DashboardHeader component
const stats = data // from GET /api/my-stats

// Card 1: Ngày phép còn lại
stats.remainingDays       // "Còn lại: 12 ngày"

// Card 2: Ngày đã nghỉ
stats.usedDays            // "Đã nghỉ: 3 ngày"

// Card 3: Đơn chờ duyệt
stats.pendingCount        // "Chờ duyệt: 1 đơn"

// Card 4: Đơn đã duyệt
stats.approvedCount       // "Đã duyệt: 3 đơn"
```

## Files Created (Backend)

| File | Purpose |
|------|---------|
| `packages/api/Features/MyStats/MyStatsEndpoint.cs` | GET /api/my-stats endpoint (FastEndpoints REPR) |
| `packages/api/Features/MyStats/MyStatsResponse.cs` | Response DTO: 4 fields |
| `packages/api/Shared/Groups/MyStatsGroup.cs` | Route group `api/my-stats`, Swagger tag "My Stats" |
