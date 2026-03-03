using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ERP.WEB.Domain.Interfaces;

namespace ERP.WEB.Domain.Entities;

[Table("Consumptions")]
public class Consumption : ICompanyEntity
{
    public int CompanyId { get; set; }

    [ForeignKey(nameof(CompanyId))]
    public Company? Company { get; set; }

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
