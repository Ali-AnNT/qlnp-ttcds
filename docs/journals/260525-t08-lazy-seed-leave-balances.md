# T-08: Lazy Seed LeaveBalances - Phương án C

**Date**: 2026-05-25
**Severity**: High
**Component**: LeaveBalance API + Dashboard UI
**Status**: Resolved

## What Happened

"Ngày phép còn lại" (Remaining Leave Days) was displaying 0 for all users on the Dashboard. Users saw empty balance cards and 0 values everywhere, making the system look broken even though leave types were configured correctly.

## The Brutal Truth

This is a classic "chicken and egg" data initialization problem. The LeaveBalances table was empty until a director approved someone's leave request. Until that first approval happened, every user had zero balances — not because they had no leave, but because nobody had seeded the data. Users should not need a director's approval just to see their default leave entitlements.

## Technical Details

**Error manifested as**: Empty balance cards, "Ngày phép còn lại: 0" on Dashboard
**Root cause location**: LeaveBalances table starts empty; no initialization for new users or existing users without balances
**Affected endpoints**:
- `GET /leave-balances/my` - returned empty list
- `GET /leave-balances` - returned empty list

**Impact**: Every user in the system was seeing 0 days of leave until the first director approval created a record.

## What We Tried

**Phương án A (Rejected)**: Full migration seed - seed all users and all leave types upfront
- Overkill: creates records for inactive leave types and users who may never need them

**Phương án B (Rejected)**: Seed on user registration only
- Does not fix existing users with empty balances
- Too narrow scope

**Phương án C (Implemented)**: Lazy seed on API access - auto-upsert when user queries balance and no record exists for current year

## Root Cause Analysis

The system assumed LeaveBalances would be populated through the approval workflow, but:
1. New users had no balances until first approved request
2. Existing users who never requested leave had no balances
3. LeaveType.DefaultDays was configured but never used to initialize user balances
4. No backfill mechanism for existing users

## Lessons Learned

1. **Seed on access, not just on creation**: Lazy initialization ensures data exists when needed, without seeding unused combinations
2. **DefaultDays should drive initialization**: LeaveType.DefaultDays is the source of truth; balances should reflect this from day one
3. **Dashboard UX requires pre-seeded data**: Users expect to see their entitlements immediately, not after first approval

## Next Steps

- [x] Implement lazy seed in My/Data.cs and List/Data.cs
- [x] Create Seed/Data.cs for programmatic seeding
- [x] Run seed script for existing 4 users with QLNP roles
- [x] Add loading state fallback to DashboardPage.tsx
- [ ] Consider running seed for all existing users (not just QLNP roles) at next maintenance window
- [ ] Add monitoring for balance gaps (users without current-year balances)
