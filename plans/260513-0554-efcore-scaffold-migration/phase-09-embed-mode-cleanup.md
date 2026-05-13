---
phase: 9
title: "Embed Mode & Cleanup"
status: pending
priority: P2
effort: "2h"
dependencies: ["8"]
---

# Phase 9: Embed Mode & Cleanup

## Overview

iframe detection + postMessage JWT exchange + cleanup Supabase.

## Related Code Files

| Action | File |
|--------|------|
| Modify | `packages/web/src/App.tsx` |
| Modify | `packages/web/src/contexts/AuthContext.tsx` |
| Delete | `packages/web/src/integrations/` |
| Modify | `packages/web/package.json` |

## Implementation Steps

1. iframe detection: `window.self !== window.top`
2. register postMessage listener for `{ type: "auth", token }`
3. auto exchange token → login
4. Remove `@supabase/supabase-js` from deps
5. Verify zero supabase references

## Success Criteria

- [ ] iframe detection hoạt động
- [ ] postMessage → auto login
- [ ] Package.json không có supabase
- [ ] `grep -r "supabase" . --exclude-dir=node_modules` → 0
- [ ] `bun run build` success
