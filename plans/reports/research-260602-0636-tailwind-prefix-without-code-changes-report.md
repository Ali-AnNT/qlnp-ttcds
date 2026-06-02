# Research Report: Tailwind CSS Prefix/Scope Không Cần Sửa Code Cũ

**Ngày:** 2026-06-02
**Scope:** Các phương pháp isolate Tailwind CSS khi nhúng app vào app khác, không cần sửa ~988 className instances

## Tóm Tắt

Có **3 phương pháp chính** scope Tailwind CSS mà không cần đổi code cũ. Phương pháp tốt nhất cho project QLNP là **`postcss-prefix-selector` + `tailwindcss-scoped-preflight`** — chỉ cần wrap app trong 1 div, không sửa bất kỳ class name nào.

## So Sánh Các Phương Pháp

| Phương Pháp | Sửa code cũ? | Scope preflight? | Phức tạp | Khuyến nghị |
|---|---|---|---|---|
| **`postcss-prefix-selector`** | ❌ Không | ✅ Có (với transform) | Thấp | ⭐ **Best** |
| **`important: '.root'` + scoped-preflight** | ❌ Không | ✅ Có | Thấp | ⭐ Tốt |
| **`postcss-nested` + nested @tailwind** | ❌ Không | ✅ Có | Thấp | OK |
| **Tailwind `prefix: "qlnp"`** | ✅ Có (~988 chỗ) | ❌ Không (trừ khi disable) | Cao | ❌ Không khuyến nghị cho case này |

## Phương Pháp 1: `postcss-prefix-selector` ⭐ Best

### Nguyên lý

PostCSS plugin thêm parent selector vào **mọi** CSS rule mà Tailwind generate. Code HTML giữ nguyên, chỉ CSS output thay đổi.

```css
/* Trước (CSS output gốc) */
.bg-primary { background-color: hsl(var(--primary)); }
.text-sm { font-size: 0.875rem; }

/* Sau (CSS output có prefix) */
.qlnp-app .bg-primary { background-color: hsl(var(--primary)); }
.qlnp-app .text-sm { font-size: 0.875rem; }
```

### Cài đặt

```bash
pnpm add -D postcss-prefix-selector
```

### `postcss.config.js`

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    "postcss-prefix-selector": {
      prefix: ".qlnp-app",
      transform(prefix, selector, prefixedSelector, filePath, rule) {
        // Chỉ scope Tailwind-generated rules (không ảnh hưởng third-party CSS)
        if (!rule?.raws?.tailwind) return selector;
        
        // Xử lý html/body selectors
        if (selector.match(/^(html|body)/)) {
          return selector.replace(/^([^\s]*)/, `$1 ${prefix}`);
        }
        return prefixedSelector;
      },
    },
  },
};
```

### Wrap App

```tsx
// src/app/App.tsx hoặc src/main.tsx
<div className="qlnp-app">
  <App />
</div>
```

### Ưu điểm
- **Không sửa bất kỳ className nào** trong ~81 files
- Scope cả preflight/reset styles
- `transform` function cho phép fine-grained control
- Battle-tested, được dùng rộng rãi cho widget/embedding scenarios

### Nhược điểm
- Tăng specificity (+1 class selector) — thường không vấn đề
- Cần test kỹ transform function với `html`/`body`/`:root` selectors

## Phương Pháp 2: `important` Selector + `tailwindcss-scoped-preflight`

### Nguyên lý

Tailwind v3 có built-in `important` option dùng selector thay vì `!important`. Kết hợp với plugin scope preflight.

```js
// tailwind.config.ts
export default {
  important: '.qlnp-app',
  plugins: [
    // ...existing plugins
  ],
}
```

### Cài đặt

```bash
pnpm add -D tailwindcss-scoped-preflight
```

### Config

```ts
// tailwind.config.ts
import { scopedPreflightStyles, isolateInsideOfContainer } from 'tailwindcss-scoped-preflight';

export default {
  important: '.qlnp-app.qlnp-preflight',
  plugins: [
    tailwindcssAnimate,
    scopedPreflightStyles({
      isolationStrategy: isolateInsideOfContainer('.qlnp-preflight'),
    }),
  ],
} satisfies Config;
```

### Wrap App

```tsx
<div className="qlnp-app qlnp-preflight">
  <App />
</div>
```

### Ưu điểm
- Built-in Tailwind feature, không cần PostCSS plugin riêng
- Scope cả utility classes và preflight
- Ít config hơn phương pháp 1

### Nhược điểm
- `important` selector có thể cause specificity issues với third-party CSS
- Plugin `tailwindcss-scoped-preflight` ít phổ biến hơn `postcss-prefix-selector`

## Phương Pháp 3: `postcss-nested` + Nested `@tailwind`

### Nguyên lý

Wrap tất cả `@tailwind` directives trong 1 CSS selector, dùng `postcss-nested` để nest.

```css
/* src/index.css */
.qlnp-app {
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
}
```

```js
// postcss.config.js
export default {
  plugins: {
    "postcss-nested": {},  // Phải TRƯỚC tailwindcss
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### Ưu điểm
- Đơn giản nhất — chỉ sửa CSS, wrap bằng 1 selector
- Không cần thêm dependency ngoài `postcss-nested`

### Nhược điểm
- ⚠️ Một số version Tailwind mới có thể warn về nested `@tailwind` rules
- Không handle `html`/`body`/`:root` selectors tự động
- CSS custom properties (`:root { --primary: ... }`) vẫn global trừ khi xử lý thủ công

## Khuyến Nghị Cho Project QLNP

### Chọn: Phương Pháp 1 (`postcss-prefix-selector`)

**Lý do:**
1. **Zero code changes** — không sửa 1 dòng nào trong 81 component files
2. Chỉ cần: 1 npm install + sửa `postcss.config.js` + wrap app trong 1 div
3. Scope đầy đủ: utilities, components, preflight/reset, CSS variables
4. `transform` function cho phép bỏ qua non-Tailwind CSS (quan trọng nếu có third-party styles)
5. Được recommend chính thức trong [Tailwind Discussion #11922](https://github.com/tailwindlabs/tailwindcss/discussions/11922) cho embedded widget scenario

### Implementation Steps

1. `pnpm add -D postcss-prefix-selector` (trong `packages/web`)
2. Sửa `packages/web/postcss.config.js` — thêm plugin với `prefix: ".qlnp-app"` và transform function
3. Wrap app root trong `<div className="qlnp-app">` (1 dòng duy nhất trong `App.tsx` hoặc `main.tsx`)
4. Test: `pnpm dev` + kiểm tra visual
5. Build: `pnpm build` + verify CSS output có `.qlnp-app` prefix

### Ảnh hưởng so với plan cũ (prefix migration)

| Aspect | Plan cũ (prefix: "qlnp") | Plan mới (postcss-prefix-selector) |
|--------|--------------------------|-------------------------------------|
| Files cần sửa | ~81 files | 2-3 files |
| Code changes | ~988 className instances | 1 div wrapper |
| Risk | High (missed class = broken style) | Low (CSS transform is automatic) |
| Maintenance | Mỗi component mới phải nhớ thêm `qlnp:` | Không thay đổi workflow |
| shadcn/ui updates | Phải re-prefix mỗi lần add component | Không ảnh hưởng |
| Testing | Visual test toàn bộ 81 files | Visual test 1 lần |
| Rollback | git revert ~81 files | Remove 2 lines config |

## Unresolved Questions

1. **`postcss-prefix-selector` vs `tailwindcss-scoped-preflight`**: Nên dùng cái nào? → Khuyến nghị `postcss-prefix-selector` vì phổ biến hơn, control tốt hơn
2. **CSS custom properties scope**: `:root { --primary: ... }` có cần xử lý riêng không? → `transform` function cần check, có thể cần đổi `:root` thành `.qlnp-app`
3. **Third-party CSS**: Radix UI, recharts inject CSS — có cần scope không? → Radix dùng data attributes (không CSS), recharts có CSS riêng → check `transform` function

## Sources

- [postcss-prefix-selector - npm](https://www.npmjs.com/package/postcss-prefix-selector)
- [Tailwind Discussion: Scoped Styling for Embedded Widgets](https://github.com/tailwindlabs/tailwindcss/discussions/11922)
- [Tailwind Discussion: Define parent class without prefix](https://github.com/tailwindlabs/tailwindcss/discussions/2446)
- [tailwindcss-scoped-preflight - GitHub](https://github.com/Roman86/tailwindcss-scoped-preflight/)
- [StackOverflow: How to scope Tailwind CSS](https://stackoverflow.com/questions/63761312/how-to-scope-tailwind-css)
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Tailwind v4 Prefix Discussion](https://github.com/tailwindlabs/tailwindcss/discussions/15807)