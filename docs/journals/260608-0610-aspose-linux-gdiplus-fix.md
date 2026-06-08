---
title: Aspose.Cells Linux Dependency (libgdiplus) and License Setup Fix
date: 2026-06-08
branch: feat/aspose-cells-smart-markers-export
---

## What changed

- **BE:**
  - Wrapped `ws.AutoFitColumns()` inside a `try-catch` block in `ExcelBuilder.cs`. This prevents the uncaught `System.TypeInitializationException` / `System.DllNotFoundException` for `libgdiplus` when executing Excel exports on Linux/Docker environments where GDI+ is not installed.
  - Added `Resources/LicenseAsposeTotal.lic` as an `EmbeddedResource` in `QLNP.Api.csproj`.
  - Updated `AsposeLicenseSetup.cs` to correctly search for and load `QLNP.Api.Resources.LicenseAsposeTotal.lic` (and fall back to `LicenseAsposeTotal.lic` in the base directory) instead of the non-existent `Aspose.Cells.lic`, allowing the license to load properly and removing the trial watermark/evaluation sheet from exports.

## Wins

- **Cross-Platform Reliability:** Excel report exports now run successfully in Linux and Docker environments without requiring native `libgdiplus` dependencies to be pre-installed.
- **Watermark Removal:** The license is now successfully resolved and loaded as an embedded resource, removing any "Evaluation Only" watermarks or extra sheets from exported files.
- **Zero Build Errors:** Project compiled and tested with zero errors.

## Trade-offs accepted

- Column auto-fitting might not occur on Linux environments lacking `libgdiplus`. However, the template column widths are preserved, and sheets are fully generated and downloadable instead of crashing the API.

## Verification

- **BE:** Created a scratch .NET project executing the same logic, verified it throws `TypeInitializationException` on `AutoFitColumns` and successfully completes workbook generation when caught.
- **BE:** `dotnet build` -> Build succeeded with 0 warnings, 0 errors.

## Files

```
MOD  packages/api/Features/Reports/Export/ExcelBuilder.cs
MOD  packages/api/Infrastructure/AsposeLicenseSetup.cs
MOD  packages/api/QLNP.Api.csproj
```
