---
type: brainstorm
date: 2026-05-13
context: /home/vif/qlnp-ttcds
source:
  - docs/vision/brd.md
  - docs/vision/srs.md
  - plans/260513-0221-dotnet-migration-refactor/plan.md
  - plans/260513-0221-dotnet-migration-refactor/day-02-auth-core-apis.md
  - plans/260513-0221-dotnet-migration-refactor/day-03-leave-apis.md
---

# Brainstorm: Day 2 Auth Slices — Realignment với BRD/SRS

## Phát hiện

Day 2 plan (`day-02-auth-core-apis.md`) có 4 deviation so với BRD/SRS và master plan:

### 1. Sai kiến trúc — flat Endpoints/ thay vì VSA

Day 2 gộp endpoint trong `Endpoints/AuthEndpoints.cs` — trái với FastEndpoints REPR convention và Vertical Slice Architecture mà BRD/SRS/master plan yêu cầu (mỗi endpoint 1 class riêng trong `Features/{Feature}/{Action}/`).

### 2. Thiếu Exchange endpoint

Day 2 ghi "Gateway handles host auth → BE only internal JWT". BRD FR-002, SRS FR-01.8, master plan đều yêu cầu POST /api/auth/exchange + dual-issuer JWT.

### 3. Custom RoleRequirement thừa

FastEndpoints có sẵn `[Authorize(Roles = "...")]`, không cần tự viết middleware role check riêng.

### 4. Thiếu FluentValidation

BRD/SRS yêu cầu validation qua FluentValidation trong FastEndpoints pipeline. Day 2 không đề cập.

Day 3 (`day-03-leave-apis.md`) cũng mắc lỗi tương tự (flat Endpoints/).

## Quyết định

User chọn sửa theo BRD/SRS: rewrite Day 2 plan với VSA chuẩn.

## Thay đổi đã thực hiện

### day-02-auth-core-apis.md — rewrite hoàn toàn
- Cấu trúc VSA: `Features/Auth/Login/`, `Features/Auth/Exchange/`, `Features/Auth/Me/`
- Mỗi slice có Endpoint + Request + Response + Validator riêng
- Dual-issuer JWT (HS256 own + RS256 host)
- Exchange endpoint cho embed mode
- Dùng FastEndpoints built-in auth, bỏ RoleRequirement
- Employee/Department chuyển sang Day 3

### plan.md — update nhẹ
- Day 2 description: thêm "(VSA)", "embed headers"
- Day 3 description: thêm "(VSA)"

## Cần làm tiếp

- [ ] Day 1: verify scaffold đúng VSA structure
- [ ] Day 3: rewrite theo VSA (hiện tại vẫn flat Endpoints/)
- [ ] Day 4-10: kiểm tra consistent với VSA pattern
- [ ] Nếu Day 2 implement xong trước, Day 3 giảm tải
