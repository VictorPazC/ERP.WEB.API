using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERP.WEB.Domain.Entities;

[Table("Consumptions")]
public class Consumption
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ConsumptionId { get; set; }

    public int InventoryId { get; set; }

    public int Quantity { get; set; } = 1;

    public DateTime ConsumedAt { get; set; } = DateTime.UtcNow;

    public string? Notes { get; set; }

    [ForeignKey(nameof(InventoryId))]
    public Inventory Inventory { get; set; } = null!;
}
