namespace QLNP.Api.Features.Reports.Export;

internal static class StatusLabels {
    private static readonly Dictionary<string, string> _map = new() {
        ["pending"] = "Chờ duyệt",
        ["approved"] = "Đã duyệt",
        ["rejected"] = "Từ chối",
        ["cancelled"] = "Đã hủy"
    };

    public static string ToVietnamese(string status)
        => _map.GetValueOrDefault(status, status);
}
