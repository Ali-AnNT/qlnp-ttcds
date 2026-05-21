namespace QLNP.Api.Features.Reports.Export;

using ClosedXML.Excel;
using QLNP.Api.Entities;

internal static class ExcelBuilder
{
    public static XLWorkbook BuildWorkbook(List<LeaveRequest> requests, string period)
    {
        var wb = new XLWorkbook();
        AddDetailSheet(wb, requests);

        if (period != "none")
        {
            var grouped = GroupByPeriod(requests, period).ToList();
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
        WriteHeaders(ws, headers);

        for (int i = 0; i < requests.Count; i++)
        {
            var r = requests[i];
            var row = i + 2;
            ws.Cell(row, 1).Value = i + 1;
            ws.Cell(row, 2).Value = r.User.HoTen ?? "";
            ws.Cell(row, 3).Value = r.User.DonVi?.TenDonVi ?? "";
            ws.Cell(row, 4).Value = r.LeaveType.Name;
            ws.Cell(row, 5).Value = r.StartDate;
            ws.Cell(row, 5).Style.NumberFormat.Format = "dd/MM/yyyy";
            ws.Cell(row, 6).Value = r.EndDate;
            ws.Cell(row, 6).Style.NumberFormat.Format = "dd/MM/yyyy";
            ws.Cell(row, 7).Value = r.TotalDays;
            ws.Cell(row, 7).Style.NumberFormat.Format = "0.0";
            ws.Cell(row, 8).Value = StatusLabels.ToVietnamese(r.Status);
        }

        FormatSheet(ws, requests.Count, headers.Length);
    }

    private static void AddEmployeeLeaveTypeSheet(XLWorkbook wb, List<PeriodGroup> groups)
    {
        var ws = wb.Worksheets.Add("Nhân viên - Loại phép");
        var headers = new[] { "Kỳ", "Họ tên", "Loại phép", "Tổng số ngày" };
        WriteHeaders(ws, headers);

        var rows = groups
            .SelectMany(g => g.Requests
                .GroupBy(r => new { r.User.HoTen, r.LeaveType.Name })
                .Select(grp => new
                {
                    Period = g.Key,
                    Employee = grp.Key.HoTen ?? "",
                    LeaveType = grp.Key.Name,
                    TotalDays = grp.Sum(r => r.TotalDays)
                }))
            .OrderBy(x => x.Period)
            .ThenBy(x => x.Employee)
            .ToList();

        for (int i = 0; i < rows.Count; i++)
        {
            var row = i + 2;
            ws.Cell(row, 1).Value = rows[i].Period;
            ws.Cell(row, 2).Value = rows[i].Employee;
            ws.Cell(row, 3).Value = rows[i].LeaveType;
            ws.Cell(row, 4).Value = rows[i].TotalDays;
            ws.Cell(row, 4).Style.NumberFormat.Format = "0.0";
        }

        FormatSheet(ws, rows.Count, headers.Length);
    }

    private static void AddDepartmentSheet(XLWorkbook wb, List<PeriodGroup> groups)
    {
        var ws = wb.Worksheets.Add("Theo phòng ban");
        var headers = new[] { "Kỳ", "Phòng ban", "Số NV nghỉ", "Tổng số ngày" };
        WriteHeaders(ws, headers);

        var rows = groups
            .SelectMany(g => g.Requests
                .GroupBy(r => r.User.DonVi?.TenDonVi ?? "")
                .Select(grp => new
                {
                    Period = g.Key,
                    Department = grp.Key,
                    EmployeeCount = grp.Select(r => r.UserId).Distinct().Count(),
                    TotalDays = grp.Sum(r => r.TotalDays)
                }))
            .OrderBy(x => x.Period)
            .ThenBy(x => x.Department)
            .ToList();

        for (int i = 0; i < rows.Count; i++)
        {
            var row = i + 2;
            ws.Cell(row, 1).Value = rows[i].Period;
            ws.Cell(row, 2).Value = rows[i].Department;
            ws.Cell(row, 3).Value = rows[i].EmployeeCount;
            ws.Cell(row, 4).Value = rows[i].TotalDays;
            ws.Cell(row, 4).Style.NumberFormat.Format = "0.0";
        }

        FormatSheet(ws, rows.Count, headers.Length);
    }

    private static void AddSummarySheet(XLWorkbook wb, List<PeriodGroup> groups)
    {
        var ws = wb.Worksheets.Add("Tổng hợp");
        var headers = new[] { "Kỳ", "Tổng số NV nghỉ", "Tổng số ngày" };
        WriteHeaders(ws, headers);

        var rows = groups
            .Select(g => new
            {
                Period = g.Key,
                EmployeeCount = g.Requests.Select(r => r.UserId).Distinct().Count(),
                TotalDays = g.Requests.Sum(r => r.TotalDays)
            })
            .OrderBy(x => x.Period)
            .ToList();

        for (int i = 0; i < rows.Count; i++)
        {
            var row = i + 2;
            ws.Cell(row, 1).Value = rows[i].Period;
            ws.Cell(row, 2).Value = rows[i].EmployeeCount;
            ws.Cell(row, 3).Value = rows[i].TotalDays;
            ws.Cell(row, 3).Style.NumberFormat.Format = "0.0";
        }

        FormatSheet(ws, rows.Count, headers.Length);
    }

    private static IEnumerable<PeriodGroup> GroupByPeriod(List<LeaveRequest> requests, string period)
    {
        return requests
            .GroupBy(r => GetPeriodKey(r.StartDate, period))
            .Select(g => new PeriodGroup(g.Key, g.ToList()));
    }

    private static string GetPeriodKey(DateTime date, string period) => period switch
    {
        "month" => $"{date.Year}-{date.Month:D2}",
        "quarter" => $"{date.Year}-Q{(date.Month - 1) / 3 + 1}",
        "year" => $"{date.Year}",
        _ => throw new ArgumentException($"Invalid period: {period}")
    };

    private static void WriteHeaders(IXLWorksheet ws, string[] headers)
    {
        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cell(1, i + 1).Value = headers[i];
        }
    }

    private static void FormatSheet(IXLWorksheet ws, int dataRowCount, int colCount)
    {
        var headerRow = ws.Row(1);
        headerRow.Style.Font.Bold = true;
        headerRow.Style.Fill.BackgroundColor = XLColor.FromHtml("#F0F0F0");

        var totalRows = Math.Max(dataRowCount + 1, 1);
        ws.Range(1, 1, totalRows, colCount).SetAutoFilter();

        ws.Columns().AdjustToContents();
    }

    private sealed record PeriodGroup(string Key, List<LeaveRequest> Requests);
}
