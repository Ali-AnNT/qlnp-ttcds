---
phase: 1
title: Setup NuGet and License
status: in-progress
priority: P1
effort: 30min
dependencies: []
---

# Phase 1: Setup NuGet and License

## Overview

Add Aspose.Cells 20.11.0 NuGet package, configure embedded resource for Excel template, and create license setup placeholder in Program.cs.

## Requirements

- Functional: Aspose.Cells package installed, license initialized before any Workbook creation
- Non-functional: Graceful handling when license file is missing (eval mode watermark)

## Architecture

- `AsposeLicenseSetup.cs` — static helper to init license once at startup
- `Program.cs` — call `AsposeLicenseSetup.Initialize()` early in builder setup
- `QLNP.Api.csproj` — remove ClosedXML, add Aspose.Cells, configure embedded resources

## Related Code Files

- Modify: `packages/api/QLNP.Api.csproj`
- Modify: `packages/api/Program.cs`
- Create: `packages/api/Infrastructure/AsposeLicenseSetup.cs`

## Implementation Steps

1. **Remove ClosedXML from csproj**: Delete `<PackageReference Include="ClosedXML" Version="0.105.0" />` from `QLNP.Api.csproj`

2. **Add Aspose.Cells to csproj**: Add `<PackageReference Include="Aspose.Cells" Version="20.11.0" />`

3. **Add embedded resource config**: Add ItemGroup for Excel templates:
   ```xml
   <ItemGroup>
     <EmbeddedResource Include="Resources\ExcelTemplates\*.xlsx" />
   </ItemGroup>
   ```

4. **Create `AsposeLicenseSetup.cs`** in `Infrastructure/`:
   ```csharp
   using Aspose.Cells;

   namespace QLNP.Api.Infrastructure;

   internal static class AsposeLicenseSetup {
       public static void Initialize() {
           try {
               var license = new License();
               // Try embedded resource first, then file path
               var assembly = typeof(AsposeLicenseSetup).Assembly;
               using var stream = assembly.GetManifestResourceStream("QLNP.Api.Resources.Aspose.Cells.lic");
               if (stream is not null) {
                   license.SetLicense(stream);
               } else {
                   // Fallback: try file path
                   var licensePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Aspose.Cells.lic");
                   if (File.Exists(licensePath)) {
                       license.SetLicense(licensePath);
                   }
               }
           } catch (Exception ex) {
               // License not found — app runs in evaluation mode with watermark
               // TODO: Replace with proper logging when ILogger is available
               Console.WriteLine($"[Aspose] License not set: {ex.Message}");
           }
       }
   }
   ```

5. **Add license init to `Program.cs`**: Add `AsposeLicenseSetup.Initialize()` right after `var builder = WebApplication.CreateBuilder(args);` and before any service registrations

6. **Run `dotnet restore`** to verify package resolution

## Success Criteria

- [ ] `dotnet restore` succeeds with Aspose.Cells 20.11.0
- [ ] `dotnet build` succeeds without ClosedXML references
- [ ] `AsposeLicenseSetup.Initialize()` is called in Program.cs before any Workbook usage
- [ ] Graceful handling when license file is missing (no crash, eval watermark)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Aspose.Cells 20.11.0 not compatible with .NET 10 | Low | High | Test early with `dotnet build`; Aspose.Cells targets .NET Standard 2.0 which is compatible |
| License file naming mismatch in embedded resource | Medium | Medium | Use try/catch with fallback to file path; log warning |
| ClosedXML still referenced somewhere | Low | Medium | Global search for `ClosedXML` and `XLWorkbook` after removal |

## Next Steps

Proceed to Phase 2 after verifying `dotnet build` passes.
