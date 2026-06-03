# Brainstorm Report — Update `scripts/deploy.cjs` cho QuanLyNghiPhep

**Date:** 2026-06-02 07:37
**Session:** brainstorm
**Status:** ✅ Approved — handoff to `/ck:plan`

---

## Problem Statement

`scripts/deploy.cjs` hiện chỉ support 2 preset cũ:
- `ankhanh` → `\\webproduction\web\TPTHUDUC\AnKhanh`
- `phuongbinhtrung` → `\\webproduction\WEB\TPTHUDUC\PhuongBinhTrung`

Cần thay thế hoàn toàn bằng 1 preset mới trỏ tới **QuanLyNghiPhep** portal (DNN DesktopModule) trên server `webproduction`:
- `\\webproduction\WEB\TTCDS\Portal\DesktopModules\MVC\QuanLyNghiPhep\GUI\Scripts\build`

Đồng thời thêm **auto-rebuild** (mặc định xóa `dist` cũ + build lại) để đảm bảo output luôn fresh.

---

## Yêu cầu đã chốt (Discovery Phase)

| # | Yêu cầu | Quyết định |
|---|---------|------------|
| 1 | Expected output | `scripts/deploy.cjs` đã cập nhật: 1 preset duy nhất `ttcds`, default deploy tới `\\webproduction\WEB\TTCDS\Portal\DesktopModules\MVC\QuanLyNghiPhep\GUI\Scripts\build`; tự rebuild `dist` trước khi copy. |
| 2 | Acceptance criteria | • `node scripts/deploy.cjs` (no args) → deploy `packages/web/dist` → UNC path mới.<br>• `packages/web/dist` bị xóa → script tự `pnpm build` lại.<br>• Preset cũ `ankhanh` / `phuongbinhtrung` đã được gỡ khỏi `REMOTE_PATHS`.<br>• `checkDistExists` check đúng path `packages/web/dist` (hiện đang check sai `dist` ở root). |
| 3 | Scope boundary (OUT) | Không quét/sweep reference preset cũ ở file khác (docs, README, .env.example, makefile).<br>Không thêm target mới vào makefile.<br>Không đổi PowerShell/smbclient logic. |
| 4 | Non-negotiable constraints | • Backward-compat: KHÔNG cần giữ preset cũ.<br>• Auto-rebuild: MẶC ĐỊNH BẬT (rebuild luôn, không chỉ build-khi-thiếu).<br>• Folder `GUI\Scripts\build` trên server giả định đã tồn tại — không tự tạo. |
| 5 | Touchpoints | Chỉ `scripts/deploy.cjs`. |

---

## Approach đã chốt

### Code changes trong `scripts/deploy.cjs`

**1. Dòng 16-21 — preset + default**
```js
const DEFAULT_DEPLOY_TARGET = 'ttcds';
const DEFAULT_REMOTE_PATH = '\\\\webproduction\\WEB\\TTCDS\\Portal\\DesktopModules\\MVC\\QuanLyNghiPhep\\GUI\\Scripts\\build';
const REMOTE_PATHS = {
  ttcds: DEFAULT_REMOTE_PATH
};
```

**2. Dòng 288-295 — `checkDistExists()` → check đúng path**
```js
function checkDistExists() {
  const distPath = path.join(PROJECT_ROOT, 'packages/web/dist');
  if (!fs.existsSync(distPath)) {
    log('Error: dist directory does not exist. Run "pnpm --filter @qlnp/web build" first.', 'red');
    process.exit(1);
  }
  return distPath;
}
```
*Lý do:* `vite build` output mặc định vào `packages/web/dist` (xác nhận qua `ls packages/web/dist/` và `makefile:43-45`). Script hiện đang check `dist` ở root → sai.

**3. Hàm mới `ensureDistBuilt()` — chèn trước `checkDistExists()`**
```js
function ensureDistBuilt() {
  const distPath = path.join(PROJECT_ROOT, 'packages/web/dist');
  // Mặc định: rebuild (xóa + build lại) để đảm bảo output fresh.
  // Opt-out: DEPLOY_SKIP_REBUILD=1 → chỉ build nếu dist thiếu.
  const forceRebuild = process.env.DEPLOY_SKIP_REBUILD !== '1';

  if (forceRebuild && fs.existsSync(distPath)) {
    log('Force rebuild: removing existing dist...', 'yellow');
    fs.rmSync(distPath, { recursive: true, force: true });
  }

  if (!fs.existsSync(distPath)) {
    log('dist not found — running pnpm build...', 'yellow');
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

**4. Hàm `getDeployTarget()` — log warning khi preset không tồn tại**
```js
function getDeployTarget() {
  const target = process.env.DEPLOY_TARGET || process.argv[2] || DEFAULT_DEPLOY_TARGET;
  const normalized = target.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!REMOTE_PATHS[normalized]) {
    log(`Warning: preset '${target}' (normalized: '${normalized}') is not registered. Available: ${Object.keys(REMOTE_PATHS).join(', ')}`, 'yellow');
  }
  return normalized;
}
```

**5. Trong `deploy()` — gọi `ensureDistBuilt()` thay cho `checkDistExists()`**

**6. Dòng 520 — đổi title log**
```js
log('qlnp-ttcds - Unified Deployment', 'bright');
```

### Không thay đổi
- PowerShell/smbclient logic (đã generic, path truyền qua param).
- `Ensure-RemoteDirectory` trong PS script — user đã chọn "folder đã tồn tại sẵn", nhưng PS hiện tại chỉ mkdir-khi-thiếu rồi tiếp tục (idempotent, không phá).
- `makefile` — không thêm target mới.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| `pnpm --filter @qlnp/web build` fail nếu tên package không đúng | Verify `packages/web/package.json` `name` field khi implement; fallback `cd packages/web && pnpm build` nếu filter không resolve. |
| UNC path không accessible từ Linux container (no smbclient / no creds) | Giữ nguyên logic `ensureDeploymentTools` + warning. User phải tự set `SMB_USER`/`SMB_PASS`. |
| `forceRebuild` xóa nhầm folder khác tên `dist` | `fs.rmSync` chỉ chạy trên `path.join(PROJECT_ROOT, 'packages/web/dist')` — path cố định, không phải user input. |
| Build mỗi lần deploy chậm (~10-30s) | Đây là yêu cầu explicit ("mặc định rebuild"). Opt-out bằng `DEPLOY_SKIP_REBUILD=1`. |

---

## Open Questions

1. **Package name chính xác:** Tôi chưa đọc `packages/web/package.json`. Cần verify field `name` là `@qlnp/web` hay tên khác trước khi implement filter. Nếu khác, dùng fallback `cd packages/web && pnpm build`.
2. **Remote folder `GUI\Scripts\build`:** Bạn khẳng định folder đã tồn tại trên server. Nếu chưa, copy sẽ fail (PS script sẽ exit 1 trong `Ensure-RemoteDirectory`). Không cần thay đổi code, nhưng cần confirm lại với admin server.

---

## Success Criteria

- [ ] `node scripts/deploy.cjs` chạy thành công end-to-end trên Linux (nếu có SMB creds) hoặc ít nhất build xong locally.
- [ ] File `packages/web/dist/index.html` xuất hiện sau auto-build.
- [ ] Log output hiển thị: `qlnp-ttcds - Unified Deployment`, `Target preset: ttcds`, `Target: \\webproduction\...\GUI\Scripts\build`.
- [ ] Khi truyền preset cũ (`ankhanh`) → in warning rõ ràng, không crash.
- [ ] `DEPLOY_SKIP_REBUILD=1` → bỏ qua bước xóa `dist`, chỉ build nếu thiếu.

---

## Next Steps

→ Handoff sang `/ck:plan` để tạo implementation plan chi tiết (sẽ check `package.json` tên thật + viết phase files).
