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
            Console.WriteLine($"[Aspose] License not set: {ex.Message}");
        }
    }
}
