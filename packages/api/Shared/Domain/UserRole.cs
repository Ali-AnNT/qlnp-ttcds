using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QLNP.Api.Shared.Domain;

/// <summary>
/// Persists the user's role from JWT claims so it can be used in LeaveBalance recalculation
/// without requiring the user to be online. Synced on login via GET /me and DevLogin.
/// </summary>
public class UserRole {
    [Key]
    [Column("UserId")]
    public long UserId { get; set; }

    [MaxLength(50)]
    public string Role { get; set; } = null!;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public UserMaster User { get; set; } = null!;
}
