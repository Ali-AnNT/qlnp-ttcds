using System.Collections.Generic;

namespace QLNP.Api.Features.Reports.Statistics;

public sealed record StatisticsResponse(
    decimal TotalDays,
    int ApprovedRatio,
    int RejectedCount,
    int PendingCount,
    int CancelledCount,
    List<DeptStat> ByDept,
    List<TypeStat> ByType,
    List<PeriodStat>? ByPeriod
);

public sealed record DeptStat(string Name, decimal Days);
public sealed record TypeStat(string Name, decimal Value);
public sealed record PeriodStat(string Period, decimal TotalDays, int EmployeeCount);
