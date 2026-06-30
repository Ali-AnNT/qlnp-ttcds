# Journal — LeaveTypes List Search & IncludeInactive

**Date:** 2026-06-30
**Plan:** 260630-0234-leavetypes-list-search-and-deactive
**Branch:** fix/leave-types-update-full-object
**Status:** Done

## What Changed

Backend `ListLeaveTypesEndpoint` thêm search theo `q` (Name + Code, case-insensitive) và `includeInactive` query param (bool, default false). Frontend: API client + hook + UI search box + toggle "hiện đã tắt".

## Key Decisions

- Backward-compatible: omit params → behavior cũ (chỉ active records)
- Search server-side qua `Contains` + `ToLower` — KISS, data nhỏ, không cần full-text search
- No pagination — data nhỏ, YAGNI
- queryKey `["leave-types", {q, includeInactive}]` cho TanStack Query caching

## Impact

- Key files: ListLeaveTypesEndpoint.cs, leave-types.api.ts, use-leave-types.ts, leave-type-manager.tsx
- Blocked by 260630-0220 (leaveTypesApi.update fix) — same files, sequential implementation
- No breaking changes to public contract ngoài thêm optional params

## Lessons

- Full-stack feature từ BE endpoint → FE API → hook → UI chạy smooth khi plan rõ ràng
- includeInactive flag cho phép toggle deactivated items mà không cần trang riêng
