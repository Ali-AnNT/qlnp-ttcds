using ClosedXML.Excel;
using QLNP.Api.Entities;

namespace QLNP.Api.Features.Reports.Export;

internal static class ExcelBuilder
{
    public static XLWorkbook BuildWorkbook(List<LeaveRequest> requests, string period)
    {
        var wb = new XLWorkbook();

        AddDetailSheet(wb, requests);

        if (period != "none")
        {
            var grouped = GroupByPeriod(requests, period);
            AddEmployeeLeaveTypeSheet(wb, grouped);
            AddDepartmentSheet(wb, grouped);
            AddSummarySheet(wb, grouped);
        }

        return wb;
    }

    private static void AddDetailSheet(XLWorkbook wb, List<LeaveRequest> requests)
    {
        var ws = wb.Worksheets.Add("Chi tiết");
        var headers = new[] { "STT", "Họ tên", "Phòng ban", "Loại phép", "Từ ngày", "Đến ngày", "Số ngày", "Trạng thái" };

        for (int i = 0; i < headers.Length; i++)
            ws.Cell(1, i + 1).Value = headers[i];

        for (int i = 0; i < requests.Count; i++)
        {
            var r = requests[i];
            var row = i + 2;
            ws.Cell(row, 1).Value = i + 1;
            ws.Cell(row, 2).Value = r.User?.HoTen ?? "";
            ws.Cell(row, 3).Value = r.User?.DonVi?.TenDonVi ?? "";
            ws.Cell(row, 4).Value = r.LeaveType?.Name ?? "";
            ws.Cell(row, 5).Value = r.StartDate.ToString("dd/MM/yyyy");
            ws.Cell(row, 6).Value = r.EndDate.ToString("dd/MM/yyyy");
            ws.Cell(row, 7).Value = r.TotalDays;
            ws.Cell(row, 8).Value = StatusLabels.ToVietnamese(r.Status);
        }

        ws.Column(7).Style.NumberFormat.Format = "0.0";
        FormatSheet(ws, requests.Count + 1);
    }

    private static void AddEmployeeLeaveTypeSheet(XLWorkbook wb, IEnumerable<PeriodGroup> groups)
    {
        var ws = wb.Worksheets.Add("Nhân viên - Loại phép");
        var headers = new[] { "Kỳ", "Họ tên", "Loại phép", "Tổng số ngày" };

        for (int i = 0; i < headers.Length; i++)
            ws.Cell(1, i + 1).Value = headers[i];

        var rows = groups
            .SelectMany(g => g.Items.GroupBy(it => new { HoTen = it.User?.HoTen ?? "", LeaveType = it.LeaveType?.Name ?? "" })
                .Select(ig => new
                {
                    Period = g.Key,
                    HoTen = ig.Key.HoTen,
                    LeaveType = ig.Key.LeaveType,
                    TotalDays = ig.Sum(x => x.TotalDays)
                }))
            .OrderBy(x => x.Period).ThenBy(x => x.HoTen)
            .ToList();

        for (int i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            var r = i + 2;
            ws.Cell(r, 1).Value = row.Period;
            ws.Cell(r, 2).Value = row.HoTen;
            ws.Cell(r, 3).Value = row.LeaveType;
            ws.Cell(r, 4).Value = row.TotalDays;
        }

        ws.Column(4).Style.NumberFormat.Format = "0.0";
        FormatSheet(ws, rows.Count + 1);
    }

    private static void AddDepartmentSheet(XLWorkbook wb, IEnumerable<PeriodGroup> groups)
    {
        var ws = wb.Worksheets.Add("Theo phòng ban");
        var headers = new[] { "Kỳ", "Phòng ban", "Số NV nghỉ", "Tổng số ngày" };

        for (int i = 0; i < headers.Length; i++)
            ws.Cell(1, i + 1).Value = headers[i];

        var rows = groups
            .SelectMany(g => g.Items.GroupBy(it => it.User?.DonVi?.TenDonVi ?? "")
                .Select(dg => new
                {
                    Period = g.Key,
                    Department = dg.Key,
                    EmployeeCount = dg.Select(x => x.UserId).Distinct().Count(),
                    TotalDays = dg.Sum(x => x.TotalDays)
                }))
            .OrderBy(x => x.Period).ThenBy(x => x.Department)
            .ToList();

        for (int i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            var r = i + 2;
            ws.Cell(r, 1).Value = row.Period;
            ws.Cell(r, 2).Value = row.Department;
            ws.Cell(r, 3).Value = row.EmployeeCount;
            ws.Cell(r, 4).Value = row.TotalDays;
        }

        ws.Column(4).Style.NumberFormat.Format = "0.0";
        FormatSheet(ws, rows.Count + 1);
    }

    private static void AddSummarySheet(XLWorkbook wb, IEnumerable<PeriodGroup> groups)
    {
        var ws = wb.Worksheets.Add("Tổng hợp");
        var headers = new[] { "Kỳ", "Tổng số NV nghỉ", "Tổng số ngày" };

        for (int i = 0; i < headers.Length; i++)
            ws.Cell(1, i + 1).Value = headers[i];

        var rows = groups
            .Select(g => new
            {
                Period = g.Key,
                EmployeeCount = g.Items.Select(x => x.UserId).Distinct().Count(),
                TotalDays = g.Items.Sum(x => x.TotalDays)
            })
            .OrderBy(x => x.Period)
            .ToList();

        for (int i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            var r = i + 2;
            ws.Cell(r, 1).Value = row.Period;
            ws.Cell(r, 2).Value = row.EmployeeCount;
            ws.Cell(r, 3).Value = row.TotalDays;
        }

        ws.Column(3).Style.NumberFormat.Format = "0.0";
        FormatSheet(ws, rows.Count + 1);
    }

    private static List<PeriodGroup> GroupByPeriod(List<LeaveRequest> requests, string period)
    {
        return requests
            .GroupBy(r => GetPeriodKey(r.StartDate, period))
            .Select(g => new PeriodGroup(g.Key, g.ToList()))
            .OrderBy(g => g.Key)
            .ToList();
    }

    private static string GetPeriodKey(DateTime date, string period) => period switch
    {
        "month" => $"{date.Year}-{date.Month:D2}",
        "quarter" => $"{date.Year}-Q{(date.Month - 1) / 3 + 1}",
        "year" => $"{date.Year}",
        _ => throw new ArgumentException($"Invalid period: {period}")
    };

    private static void FormatSheet(IXLWorksheet ws, int rowCount)
    {
        var headerRow = ws.Row(1);
        headerRow.Style.Font.Bold = true;
        headerRow.Style.Fill.BackgroundColor = XLColor.FromHtml("#F0F0F0");

        var colCount = ws.ColumnsUsed().Count();
        if (colCount > 0)
            ws.Range(1, 1, Math.Max(rowCount, 1), colCount).SetAutoFilter();

        ws.Columns().AdjustToContents();
    }
}

internal sealed record PeriodGroup(string Key, List<LeaveRequest> Items);