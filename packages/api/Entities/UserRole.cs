namespace QLNP.Api.Entities;

public class UserRole
{
    public long UserId { get; set; }
    public string Role { get; set; } = null!;

    public UserMaster User { get; set; } = null!;
}
