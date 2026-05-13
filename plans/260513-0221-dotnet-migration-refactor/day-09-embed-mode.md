---
day: 9
phase: Embed Mode
status: pending
effort: 1 day
priority: P2
---

# Day 9: Standalone Embedding + Remove Supabase

## Context

**Depends on:** Day 8 (all pages refactored)
**Decision:** Gateway handles host auth → BE nhận user từ header, không cần postMessage token exchange

## Overview

Triển khai embed mode detection, iframe resize, postMessage navigation. Xóa hoàn toàn Supabase.

## Tasks

### 9.1 Embed Detection + Mode Switch

- [ ] `src/auth/auth-context.tsx` bổ sung:
  - Detect iframe: `window.self !== window.top`
  - Query param: `?embed=1`
  - `isEmbedded` state → bỏ login page, dùng `getMe()` không token
  - Gateway gửi user info qua header → BE trả về trong `/api/auth/me`

### 9.2 postMessage Bridge (Navigation + Resize only)

- [ ] `src/auth/host-bridge.ts`
  - App → Host messages:
    - `{ type: "APP_READY" }` — app đã khởi tạo xong
    - `{ type: "NAVIGATE", path: string }` — thông báo navigation cho host
    - `{ type: "RESIZE", height: number }` — yêu cầu host resize iframe
  - **Không cần** `SET_TOKEN` / `LOGOUT` từ host — Gateway handles auth

### 9.3 Dynamic Iframe Height

- [ ] `src/hooks/use-iframe-resize.ts`
  - Observe body height changes (ResizeObserver)
  - Gửi `RESIZE` message lên parent
  - Debounce 200ms tránh spam
  - Chỉ active khi `isEmbedded = true`

### 9.4 Remove Supabase Completely

- [ ] Gỡ package: `pnpm remove @supabase/supabase-js`
- [ ] Xóa thư mục `src/integrations/supabase/`
- [ ] Xóa `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` khỏi `.env`
- [ ] Thêm `VITE_API_URL` vào `.env.example`
- [ ] Chạy `pnpm build` kiểm tra không còn reference đến supabase

### 9.5 Update Index.html for Embed

- [ ] `index.html` — thêm meta tag cho embed mode
- [ ] CSS: body không margin/padding khi embed (class `embed-mode`)

### 9.6 IIS Integration Test

- [ ] Copy frontend build vào IIS folder
- [ ] Test embed: mở host page có iframe → app tự nhận user
- [ ] Test standalone: `bun run dev` → login bình thường

## Delivery

- [ ] App chạy standalone: login → JWT → hoạt động
- [ ] App chạy trong iframe: Gateway forwards auth → `getMe()` trả về user → hoạt động
- [ ] `pnpm build` không lỗi, không reference Supabase

## Files to Create

| File | Purpose |
|------|---------|
| `src/auth/host-bridge.ts` | postMessage: APP_READY, NAVIGATE, RESIZE |

## Files to Modify

| File | Changes |
|------|---------|
| `src/auth/auth-context.tsx` | Embed mode: iframe detect + getMe no-token |
| `src/hooks/use-iframe-resize.ts` | Dynamic iframe resize |
| `index.html` | Meta tags for embed |
| `.env.example` | Replace Supabase with VITE_API_URL |
