# Role Constants Refactor — Brainstorm Report

**Date**: 2026-05-27
**Decision**: Unify all role strings to `QLNP.*` format across API + Web

## Problem
- ~70+ hardcoded role strings across codebase
- 2 formats: short-form (`LD.PCM`) in DB + web, full-form (`QLNP.LD.PCM`) in JWT + API auth
- Bug vừa sửa: role mismatch giữa config short-form và JWT full-form
- Special case `"quantri"` tạo thêm inconsistency

## Solution: Single Format `QLNP.*`

### API: `Roles.cs` (new file)
```csharp
public static class Roles
{
    public const string Admin    = "QLNP.QTHT";
    public const string Director = "QLNP.GD.PGD";
    public const string Leader   = "QLNP.LD.PCM";
    public const string Staff    = "QLNP.CB.PCM";
    public static readonly string[] Priority = [Admin, Director, Leader, Staff];
}
```

### DB Changes
- `LeaveConfig.ApproverRole` MaxLength: 10 → 20
- Data migration: short-form → full-form
- Seed data: use full-form constants

### API /auth/me
- Return full-form `QLNP.*` directly (no more ToUiRole mapping)
- Xóa `"quantri"` special case entirely

### Web
- `UserRole` type: `"QLNP.CB.PCM" | "QLNP.LD.PCM" | "QLNP.GD.PGD" | "QLNP.QTHT"`
- All role strings use full-form
- Xóa `"quantri"`, xóa short-form entirely
- ApprovalPage: xóa `normalizeRole()` (not needed anymore)

## Files Changed

### API (14 files)
1. **Auth/Roles.cs** — NEW
2. **Auth/Me/Data.cs** — xóa MapRole complexity, return full-form
3. **Auth/DevLogin/Endpoint.cs** — use constants
4. **LeaveRequests/ApprovalHelper.cs** — xóa NormalizeRole(), use constants
5. **LeaveRequests/List/Data.cs** — use constants
6. **LeaveRequests/Approve/Endpoint.cs** — use constants
7. **LeaveRequests/Reject/Endpoint.cs** — use constants
8. **LeaveRequests/Create/Endpoint.cs** — use constants
9. **LeaveRequests/Update/Endpoint.cs** — use constants
10. **LeaveRequests/Cancel/Endpoint.cs** — use constants
11. **LeaveBalances/List/Endpoint.cs** — use constants
12. **LeaveTypes/{Create,Update,Delete}/Endpoint.cs** — use constants
13. **Config/Update/Endpoint.cs** — use constants
14. **Data/AppDbContext.cs** — seed data use constants, MaxLength → 20

### Migration (2 files)
1. **Migration: MaxLength + data update** — new EF migration

### Web (6+ files)
1. **lib/leave-data.ts** — update UserRole type, roleLabels keys
2. **components/AppSidebar.tsx** — remove AppRole, use UserRole, all full-form
3. **pages/ApprovalPage.tsx** — remove normalizeRole, full-form roles
4. **pages/ConfigPage.tsx** — remove "quantri" check, full-form roles
5. **pages/DashboardPage.tsx** — full-form role checks
6. **pages/CalendarPage.tsx** — full-form role checks
7. **pages/LoginPage.tsx** — update dev login labels

## Risks
- Breaking change: requires simultaneous API + Web deploy
- DB migration needed: short-form → full-form data update
- Frontend must clear localStorage/cookies (role format changes)