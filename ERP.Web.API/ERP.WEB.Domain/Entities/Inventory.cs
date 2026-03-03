using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ERP.WEB.Domain.Interfaces;

namespace ERP.WEB.Domain.Entities;

[Table("Inventory")]
public class Inventory : ICompanyEntity
{
    public int CompanyId { get; set; }

    [ForeignKey(nameof(CompanyId))]
    public Company? Company { get; set; }

    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int InventoryId { get; set; }

    public int ProductId { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal PurchaseCost { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal SuggestedRetailPrice { get; set; }

    public int CurrentStock { get; set; } = 0;

    public DateTime LastRestockDate { get; set; } = DateTime.UtcNow;

    public DateTime? LastSaleDate { get; set; }

    /// <summary>Set true automatically when consumed. User can set false to stop restocking.</summary>
    public bool NeedsRestock { get; set; } = false;

    [ForeignKey(nameof(ProductId))]
    public Product Product { get; set; } = null!;

    public int? VariantId { get; set; }

    [ForeignKey(nameof(VariantId))]
    public ProductVariant? Variant { get; set; }
}
