# Research Report: DatePicker với Calendar + Manual Text Input

## Executive Summary

Cần tạo component `DatePicker` tại `@/shared/ui/date-picker` hỗ trợ **2 chế độ nhập**: (1) chọn từ calendar popup, (2) gõ tay vào input như input bình thường. Project đang dùng shadcn/ui + react-day-picker v8 + date-fns v4. Component `Calendar` và `Popover` đã có sẵn, chỉ cần compose thêm `Input` với logic sync 2 chiều.

**Khuyến nghị**: Xây custom DatePicker theo pattern shadcn (Popover + Calendar + Input), KHÔNG cài thêm library mới. Lý do: project đã có đủ dependency, pattern phổ biến, dễ maintain, bundle size minimal.

## Research Methodology

- Sources consulted: 5 (shadcn docs via context7, react-day-picker docs via context7, web search, codebase scout, README)
- Date range: 2024-2026
- Key search terms: "React DatePicker manual text input calendar", "shadcn date picker editable input", "react-day-picker input field binding"

## Key Findings

### 1. Codebase Status

| Item | Status |
|------|--------|
| `DatePicker` import | `leave-new-page.tsx:7` imports from `@/shared/ui/date-picker` — **file chưa tồn tại** |
| `Calendar` base | `shared/ui/calendar.tsx` — sẵn dùng (react-day-picker v8 + shadcn style) |
| `Popover` | `shared/ui/popover.tsx` — sẵn dùng (Radix UI) |
| `Input` | `shared/ui/input.tsx` — sẵn dùng |
| `Button` | `shared/ui/button.tsx` — sẵn dùng |
| date-fns | v4.1.0 — `format`, `parseISO` đã dùng; cần thêm `parse`, `isValid` |
| react-day-picker | v8.10.1 — compatible |

### 2. Cách sử dụng hiện tại (leave-new-page.tsx)

```tsx
<DatePicker
  date={field.value ? parseISO(field.value) : undefined}  // Date | undefined
  onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")}  // string "yyyy-MM-dd"
  placeholder="Chọn ngày bắt đầu"
  fromDate={parseISO(today)}  // disable past dates
/>
```

- `date`: `Date | undefined` (controlled)
- `onSelect`: `(date: Date | undefined) => void`
- `placeholder`: string
- `fromDate`: `Date` (optional, disable dates before)

### 3. Pattern: shadcn DatePicker + Input (Editable)

shadcn KHÔNG có sẵn component `DatePicker` root — nó là **composition** của Popover + Calendar. Để thêm manual input, cần thay `Button` trigger bằng `Input` + calendar icon button.

**Cấu trúc đề xuất:**

```
Popover
├── PopoverTrigger (div chứa Input + Icon button)
└── PopoverContent
    └── Calendar
```

### 4. Sync Logic 2 chiều (Core Pattern từ react-day-picker docs)

```tsx
// Khi user chọn từ Calendar → cập nhật input value
const handleDayPickerSelect = (date: Date | undefined) => {
  if (!date) {
    setInputValue("");
    onSelect?.(undefined);
  } else {
    setInputValue(format(date, "dd/MM/yyyy"));
    onSelect?.(date);
  }
};

// Khi user gõ vào Input → parse + cập nhật Calendar
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const val = e.target.value;
  setInputValue(val);

  const parsed = parse(val, "dd/MM/yyyy", new Date());
  if (isValid(parsed)) {
    onSelect?.(parsed);  // → Calendar cập nhật selected
  }
  // Nếu không valid → giữ input text, KHÔNG clear (cho user tiếp tục gõ)
};
```

Key insight: dùng 2 state riêng — `inputValue` (string, raw text) vs `date` (Date | undefined, parsed). Chỉ sync khi parse thành công.

### 5. Định dạng ngày (Date Format)

| Locale | Format | Example |
|--------|--------|---------|
| Vietnam (vi) | `dd/MM/yyyy` | 03/06/2026 |
| ISO (internal) | `yyyy-MM-dd` | 2026-06-03 |

- **Input display**: `dd/MM/yyyy` (người Việt quen thuộc)
- **Internal/form value**: `yyyy-MM-dd` (API contract)
- Component nhận `date` prop dạng `Date`, `onSelect` callback trả `Date | undefined`
- Parent (leave-new-page) convert giữa Date ↔ "yyyy-MM-dd" string

### 6. Alternative Libraries (Considered, Rejected)

| Library | Pros | Cons | Verdict |
|---------|------|------|---------|
| `@syncfusion/react-calendars` | Built-in editable input, rich features | Commercial license, heavy | ❌ Overkill |
| `react-datepicker` (wojtekmaj) | Popular, built-in input | Different styling system, extra dep | ❌ Style mismatch |
| `@bw-ui/datepicker` | Modular, input-handler plugin | New library, small community | ❌ Risk |
| `react-aria` DatePicker | Accessible, segment input | Requires adapter, diff paradigm | ❌ Complex |

**Verdict**: Custom composition (Popover + Calendar + Input) là best fit — zero new deps, consistent style, full control.

## Implementation Recommendations

### Component API

```tsx
interface DatePickerProps {
  date?: Date;                    // Controlled selected date
  onSelect?: (date: Date | undefined) => void;  // Selection callback
  placeholder?: string;           // Input placeholder
  fromDate?: Date;                // Disable dates before this
  toDate?: Date;                  // Disable dates after this
  disabled?: boolean;             // Disable entire component
  formatStr?: string;             // Display format (default: "dd/MM/yyyy")
  locale?: Locale;                // date-fns locale for Calendar
}
```

### File Structure

```
shared/ui/
├── date-picker.tsx          # Main component (Popover + Input + Calendar)
└── calendar.tsx             # Existing — no changes needed
```

### Key Implementation Details

1. **Input + Icon trigger**: Thay Button trigger bằng `Input` + calendar icon button nằm trong cùng container. Input nhận text entry, icon button toggle popover.

2. **Blur validation**: Khi input blur, nếu text không parse được → reset về giá trị `date` hiện có (hoặc clear nếu chưa có date).

3. **Popover close on select**: Khi user chọn date từ Calendar → auto-close popover, focus lại input.

4. **Disabled dates**: Pass `fromDate`/`toDate` → Calendar's `disabled` prop.

5. **Accessibility**: Input có `role="combobox"`, `aria-expanded`, `aria-haspopup="dialog"`.

6. **Vietnamese locale**: Calendar đã dùng locale `vi` từ date-fns, DatePicker cần consistent.

### Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Input flicker khi typing | Tách `inputValue` state riêng, chỉ sync `date` khi parse OK |
| Calendar không follow typed date | Dùng `month`/`onMonthChange` props, set `month` khi parse OK |
| Date format confusion | Internal luôn Date, display format configurable, parent convert sang ISO string |
| Popover không close khi select | `setOpen(false)` trong `handleDayPickerSelect` |
| Clear input khi invalid parse | KHÔNG clear — cho user tiếp tục gõ. Chỉ reset trên blur |

## Resources & References

- [shadcn DatePicker docs](https://www.shadcn.io/ui/date-picker) — composition pattern
- [react-day-picker Input Fields guide](https://github.com/gpbl/react-day-picker/blob/main/apps/website/docs/guides/input-fields.mdx) — sync pattern chính xác
- [date-fns parse/isValid/format](https://date-fns.org/) — API reference

## Unresolved Questions

1. **Date format**: Nên dùng `dd/MM/yyyy` hay `dd-MM-yyyy` cho input display? (Khuyến nghị `dd/MM/yyyy` — phổ biến nhất ở VN)
2. **Time support**: Có cần thêm time picker trong tương lai? Nếu có, nên thiết kế API cho phép extend (nhưng YAGNI — không implement bây giờ)
3. **Date range picker**: `leave-new-page.tsx` dùng 2 DatePicker riêng lẻ (start + end). Có cần component DateRangePicker kết hợp? (YAGNI — implement khi cần)