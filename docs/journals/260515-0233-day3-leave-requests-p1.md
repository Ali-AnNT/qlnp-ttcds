# LeaveRequests P1: List/Create/Update Endpoints

**Plan**: 260515-0233-day3-leave-requests-p1 (5 phases, all ✅)
**Branch**: feat/leave-requests-p1
**Effort**: 1d

**What was built**: 3 FastEndpoints vertical-slice endpoints under
`Features/LeaveRequests/` — List (role-scoped by
CB.PCM/LD.PCM/GD.PGD/QTHT), Create (with overlap check against
approved_leader+approved_director per BRULE-002), Update. Added
`BusinessDayCalculator` utility (Mon-Fri server-side),
`RequestedApproverId` migration with FK SetNull, and `DonVi` nav prop.

**Design calls**: Overlap only checks approved_leader+approved_director
(pending requests not blocked). Role strings follow BRD
(CB.PCM/LD.PCM/GD.PGD/QTHT). 5 deferred items tracked for P2.

**Bugs caught in review**: (1) `UserMaster.DonVi!` NRE when DonVi is null
— fixed with ternary. (2) No `DbUpdateException` handler — FK violations
returned 500 instead of 409. Added catch block. (3) Redundant Id in
Update request — removed.

**Build**: 0 errors, 0 warnings.
