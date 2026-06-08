# Brainstorm Report — Reports Page Filter Redesign

## Problem Statement
The user wants a more structured period filter UX for the reports page:
- Instead of raw start/end date inputs, the user selects the grouping type ("Loại"): Year, Quarter, or Month.
- The control layout dynamically displays selectors based on this Type:
  - **Year ("Theo năm"):** Shows Year select.
  - **Quarter ("Theo quý"):** Shows Year select + Quarter select.
  - **Month ("Theo tháng"):** Shows Year select + Month select.
- **Default values:**
  - Type: Year (`year`)
  - Year: Current Year
  - Quarter: Current Quarter
  - Month: Current Month
  - Status: All (`all`)
- **API Mapping:** Selected options map directly to API date parameters (`from` and `to`) so the backend continues to receive precise dates.

---

## Proposed Solution

### 1. UX Structure & Options
- **Period Types ("Loại"):**
  - `year`: "Theo năm"
  - `quarter`: "Theo quý"
  - `month`: "Theo tháng"
- **Year options:** Dynamic list from `currentYear - 5` to `currentYear + 1`.
- **Quarter options:** Q1 (1), Q2 (2), Q3 (3), Q4 (4).
- **Month options:** 1 to 12.

### 2. State & Dynamic Fields
In `ReportsPage`, the UI filters state holds:
```typescript
interface FilterState {
  type: "year" | "quarter" | "month";
  year: string;
  quarter: string;
  month: string;
  status: string;
}
```
The date parameters `from` and `to` are computed values based on `type`, `year`, `quarter`, and `month` right before query fetch and Excel export.

### 3. Date Mapping Rules
Using `date-fns` for robust dates:
- **Year ($Y$):**
  - `from` = `${Y}-01-01`
  - `to` = `${Y}-12-31`
- **Quarter ($Q$ in $Y$):**
  - Q1: `from` = `${Y}-01-01`, `to` = `${Y}-03-31`
  - Q2: `from` = `${Y}-04-01`, `to` = `${Y}-06-30`
  - Q3: `from` = `${Y}-07-01`, `to` = `${Y}-09-30`
  - Q4: `from` = `${Y}-10-01`, `to` = `${Y}-12-31`
- **Month ($M$ in $Y$):**
  - `from` = `format(new Date(Y, M - 1, 1), "yyyy-MM-dd")`
  - `to` = `format(lastDayOfMonth(new Date(Y, M - 1, 1)), "yyyy-MM-dd")`

---

## Touchpoints
- [reports-filter-bar.tsx](file:///home/vif/qlnp-ttcds/packages/web/src/features/reports/components/reports-filter-bar.tsx) (Rewrite UI selectors and layout)
- [reports-page.tsx](file:///home/vif/qlnp-ttcds/packages/web/src/features/reports/components/reports-page.tsx) (Update state structure, default values, and computed parameters mapping)

---

## Next Steps
Upon approval:
1. Generate an implementation plan.
2. Implement state and dynamic layout in the filter bar component.
3. Validate date mappings and verify builds/tests.
