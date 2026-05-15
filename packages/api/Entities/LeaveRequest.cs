using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QLNP.Api.Entities;

public class LeaveRequest
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    public long UserId { get; set; }
    public long LeaveTypeId { get; set; }

    [Column(TypeName = "date")]
    public DateTime StartDate { get; set; }

    [Column(TypeName = "date")]
    public DateTime EndDate { get; set; }

    [Column(TypeName = "decimal(5,1)")]
    public decimal TotalDays { get; set; }

    public string? Reason { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "pending";

    public long? ApprovedBy { get; set; }

    [Column(TypeName = "datetime2")]
    public DateTime? ApprovedAt { get; set; }

    public string? RejectedReason { get; set; }

    [Column(TypeName = "datetime2")]
    public DateTime CreatedAt { get; set; }

    [Column(TypeName = "datetime2")]
    public DateTime? UpdatedAt { get; set; }

    public long? RequestedApproverId { get; set; }

    public UserMaster User { get; set; } = null!;
    public LeaveType LeaveType { get; set; } = null!;
    public UserMaster? Approver { get; set; }
    public UserMaster? RequestedApprover { get; set; }
}
