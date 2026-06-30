namespace QLNP.Api.Shared.Domain;

internal static class BusinessDayCalculator {
    public static readonly HashSet<DayOfWeek> DefaultWorkDays = new()
    {
        DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday,
        DayOfWeek.Thursday, DayOfWeek.Friday
    };

    /// <summary>
    /// Tính số ngày làm việc giữa start và end, inclusive.
    /// </summary>
    internal static decimal Count(DateTime start, DateTime end, HashSet<DayOfWeek> workDays) {
        if (start > end) return 0;
        var days = workDays ?? DefaultWorkDays;
        var count = 0;
        for (var d = start.Date; d <= end.Date; d = d.AddDays(1)) {
            if (days.Contains(d.DayOfWeek)) {
                count++;
            }
        }
        return count;
    }

    /// <summary>
    /// Overload mặc định dùng DefaultWorkDays.
    /// </summary>
    internal static decimal Count(DateTime start, DateTime end) => Count(start, end, DefaultWorkDays);

    /// <summary>
    /// Parse chuỗi config "1,2,3,4,5" thành HashSet<DayOfWeek>.
    /// 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
    /// </summary>
    internal static HashSet<DayOfWeek> ParseWorkDays(string? configValue) {
        if (string.IsNullOrWhiteSpace(configValue)) {
            return DefaultWorkDays;
        }

        try {
            var days = configValue.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => (DayOfWeek)int.Parse(s.Trim()))
                .ToHashSet();

            return days.Count > 0 ? days : DefaultWorkDays;
        } catch {
            return DefaultWorkDays;
        }
    }
}
