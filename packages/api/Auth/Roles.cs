namespace QLNP.Api.Auth;

/// <summary>
/// Centralized role string constants. All role references use the full QLNP.* format.
/// Prevents typos and ensures consistency across JWT claims, authorization, and business logic.
/// </summary>
public static class AppRoles {
    public const string Admin = "QLNP.QTHT";
    public const string Director = "QLNP.GD.PGD";
    public const string Leader = "QLNP.LD.PCM";
    public const string Staff = "QLNP.CB.PCM";

    /// <summary>
    /// Role priority for display mapping (highest priority first).
    /// </summary>
    public static readonly string[] Priority = [Admin, Director, Leader, Staff];
}
