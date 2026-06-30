# Reports Filter Bar Redesign — Dynamic Period Selection

**Date**: 2026-06-08 05:42
**Severity**: Low
**Component**: Reports — filter bar UI, period selectors
**Status**: Resolved
**Branch**: feat/reports-filter-redesign
**Plan**: plans/260608-0542-reports-filter-bar-redesign

## What Happened

Reports filter cũ yêu user nhập date bound thủ công qua date picker. UX tệ. Redesign: dropdown Loại (Year/Quarter/Month) + dynamic selector hiện theo loại. Year range currentYear-5 → currentYear+1. Month 1-12, Quarter Q1-Q4. Compute date range on-the-fly bằng date-fns.

## The Brutal Truth

Win nhỏ gọn: UX tốt hơn rõ. User chọn Year/Quarter/Month tự nhiên thay vì nhập date bound. Dropdown filter hiện dynamic theo loại — Quarter chỉ hiện khi type=quarter, Month chỉ hiện khi type=month.

Clean nhất: store raw select values (year, quarter, month, type), compute from/to on-the-fly bằng date-fns/lastDayOfMonth. API signature stable — chỉ from/to, không cần biết period type. Client-side calculation isolation tốt.

Hơi đau: UTC timezone format. Reviewer flag L (resolved) — local client date init handle UTC đúng.

## Technical Details

FE chỉ:
- reports-filter-bar.tsx (REWRITE): Loại select (Year/Quarter/Month), conditional Quarter/Month select, Year select (currentYear-5 → currentYear+1), Status select (Tất cả/Chờ duyệt/Đã duyệt/Từ chối/Đã hủy)
- reports-page.tsx (MODIFY): store selector-based FilterState init current date values, map sang from/to on-the-fly dùng date-fns, pass mapped args cho statistics query hook + Excel export API

Strict preserve lma- prefix Tailwind convention.

## What We Tried

1. Store raw select values, compute dates on-the-fly — CHỌN. API signature clean stable, client map.
2. Year range currentYear-5 → currentYear+1 — CHỌN. Đủ rộng cho historical report, +1 cho fiscal year overlap.
3. UTC timezone: local client date init handle đúng (reviewer L resolved).

## Root Cause Analysis

Root cause UX cũ: date picker yêu user biết date bound chính xác. Report theo quý/tháng = user phải tính "Q1 2026 = 2026-01-01 → 2026-03-31" thủ công. Mental load không cần thiết. Dropdown period type map sang date bound tự động = giảm cognitive.

## Lessons Learned

- Store raw UI value, compute derived value on-the-fly: API signature stable, UI flexible. Không nhồi period type vào API contract.
- Year range fixed formula (currentYear-5 → currentYear+1): đủ historical + future fiscal overlap. Đừng hardcode list năm.
- Conditional render dropdown theo type: Quarter chỉ hiện type=quarter, Month chỉ hiện type=month. UI không clutter.
- date-fns/lastDayOfMonth: compute to-date đúng không cần tự tính "tháng X có 28/29/30/31 ngày".
- Strict prefix convention: lma- prefix mọi className mới, không quên.

## Next Steps

- Verification: pnpm build success, pnpm lint 0 error 14 warning (pre-existing), pnpm test 40/40 pass.
- Reviewer finding L (UTC timezone) resolved.
- Nếu sau này cần custom date range: thêm type="custom" với date picker fallback. YAGNI hiện tại.
