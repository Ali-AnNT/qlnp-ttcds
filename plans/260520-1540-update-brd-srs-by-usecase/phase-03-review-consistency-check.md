---
phase: 3
title: Review & Consistency Check
status: completed
priority: P2
effort: 30m
dependencies:
  - '1'
  - '2'
---

# Phase 3: Review & Consistency Check

## Overview

Kiểm tra cross-document consistency giữa BRD và SRS sau khi cập nhật, đảm bảo alignment 100% với use case.

## Requirements

- Mọi yêu cầu trong BRD phải có mapping tương ứng trong SRS
- Mọi use case phải được bao phủ
- FR numbering phải nhất quán
- Access Matrix phải khớp giữa BRD và SRS

## Architecture

Cross-document review — so sánh BRD vs SRS vs usecase.md.

## Related Code Files

- Review: `docs/vision/brd.md`
- Review: `docs/vision/srs.md`
- Review: `docs/usecase/usecase.md`

## Implementation Steps

1. **Use case coverage check:** Đọc từng use case trong `docs/usecase/usecase.md` và verify mỗi requirement có FR tương ứng trong SRS
   - UC1 (Gửi đơn): FR-03, FR-04 ✅
   - UC2 (Phê duyệt): FR-05, FR-05.7, FR-05.8 ✅
   - UC3 (Theo dõi đơn): FR-04, FR-04.6, FR-11 ✅
   - UC4 (Tổng hợp lịch): FR-06, FR-07 ✅
   - UC5 (Cấu hình): FR-10 ✅
   - UC6 (Thống kê báo cáo): FR-08 ✅
   - UC7 (Vượt mức): FR-09 ✅

2. **BRD-SRS traceability check:** Mỗi BR trong BRD phải có ít nhất 1 FR trong SRS mapping
   - BR-001 → FR-03, FR-04, FR-04.3 (expanded), FR-04.6
   - BR-002 → FR-01
   - BR-003 → FR-01, FR-072
   - BR-004 → FR-01
   - BR-005 → Section 4 (Data)
   - BR-006 → FR-05
   - BR-007 → FR-05.7, FR-05.8 (new)
   - BR-008 → FR-08.4 (updated)

3. **Access Matrix consistency:** Verify Access Matrix trong SRS (Section 2.2) khớp với role descriptions trong BRD

4. **Business Rules consistency:** Verify BRULE trong BRD khớp với Data Validation Rules trong SRS
   - BRULE-007 (edit scope) ↔ SRS validation rule for LĐ.PCM
   - BRULE-010 (audit log) ↔ SRS FR-05.8
   - BRULE-011 (history) ↔ SRS FR-11

5. **FR numbering continuity:** Verify no gaps or duplicates in FR numbering across SRS

6. **Endpoint consistency:** Verify API endpoints in BRD Appendix B match SRS Section 7.3 backend structure

7. **Fix any inconsistencies found:** Edit BRD/SRS directly to resolve

## Success Criteria

- [ ] Every use case in usecase.md has at least 1 FR in SRS
- [ ] Every BR in BRD maps to at least 1 FR in SRS
- [ ] Access Matrix is consistent between BRD and SRS
- [ ] Business Rules are consistent between BRD and SRS
- [ ] FR numbering has no gaps or duplicates
- [ ] API endpoints in BRD Appendix B match SRS Section 7.3
- [ ] No orphan requirements (requirements in one doc but not the other)

## Risk Assessment

- Low risk: Document-only verification
- May discover additional gaps requiring minor edits

## Next Steps

- After consistency check, plan is complete
- User can proceed to implementation via `/ck:cook`
