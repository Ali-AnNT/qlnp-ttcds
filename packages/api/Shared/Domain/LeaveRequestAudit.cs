using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QLNP.Api.Shared.Domain;

public class LeaveRequestAudit {
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    public long LeaveRequestId { get; set; }

    public long ChangedBy { get; set; }

    [Column(TypeName = "datetime2")]
    public DateTime ChangedAt { get; set; }

    [MaxLength(100)]
    public string FieldName { get; set; } = null!;

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }

    public LeaveRequest LeaveRequest { get; set; } = null!;
}
