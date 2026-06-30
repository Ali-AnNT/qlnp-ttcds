using QLNP.Api.Shared.Domain;

namespace QLNP.Api.Features.Reports.Export;

internal static class ExportDataMapper {
    public static List<DetailRow> MapDetails(
        List<LeaveRequest> requests,
        Dictionary<long, (string hoTen, string? tenDonVi)> userLookup) {
        return requests.Select((r, i) => {
            var info = userLookup.GetValueOrDefault(r.UserId);
            return new DetailRow(
                Stt: i + 1,
                HoTen: info.hoTen,
                TenDonVi: info.tenDonVi ?? "",
                LeaveType: r.LeaveType?.Name ?? "",
                FromDate: r.StartDate.ToString("dd/MM/yyyy"),
                ToDate: r.EndDate.ToString("dd/MM/yyyy"),
                TotalDays: r.TotalDays,
                Status: StatusLabels.ToVietnamese(r.Status)
            );
        }).ToList();
    }

    public static (List<EmployeeLeaveRow>? empLeaves, List<DepartmentRow>? depts, List<SummaryRow>? summary)
        MapGrouped(List<LeaveRequest> requests, string period,
            Dictionary<long, (string hoTen, string? tenDonVi)> userLookup) {
        if (period == "none") return (null, null, null);

        var groups = GroupByPeriod(requests, period);

        var empLeaves = groups
            .SelectMany(g => g.Items.GroupBy(it => new {
                HoTen = userLookup.GetValueOrDefault(it.UserId).hoTen,
                LeaveType = it.LeaveType?.Name ?? ""
            }).Select(ig => new EmployeeLeaveRow(
                Period: g.Key,
                HoTen: ig.Key.HoTen,
                LeaveType: ig.Key.LeaveType,
                TotalDays: ig.Sum(x => x.TotalDays)
            )))
            .OrderBy(x => x.Period).ThenBy(x => x.HoTen)
            .ToList();

        var depts = groups
            .SelectMany(g => g.Items.GroupBy(it => userLookup.GetValueOrDefault(it.UserId).tenDonVi ?? "")
                .Select(dg => new DepartmentRow(
                    Period: g.Key,
                    TenDonVi: dg.Key,
                    EmployeeCount: dg.Select(x => x.UserId).Distinct().Count(),
                    TotalDays: dg.Sum(x => x.TotalDays)
                )))
            .OrderBy(x => x.Period).ThenBy(x => x.TenDonVi)
            .ToList();

        var summary = groups
            .Select(g => new SummaryRow(
                Period: g.Key,
                EmployeeCount: g.Items.Select(x => x.UserId).Distinct().Count(),
                TotalDays: g.Items.Sum(x => x.TotalDays)
            ))
            .OrderBy(x => x.Period)
            .ToList();

        return (empLeaves, depts, summary);
    }

    private static List<PeriodGroup> GroupByPeriod(List<LeaveRequest> requests, string period)
        => requests.GroupBy(r => GetPeriodKey(r.StartDate, period))
            .Select(g => new PeriodGroup(g.Key, g.ToList()))
            .OrderBy(g => g.Key)
            .ToList();

    private static string GetPeriodKey(DateTime date, string period) => period switch {
        "month" => $"{date.Year}-{date.Month:D2}",
        "quarter" => $"{date.Year}-Q{(date.Month - 1) / 3 + 1}",
        "year" => $"{date.Year}",
        _ => throw new ArgumentException($"Invalid period: {period}")
    };
}

internal sealed record PeriodGroup(string Key, List<LeaveRequest> Items);
