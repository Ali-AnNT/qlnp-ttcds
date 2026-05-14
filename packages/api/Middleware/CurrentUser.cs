namespace QLNP.Api.Middleware;

public record CurrentUser(
    long UserId,
    string DisplayName,
    long UnitId,
    long PhongBanId,
    string DeviceId,
    List<string> Roles,
    int UserIdUBTP,
    int PhongBanIdUBTP,
    int DonViIdUBTP
);
