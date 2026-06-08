using System;
using System.Collections.Generic;
using System.Linq;
using QLNP.Api.Shared.Domain;

namespace QLNP.Api.Features.Reports.Statistics;

internal static class StatisticsMapper {
    public static StatisticsResponse Compute(
        List<LeaveRequest> requests,
        string period,
        Dictionary<long, (string hoTen, long? donViId, string tenDonVi, long? phongBanId)> userLookup) {
        
        var approvedRequests = requests.Where(r => r.Status == "approved").ToList();
        var totalDays = approvedRequests.Sum(r => r.TotalDays);
        
        var totalCount = requests.Count;
        var approvedCount = approvedRequests.Count;
        var approvedRatio = totalCount > 0 ? (int)Math.Round((double)approvedCount / totalCount * 100) : 0;
        
        var rejectedCount = requests.Count(r => r.Status == "rejected");
        var pendingCount = requests.Count(r => r.Status == "pending");
        var cancelledCount = requests.Count(r => r.Status == "cancelled");

        var byDept = approvedRequests
            .GroupBy(r => {
                var info = userLookup.GetValueOrDefault(r.UserId);
                return info.tenDonVi ?? "";
            })
            .Select(g => new DeptStat(g.Key, g.Sum(r => r.TotalDays)))
            .OrderBy(g => g.Name)
            .ToList();

        var byType = approvedRequests
            .GroupBy(r => r.LeaveType?.Name ?? "")
            .Select(g => new TypeStat(g.Key, g.Sum(r => r.TotalDays)))
            .OrderBy(g => g.Name)
            .ToList();

        List<PeriodStat>? byPeriod = null;
        if (period != "none") {
            byPeriod = approvedRequests
                .GroupBy(r => GetPeriodKey(r.StartDate, period))
                .Select(g => new PeriodStat(
                    Period: g.Key,
                    TotalDays: g.Sum(r => r.TotalDays),
                    EmployeeCount: g.Select(r => r.UserId).Distinct().Count()
                ))
                .OrderBy(g => g.Period)
                .ToList();
        }

        return new StatisticsResponse(
            TotalDays: totalDays,
            ApprovedRatio: approvedRatio,
            RejectedCount: rejectedCount,
            PendingCount: pendingCount,
            CancelledCount: cancelledCount,
            ByDept: byDept,
            ByType: byType,
            ByPeriod: byPeriod
        );
    }

    private static string GetPeriodKey(DateTime date, string period) => period switch {
        "month" => $"{date.Year}-{date.Month:D2}",
        "quarter" => $"{date.Year}-Q{(date.Month - 1) / 3 + 1}",
        "year" => $"{date.Year}",
        _ => throw new ArgumentException($"Invalid period: {period}")
    };
}
