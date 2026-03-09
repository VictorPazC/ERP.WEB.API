using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERP.WEB.Domain.Entities;

[Table("ActivityLogs")]
public class ActivityLog
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ActivityLogId { get; set; }

    // Nullable — SuperAdmin actions have no company scope
    public int? CompanyId { get; set; }

    [ForeignKey(nameof(CompanyId))]
    public Company? Company { get; set; }

    public int? UserId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = default!; // order_created, order_confirmed, restock, consumption, low_stock

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = default!;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? Amount { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
