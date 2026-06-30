# deploy.cjs Preset Cleanup: Stale Targets Replaced with ttcds

**Date**: 2026-06-02 07:37
**Severity**: Medium
**Component**: scripts/deploy.cjs
**Status**: Resolved

## What Happened

`deploy.cjs` shipped with 2 stale presets (`ankhanh`, `phuongbinhtrung`) for TPTHUDUC projects that no longer exist in production. The script also had a path bug: `checkDistExists()` checked `dist/` at repo root instead of `packages/web/dist/`, meaning it would always pass on a monorepo that happened to have a root `dist/` -- or fail silently when the actual web bundle was missing.

## The Brutal Truth

The old presets were dead code pointing at decommissioned servers. Anyone running `node scripts/deploy.cjs ankhanh` was deploying to a ghost. The `checkDistExists` path bug is worse -- it checked the wrong directory entirely. If someone had a root `dist/` from a previous build artifact, the script would happily deploy stale output without any warning. That is a silent data corruption vector in a deployment tool.

## Technical Details

- **Replaced**: `ankhanh` + `phuongbinhtrung` presets with single `ttcds` preset targeting `\\webproduction\WEB\TTCDS\Portal\DesktopModules\MVC\QuanLyNghiPhep\GUI\Scripts\build`
- **Fixed path**: `checkDistExists()` changed from `path.join(PROJECT_ROOT, 'dist')` to `path.join(PROJECT_ROOT, 'packages/web/dist')`
- **New function**: `ensureDistBuilt()` -- deletes then rebuilds `packages/web/dist` by default (runs `pnpm --filter @qlnp/web build:debug`); opt-out via `DEPLOY_SKIP_REBUILD=1`
- **Warning added**: unknown preset passed via CLI prints warning + falls back to `ttcds` instead of silently deploying to a dead target
- **Log title**: changed from "GIS Map - Unified Deployment" to "qlnp-ttcds - Unified Deployment"

## What We Tried

Single phase implementation. No rejected approaches. The plan was straightforward -- delete stale presets, fix the path, add auto-rebuild, add warning. No drama in execution.

## Root Cause Analysis

The presets were leftover from a previous project (GIS Map / TPTHUDUC) and never cleaned up when the repo was forked for qlnp-ttcds. The `checkDistExists` path bug was likely a copy-paste error from a non-monorepo template -- `dist` at root made sense before the monorepo restructuring, but nobody updated the deploy script when `packages/web` became the web package.

## Lessons Learned

- **Deployment scripts rot fast.** When a project changes direction (new org, new server, new module name), the deploy script is the last thing anyone thinks to update. Add a checklist item for deploy config on any infra migration.
- **Path assumptions in monorepos are dangerous.** Always verify dist output paths match what the build tool actually produces. Vite outputs to the package's own `dist/`, not the repo root.
- **Silent fallback is a bug, not a feature.** The old `resolveRemotePath` silently fell back to `DEFAULT_REMOTE_PATH` on unknown presets. That hides misconfiguration. Explicit warning + controlled fallback is better.
- **Auto-rebuild with opt-out beats manual steps.** `DEPLOY_SKIP_REBUILD=1` gives fast iteration while default-on ensures fresh deploys. 10-30 seconds of rebuild is cheap insurance against stale assets in production.

## Next Steps

- Smoke test `node scripts/deploy.cjs` on a machine with SMB credentials to verify end-to-end deployment to `webproduction`
- Consider sweeping docs/README/.env.example for references to `ankhanh` or `phuongbinhtrung` (out of scope for this plan, but still stale)
- `ensureDistBuilt` pattern could be extracted if more web apps are added to the monorepo later