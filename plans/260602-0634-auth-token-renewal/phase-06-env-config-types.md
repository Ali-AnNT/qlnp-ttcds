---
phase: 6
title: "Env Config & Types"
status: completed
priority: P2
effort: "15m"
dependencies: []
---

# Phase 6: Env Config & Types

## Overview

Thêm `VITE_AUTH_RENEW_URL` vào env config và Vite type declarations. Phase này phải hoàn thành trước Phase 2 (Auth Renew API) vì Phase 2 sử dụng `import.meta.env.VITE_AUTH_RENEW_URL`.

## Requirements

- Functional: `VITE_AUTH_RENEW_URL` env var cho external auth renew endpoint
- Functional: Vite type declarations cho env vars
- Non-functional: Không breaking change cho existing env vars

## Architecture

```
.env.example                    vite-env.d.ts
├── VITE_API_URL (existing)    ├── ImportMetaEnv interface
├── VITE_DEV_MODE (existing)   │   ├── VITE_API_URL
└── VITE_AUTH_RENEW_URL (NEW)   │   ├── VITE_DEV_MODE
                                │   └── VITE_AUTH_RENEW_URL (NEW)
                                └── ImportMeta
```

## Related Code Files

- Modify: `.env.example`
- Modify: `packages/web/src/vite-env.d.ts`

## Implementation Steps

1. **`.env.example`** — Thêm dòng:
   ```
   VITE_AUTH_RENEW_URL=https://auth.example.com/renew
   ```

2. **`packages/web/src/vite-env.d.ts`** — Thêm type declarations:
   ```ts
   /// <reference types="vite/client" />

   interface ImportMetaEnv {
     readonly VITE_API_URL: string;
     readonly VITE_DEV_MODE: string;
     readonly VITE_AUTH_RENEW_URL: string;
   }

   interface ImportMeta {
     readonly env: ImportMetaEnv;
   }
   ```

## Success Criteria

- [ ] `.env.example` có `VITE_AUTH_RENEW_URL`
- [ ] `vite-env.d.ts` có type declarations cho cả 3 VITE_ vars
- [ ] `import.meta.env.VITE_AUTH_RENEW_URL` không báo TypeScript error
- [ ] Build thành công không có type errors