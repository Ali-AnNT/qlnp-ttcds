namespace QLNP.Api.Features.Reports.Export;

/// <summary>Row for "Chi tiết" sheet. Property names must match Smart Markers exactly.</summary>
public sealed record DetailRow(
    int Stt,
    string HoTen,
    string TenDonVi,
    string LeaveType,
    string FromDate,
    string ToDate,
    decimal TotalDays,
    string Status
);

/// <summary>Row for "Nhân viên - Loại phép" sheet.</summary>
public sealed record EmployeeLeaveRow(
    string Period,
    string HoTen,
    string LeaveType,
    decimal TotalDays
);

/// <summary>Row for "Theo phòng ban" sheet.</summary>
public sealed record DepartmentRow(
    string Period,
    string TenDonVi,
    int EmployeeCount,
    decimal TotalDays
);

/// <summary>Row for "Tổng hợp" sheet.</summary>
public sealed record SummaryRow(
    string Period,
    int EmployeeCount,
    decimal TotalDays
);
