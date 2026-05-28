using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QLNP.Api.Shared.Domain;

public class LeaveConfig {
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    public long LeaveTypeId { get; set; }
    public int ApprovalLevel { get; set; }

    [MaxLength(20)]
    public string ApproverRole { get; set; } = null!;

    public LeaveType LeaveType { get; set; } = null!;
}
