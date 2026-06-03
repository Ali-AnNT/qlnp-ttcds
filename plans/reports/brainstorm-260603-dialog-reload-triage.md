# Báo cáo Brainstorm: Sự cố Dialog Reload Trang — Phân tích Triệt để

**Ngày**: 2026-06-03  
**Phạm vi**: Sửa triệt để (Phương án A: 5 lớp phòng thủ)  
**Trạng thái**: Đã xác minh, chờ triển khai  

---

## 1. Tóm tắt Vấn đề

Khi người dùng bật/tương tác dialog trong SPA, trang web bị reload toàn bộ. Đã xác định 2 nguyên nhân gốc (crash render + form submit mặc định) và **sửa cả 2**. Báo cáo này mở rộng phạm vi: phát hiện thêm lỗi crash cùng loại + nguy cơ tiềm ẩn.

---

## 2. Sửa lỗi đã xác minh ✅

| # | File | Sửa đổi | Trạng thái |
|---|------|---------|------------|
| 1 | `dept-detail-dialog.tsx:23` | `data?.dept.tenDonVi` → `data?.dept?.tenDonVi \|\| ""` | ✅ Đã áp dụng |
| 2 | `button.tsx:40` | Thêm `type = "button"` mặc định | ✅ Đã áp dụng |
| 3 | `App.tsx:9` | ErrorBoundary đã bật (không bị comment) | ✅ Đang hoạt động |

---

## 3. Phát hiện Mới — Lỗi Crash Cùng Loại 🔴

### 3.1 CRITICAL: `reports-page.tsx:41-43` — `.length`/`.substring()` trên `null`

```tsx
// DepartmentDto.tenDonVi là `string | null`
const label =
  d.tenDonVi.length > 15      // 💥 TypeError nếu tenDonVi === null
    ? d.tenDonVi.substring(0, 15) + "..."  // 💥 cùng lỗi
    : d.tenDonVi;
```

**Mức độ**: CRITICAL — cùng loại lỗi với lỗi gốc (TypeError trên null → crash render → reload trang). Xảy ra khi bất kỳ phòng ban nào có `tenDonVi = null`.

**Sửa đề xuất**:
```tsx
const label = (d.tenDonVi || "").length > 15
  ? (d.tenDonVi || "").substring(0, 15) + "..."
  : d.tenDonVi || "";
```

### 3.2 MEDIUM: Các vị trí hiển thị `null` thành chuỗi "null"

| File | Dòng | Mã | Rủi ro |
|------|------|-----|--------|
| `violation-dept-table.tsx` | 42 | `{d.dept.tenDonVi}` | Hiện "null" |
| `violation-chart.tsx` | 77 | `name: d.dept.tenDonVi` | Label "null" |
| `dept-summary-table.tsx` | 34 | `{d.tenDonVi}` | Hiện "null" |
| `calendar-page.tsx` | 39 | `{d.tenDonVi}` | Hiện "null" |

**Sửa**: Thêm `(value || "")` hoặc `?? ""` tại mỗi vị trí.

---

## 4. Phát hiện Mới — Nút `<button>` Thiếu `type` ⚠️

10 nút `<button>` gốc + 3 sidebar component thiếu `type="button"`. Hiện không nằm trong `<form>` nên không gây lỗi, nhưng là **nguy cơ tiềm ẩn** nếu code thay đổi.

### 4.1 Native `<button>` cần thêm `type="button"`

| File | Dòng | Mô tả |
|------|------|--------|
| `error-boundary.tsx` | 40 | Nút "Thử lại" |
| `sidebar.tsx` (SidebarRail) | 249 | Toggle sidebar |
| `app-sidebar.tsx` | 125 | Nút đóng sidebar (X) |
| `app-sidebar.tsx` | 145 | Nút mở rộng menu |
| `app-sidebar.tsx` | 215 | Nút đăng xuất |
| `dept-summary-table.tsx` | 36 | Link tổng CB |
| `dept-summary-table.tsx` | 44 | Link tổng ngày phép |

### 4.2 Sidebar component cần thêm `type="button"` mặc định

| Component | Dòng | Pattern |
|-----------|------|---------|
| `SidebarGroupAction` | 375-394 | `asChild ? Slot : "button"` — thiếu `type` |
| `SidebarMenuButton` | 436-475 | `asChild ? Slot : "button"` — thiếu `type` |
| `SidebarMenuAction` | 477-506 | `asChild ? Slot : "button"` — thiếu `type` |

**Sửa đề xuất**: Thêm `type = "button"` mặc định cho cả 3 component, giống pattern `Button.tsx`.

---

## 5. Phát hiện Mới — Không có `errorElement` cho Routes ⚠️

`router.tsx` định nghĩa 9 route con nhưng **không có `errorElement`** nào. ErrorBoundary toàn app (`App.tsx`) bắt lỗi nhưng hiển thị fallback cho **toàn bộ app**, không phải riêng route bị lỗi.

**Hệ quả**: Lỗi trong route `/thong-ke-bao-cao` → toàn bộ app hiển thị fallback → mất sidebar, mất điều hướng.

**Sửa đề xuất**: Thêm `ErrorBoundary` làm `errorElement` cho layout route, giữ sidebar hiển thị và chỉ hiện fallback cho nội dung route.

---

## 6. Kế hoạch Triển khai — Phương án A

### Phase 1: Sửa lỗi crash CRITICAL
- [ ] `reports-page.tsx`: Thêm null guard cho `tenDonVi.length` và `.substring()`

### Phase 2: Cố định native `<button>` 
- [ ] `error-boundary.tsx`: Thêm `type="button"` cho nút "Thử lại"
- [ ] `sidebar.tsx` (SidebarRail): Thêm `type="button"` 
- [ ] `app-sidebar.tsx`: Thêm `type="button"` cho 3 nút (đóng, mở rộng, đăng xuất)
- [ ] `dept-summary-table.tsx`: Thêm `type="button"` cho 2 nút

### Phase 3: Cố định sidebar component pattern
- [ ] `SidebarGroupAction`: Thêm `type = "button"` mặc định (như Button.tsx)
- [ ] `SidebarMenuButton`: Thêm `type = "button"` mặc định
- [ ] `SidebarMenuAction`: Thêm `type = "button"` mặc định

### Phase 4: Thêm route-level error handling
- [ ] Tạo `RouteErrorBoundary` component cho React Router
- [ ] Thêm `errorElement` cho layout route trong `router.tsx`

### Phase 5: Sửa UI bug — null hiển thị thành "null"
- [ ] Các file: `violation-dept-table.tsx`, `violation-chart.tsx`, `dept-summary-table.tsx`, `calendar-page.tsx`

---

## 7. Rủi ro & Đánh đổi

| Rủi ro | Mức độ | Giảm thiểu |
|--------|--------|------------|
| Thay đổi sidebar components có thể ảnh hưởng usage hiện có | Thấp | `type="button"` chỉ override khi không truyền `type` prop — tương thích ngược |
| Route-level error boundary cần test kỹ | Trung bình | Chỉ thêm cho layout route, không thay đổi logic route |
| `tenDonVi ?? ""` có thể ẩn dữ liệu null thực | Thấp | API nên không trả null, nhưng guard an toàn hơn crash |

---

## 8. Câu hỏi chưa giải quyết

1. Có nên thêm `null` guard cho `EmpDetailDialog` title (`data?.userName`) — hiện an toàn do `?.` nhưng pattern dễ hỏng?
2. Route-level error boundary nên hiển thị fallback giống toàn-app (có nút "Thử lại") hay khác (ví dụ: chỉ nội dung với nút quay lại)?
3. Có nên thêm type guard hoặc assertion function cho `DepartmentDto.tenDonVi` để bắt lỗi ở compile time thay vì runtime?