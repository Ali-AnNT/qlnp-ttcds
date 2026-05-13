---
phase: 10
title: "Testing & Documentation"
status: pending
priority: P2
effort: "2h"
dependencies: ["9"]
---

# Phase 10: Testing & Documentation

## Overview

Integration tests + update project docs.

## Related Code Files

| Action | File |
|--------|------|
| Create | `packages/api/Tests/` |
| Modify | `README.md` |
| Modify | `docs/code-standards.md` |
| Modify | `docs/system-architecture.md` |
| Modify | `docs/project-roadmap.md` |

## Implementation Steps

1. Tạo test project (xUnit + WebApplicationFactory)
2. Test: GET leave-types, POST leave-requests, approval flow, role filtering
3. Update docs: README quick start, code-standards EF Core patterns, system-architecture actual TO-BE, roadmap status
4. Final: `dotnet test` + `bun run build`

## Success Criteria

- [ ] Integration tests pass (≥70% coverage)
- [ ] docs/ updated
- [ ] README has API + Frontend setup guide
- [ ] `dotnet test` pass
- [ ] `bun run build` pass
