using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QLNP.Api.Entities;

public class LeaveType {
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [MaxLength(100)]
    public string Name { get; set; } = null!;

    [MaxLength(20)]
    public string Code { get; set; } = null!;

    [Column(TypeName = "decimal(5,1)")]
    public decimal DefaultDays { get; set; }

    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<LeaveRequest> Requests { get; set; } = new List<LeaveRequest>();
    public ICollection<LeaveConfig> Configs { get; set; } = new List<LeaveConfig>();
}
