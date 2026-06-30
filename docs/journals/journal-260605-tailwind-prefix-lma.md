# Tailwind Prefix Migration — lma- prefix

**Date**: 2026-06-05 03:25
**Severity**: High
**Component**: packages/web — CSS isolation, Tailwind config, 85 source files
**Status**: Resolved (phases 1-3 done; phases 4-5 pending overall)
**Branch**: dev
**Plan**: plans/260605-0325-tailwind-prefix-lma

## What Happened

App embed vào app khác, CSS conflict. Thêm prefix Tailwind utility class để namespace. Bỏ postcss-prefix-selector. Red team phát hiện FATAL flaw: colon prefix (lma:) broken trong Tailwind v3 (issue #5016, maintainer closed won't-fix — `:` prefix collide với variant separator `:`). Chuyển sang dash prefix (lma-).

85 source files + CSS configs affected. ~556 static + 125 dynamic className occurrences + 9 CVA definitions + Calendar/Sonner classNames props.

## The Brutal Truth

Cay nhất: plan ban đầu định dùng lma: (colon). Red team bắt được bug parse Tailwind v3 TRƯỚC khi code. Nếu không có red team, đã migrate 85 file xong rồi mới phát hiện CSS không build. Lesson: validate framework version compatibility TRƯỚC khi plan migration lớn.

Trade-off đau: bỏ postcss-prefix-selector = mất full CSS isolation (scoped :root, scoped preflight, scoped utilities). Chỉ còn class-name namespacing. Global :root + preflight leak. Chấp nhận vì use case embed chỉ cần class namespacing đủ.

Mệt nhất: 85 file manual migration. cnat tool (v0.0.7, 1 star) quá low maturity — không tin. Manual 556 static + 125 dynamic occurrence. Script migrate-tailwind-prefix.mjs (329 dòng) hỗ trợ nhưng vẫn verify tay CVA, Calendar, Sonner, group/peer, arbitrary selectors.

## Technical Details

tailwind.config.ts: `prefix: "lma-"`.
Migration script scripts/migrate-tailwind-prefix.mjs xử lý:
- CVA variant definitions (buttonVariants, badgeVariants) prefixed đúng
- Calendar/Sonner classNames prop prefixed
- group/peer markers GIỮ NGUYÊN unprefixed (group/lma-foo sai)
- data-[state=...] variant prefix position: data-[state=open]:lma-bg-accent
- [&_...] arbitrary selectors: [&_svg]:lma-size-4
- tailwindcss-animate classes (fade-in, slide-in-from) prefixed
- opacity modifier: bg-muted/50 → lma-bg-muted/50
- Negative/important: -lma-mt-8, !lma-font-bold

eslint-plugin-tailwindcss ^3.18.3 add vào CI enforcement. Build compiles prefixed CSS output 63.92 kB.

Commit 1a38040: 108 files changed, 2743 insertions, 960 deletions.

## What We Tried

| Option | Prefix | TW Version | Risk | Decision |
|--------|--------|-----------|------|----------|
| A | lma- dash | v3 current | Medium | CHỌN |
| B | lma: colon | v4 upgrade | High v4 breaking | BỎ |
| C | Keep postcss-prefix-selector | N/A | None | BỎ |

cnat tool bỏ (low maturity). Manual-only + verify script.

## Root Cause Analysis

Root cause: chọn prefix format KHÔNG check framework version compat trước. Colon prefix tự nhiên nhìn "đẹp hơn" nhưng Tailwind v3 parser không support. Assumption "prefix string tùy ý" sai — prefix phải tránh ký tự `:` vì là variant separator. Red team validation interview câu hỏi đúng chỗ.

Thứ hai: trade-off isolation bị hiểu nhầm ban đầu. postcss-prefix-selector cho FULL isolation, prefix-only cho class namespacing. Plan gốc bán "migration" mà không nói rõ downgrade isolation. Validation interview buộc user acknowledge trade-off.

## Lessons Learned

- Validate framework version compat TRƯỚC plan migration lớn. Prefix format phụ thuộc Tailwind version. Đừng assume "string tùy ý".
- Red team interview giá trị ở chỗ bắt FATAL flaw trước khi code tốn công. 5 câu hỏi tiết kiệm re-migrate 85 file.
- Manual migration + script hỗ trợ > trust low-maturity tool. Script 329 dòng + verify tay CVA/Calendar/Sonner an toàn hơn cnat 1 star.
- eslint-plugin-tailwindcss enforcement CI: shadcn/ui mới add component unprefixed → lint block. Không thì prefix drift dần.
- Trade-off isolation phải explicit: "chấp nhận global :root + preflight leak" ghi rõ, user acknowledge, không hand-wave.
- Sentinel: dash prefix verbose hơn colon nhưng WORKS. Verbosity < broken build.

## Next Steps

- Phases 4-5 (CSS update, verify build) pending nhưng plan mark completed overall. Cần verify CSS output thực tế build pass end-to-end.
- Khi add shadcn/ui component mới: chạy lint, prefix enforcement bắt unprefixed class.
- Nếu sau này cần FULL isolation lại: cân nhắc upgrade Tailwind v4 (colon prefix support) hoặc re-add postcss-prefix-selector scoped .qlnp-app.
