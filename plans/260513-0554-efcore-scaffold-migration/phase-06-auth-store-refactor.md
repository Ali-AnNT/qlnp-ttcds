---
phase: 6
title: "Auth & Store Refactor"
status: completed
priority: P1
effort: "2h"
dependencies: ["5"]
---

# Phase 6: Auth & Store Refactor

## Overview

AuthContext: dual mode (gateway headers + embed postMessage). Zustand: API calls thay Supabase.

## Related Code Files

| Action | File |
|--------|------|
| Modify | `packages/web/src/contexts/AuthContext.tsx` |
| Modify | `packages/web/src/store/useStore.ts` |
| Delete | `packages/web/src/integrations/supabase/` |

## Implementation Steps

1. AuthContext simplify: không login function, chỉ token + user state
2. Embed listener: `window.addEventListener("message", handlePostMessage)`
3. Store: mỗi action → API module call
4. Error state từ API response
5. Xóa `integrations/supabase/`

## Success Criteria

- [ ] AuthContext hoạt động với gateway headers
- [ ] Embed postMessage listener hoạt động
- [ ] Store không import supabase
- [ ] `grep -r "supabase" src/` return 0
