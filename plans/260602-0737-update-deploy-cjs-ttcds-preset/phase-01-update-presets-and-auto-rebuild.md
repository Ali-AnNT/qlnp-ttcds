---
phase: 1
title: Implement deploy.cjs changes
status: done
effort: 30m
dependencies: []
---

# Phase 1: Implement deploy.cjs changes

## Overview

Apply 4 thay đổi trong `scripts/deploy.cjs`: (1) replace preset map, (2) fix `checkDistExists` path, (3) thêm `ensureDistBuilt` với default-rebuild, (4) cảnh báo unknown preset. Update log title.

## Requirements

- **Functional:**
  - `node scripts/deploy.cjs` (no args) → auto target `ttcds` → UNC `\\webproduction\WEB\TTCDS\Portal\DesktopModules\MVC\QuanLyNghiPhep\GUI\Scripts\build`.
  - Nếu `packages/web/dist` thiếu HOẶC `DEPLOY_SKIP_REBUILD != '1'` → xóa `dist` rồi `pnpm --filter @qlnp/web build`.
  - Nếu `DEPLOY_SKIP_REBUILD=1` → giữ `dist` cũ, chỉ build khi thiếu.
  - Truyền preset không tồn tại → in warning, tiếp tục với default (không crash).
- **Non-functional:**
  - Không phá vỡ PowerShell/smbclient backend (đã path-agnostic).
  - Không phá env-var override (`DEPLOY_REMOTE_PATH`, `DEPLOY_LOCAL_PATH`).

## Architecture

Không thay đổi kiến trúc — chỉ refactor nội bộ `deploy.cjs`. Data flow không đổi:

```
argv / DEPLOY_TARGET → getDeployTarget() → REMOTE_PATHS[normalized]
                                      ↓
                          ensureDistBuilt() (new)
                                      ↓
                          checkDistExists() (path fixed)
                                      ↓
                          ensureDeploymentTools()
                                      ↓
              deployWithPowerShell() | deployWithSMBClient()
```

## Related Code Files

- **Modify:** `/home/vif/qlnp-ttcds/scripts/deploy.cjs`
  - Lines 16-21: preset constants
  - Lines 23-27: `getDeployTarget()` (thêm warning)
  - Lines 288-295: `checkDistExists()` (fix path)
  - Lines 519-523: log title
  - Insert new function `ensureDistBuilt()` (sau `checkDistExists`)
  - Replace `checkDistExists()` call in `deploy()` with `ensureDistBuilt()`
- **Create:** none
- **Delete:** none

## Implementation Steps

### Step 1: Replace preset constants (lines 16-21)

```js
const DEFAULT_DEPLOY_TARGET = 'ttcds';
const DEFAULT_REMOTE_PATH = '\\\\webproduction\\WEB\\TTCDS\\Portal\\DesktopModules\\MVC\\QuanLyNghiPhep\\GUI\\Scripts\\build';
const REMOTE_PATHS = {
  ttcds: DEFAULT_REMOTE_PATH
};
```

### Step 2: Add unknown-preset warning in `getDeployTarget()` (lines 23-27)

```js
function getDeployTarget() {
  const target = process.env.DEPLOY_TARGET || process.argv[2] || DEFAULT_DEPLOY_TARGET;
  const normalized = target.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!REMOTE_PATHS[normalized]) {
    log(`Warning: preset '${target}' (normalized: '${normalized}') is not registered. Available: ${Object.keys(REMOTE_PATHS).join(', ')}. Falling back to default '${DEFAULT_DEPLOY_TARGET}'.`, 'yellow');
    return DEFAULT_DEPLOY_TARGET;
  }
  return normalized;
}
```

*Note:* Behavior đổi nhẹ — trước đây nếu preset không có, `resolveRemotePath` fallback về `DEFAULT_REMOTE_PATH` nhưng không warning. Giờ warning explicit + normalize key.

### Step 3: Fix `checkDistExists()` path (lines 288-295)

```js
function checkDistExists() {
  const distPath = path.join(PROJECT_ROOT, 'packages/web/dist');
  if (!fs.existsSync(distPath)) {
    log('Error: dist directory does not exist at packages/web/dist. Run "pnpm --filter @qlnp/web build" first.', 'red');
    process.exit(1);
  }
  return distPath;
}
```

*Reason:* Vite build trong `packages/web/package.json` (name `@qlnp/web`) output vào `packages/web/dist`, không phải `dist` ở root. Hiện tại script đang check sai → sẽ fail khi user chạy.

### Step 4: Add `ensureDistBuilt()` after `checkDistExists()`

```js
/**
 * Ensure packages/web/dist exists. Default behavior: force-rebuild
 * (remove then build) to guarantee fresh output. Opt-out via DEPLOY_SKIP_REBUILD=1
 * to keep existing dist and only build when missing.
 */
function ensureDistBuilt() {
  const distPath = path.join(PROJECT_ROOT, 'packages/web/dist');
  const forceRebuild = process.env.DEPLOY_SKIP_REBUILD !== '1';

  if (forceRebuild && fs.existsSync(distPath)) {
    log('Force rebuild: removing existing packages/web/dist...', 'yellow');
    fs.rmSync(distPath, { recursive: true, force: true });
  }

  if (!fs.existsSync(distPath)) {
    log('dist not found — running pnpm --filter @qlnp/web build...', 'yellow');
    const success = execCommand('pnpm --filter @qlnp/web build', { cwd: PROJECT_ROOT });
    if (!success) {
      log('Build failed. Aborting deployment.', 'red');
      process.exit(1);
    }
    log('Build completed.', 'green');
  }
  return distPath;
}
```

*Note:* `execCommand` đã có sẵn (line 102-109) — wrap `execSync` với `stdio: 'inherit'`, trả về boolean. Dùng được luôn.

### Step 5: Update `deploy()` to call `ensureDistBuilt()` (line 525)

```js
// Before:
const distPath = checkDistExists();

// After:
const distPath = ensureDistBuilt();
```

### Step 6: Update log title (line 520)

```js
// Before:
log('GIS Map - Unified Deployment', 'bright');

// After:
log('qlnp-ttcds - Unified Deployment', 'bright');
```

## Success Criteria

- [ ] `node scripts/deploy.cjs` (no args) in ra `Target preset: ttcds` và `Target: \\webproduction\WEB\TTCDS\Portal\DesktopModules\MVC\QuanLyNghiPhep\GUI\Scripts\build`.
- [ ] Khi `packages/web/dist` không tồn tại, script tự chạy `pnpm --filter @qlnp/web build` thành công.
- [ ] Khi `packages/web/dist` tồn tại (default), script xóa + rebuild lại.
- [ ] `DEPLOY_SKIP_REBUILD=1 node scripts/deploy.cjs` giữ `dist` cũ, không xóa.
- [ ] `node scripts/deploy.cjs ankhanh` in warning `preset 'ankhanh' is not registered`, fallback về `ttcds` (không crash).
- [ ] `DEPLOY_REMOTE_PATH` override vẫn hoạt động (đã có sẵn trong `resolveRemotePath`).
- [ ] Không còn reference `ankhanh` / `phuongbinhtrung` trong code.
- [ ] PowerShell/smbclient logic không bị đổi (`git diff` chỉ touch các vùng liệt kê ở Related Code Files).

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| `pnpm --filter @qlnp/web build` fail do network/cache issue | `execCommand` trả về false → script exit 1 với log rõ ràng. User chạy lại sau khi fix. |
| `fs.rmSync` xóa nhầm folder khác tên `dist` | Path cố định `packages/web/dist` dưới `PROJECT_ROOT` (không từ user input). Không có risk injection. |
| UNC path không accessible từ Linux container | Đã có sẵn logic `ensureDeploymentTools` + warning. User tự set `SMB_USER`/`SMB_PASS` hoặc dùng Windows. |
| User quen gõ `deploy.cjs ankhanh` từ history | Warning rõ ràng + fallback về default. Không crash. |
| Force-rebuild chậm (10-30s mỗi lần deploy) | Đây là yêu cầu explicit. Opt-out bằng `DEPLOY_SKIP_REBUILD=1` nếu cần nhanh. |

## Validation

Sau khi implement:

1. `node -c scripts/deploy.cjs` — syntax check.
2. `node scripts/deploy.cjs --help` không tồn tại, nhưng `node scripts/deploy.cjs` no-args sẽ fail ở bước deploy (không có SMB) — nhưng trước đó phải in được log đúng và build xong dist.
3. Verify `packages/web/dist/index.html` tồn tại sau khi chạy.
4. Verify warning hiển thị khi truyền preset cũ.
5. `git diff scripts/deploy.cjs` — chỉ diff trong phạm vi plan này, không lan sang logic khác.

## Next Steps

- Run `node scripts/deploy.cjs` trên máy có SMB credentials để smoke test end-to-end.
- Nếu thành công → commit theo `PROJECT_RULE.md` Git flow (branch → PR → dev).
- Có thể tái sử dụng `ensureDistBuilt` cho các web app deploy khác sau này.
