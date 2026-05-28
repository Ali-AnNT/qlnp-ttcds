namespace QLNP.Api.Features.LeaveRequests;

internal static class BusinessDayCalculator {
    /// <summary>Tính số ngày làm việc (T2–T6) giữa start và end, inclusive.</summary>
    internal static decimal Count(DateTime start, DateTime end) {
        if (start > end) return 0;
        var count = 0;
        for (var d = start.Date; d <= end.Date; d = d.AddDays(1))
            if (d.DayOfWeek != DayOfWeek.Saturday && d.DayOfWeek != DayOfWeek.Sunday)
                count++;
        return count;
    }
}
