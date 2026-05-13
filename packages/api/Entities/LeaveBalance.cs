using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QLNP.Api.Entities;

public class LeaveBalance
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    public long UserId { get; set; }
    public long LeaveTypeId { get; set; }
    public int Year { get; set; }

    [Column(TypeName = "decimal(5,1)")]
    public decimal TotalDays { get; set; }

    [Column(TypeName = "decimal(5,1)")]
    public decimal UsedDays { get; set; }

    public UserMaster User { get; set; } = null!;
    public LeaveType LeaveType { get; set; } = null!;
}
