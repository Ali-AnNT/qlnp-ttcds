---
phase: 4
title: "ConfigPage N-Level Dropdown"
status: pending
priority: P2
effort: "1h"
dependencies: [3]
---

# Phase 4: ConfigPage N-Level Dropdown

## Overview

Update the ConfigPage approval config tab to support N approval levels (not just 1/2). Allow users to select arbitrary level numbers and add multiple roles per level.

## Requirements

- Functional: Approval level dropdown allows selecting 1-N (not hardcoded 1/2)
- Functional: Multiple rows with same `(LeaveTypeId, ApprovalLevel)` are valid (multi-role per level)
- Functional: Display shows level descriptions clearly (e.g., "Cấp 1", "Cấp 2", "Cấp 3")
- Non-functional: UI must clearly show which roles belong to which level

## Architecture

**Level selection change:**
- Replace hardcoded `<SelectItem value="1">` and `<SelectItem value="2">` with a dynamic range
- Generate level options 1-10 (or based on existing configs for that LeaveType)
- Group configs by LeaveType in the display table for clarity

**Role selection:**
- Keep current role dropdown (LD.PCM, GD.PGD, QTHT) — same as before
- In future: add more roles as they're configured in the system

## Related Code Files

- Modify: `packages/web/src/pages/ConfigPage.tsx` — update approval level dropdown and display
- Modify: `packages/web/src/api/config.api.ts` — no change needed (ConfigDto already has `approvalLevel: number`)

## Implementation Steps

1. **Update approval level `<Select>` in `ConfigPage.tsx`**:
   - Replace hardcoded `<SelectItem value="1">` and `<SelectItem value="2">`
   - Generate options dynamically: 1 through 5 (or max existing level + 1)
   - Label each: "Cấp 1", "Cấp 2", "Cấp 3", etc.

2. **Update approval config display table**:
   - Group configs by LeaveType, then sort by ApprovalLevel
   - Show level as "Cấp {n}" instead of "1 cấp" / "2 cấp"
   - When multiple roles share the same level, show them on the same row or consecutive rows

3. **Update approval dialog**:
   - When editing existing config, pre-fill level and role
   - When adding new config, default level to max existing level for that LeaveType + 1, or 1 if no configs exist
   - Validate: don't allow duplicate `(LeaveTypeId, ApprovalLevel, ApproverRole)` combinations

4. **Improve visual grouping** (optional but recommended):
   - Add a visual separator between different LeaveType groups
   - Show a summary like "NPN: 2 cấp duyệt (LD.PCM → GD.PGD)"

## Success Criteria

- [ ] ConfigPage allows selecting levels 1-N (not just 1 or 2)
- [ ] Multiple roles per level display correctly
- [ ] Approval configs are grouped by LeaveType in the display
- [ ] Level labels show "Cấp 1", "Cấp 2", etc.
- [ ] Validation prevents duplicate `(LeaveTypeId, ApprovalLevel, ApproverRole)` entries
- [ ] ConfigPage works correctly with 1-level, 2-level, and 3+ level configs

## Risk Assessment

- **Low risk**: This is primarily a UI change with no backend logic impact. The `ConfigDto` already supports arbitrary `approvalLevel` values.

## Security Considerations

- Only QTHT role can access ConfigPage (already enforced)
- Backend `PUT /api/config` validates configs before saving