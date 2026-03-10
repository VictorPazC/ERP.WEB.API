using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ERP.WEB.Domain.Interfaces;

namespace ERP.WEB.Domain.Entities;

[Table("ProductVariants")]
public class ProductVariant : ICompanyEntity
{
    public int CompanyId { get; set; }

    [ForeignKey(nameof(CompanyId))]
    public Company? Company { get; set; }

    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int VariantId { get; set; }

    public int ProductId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    [MaxLength(50)]
    public string? StockStatus { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(ProductId))]
    public Product Product { get; set; } = null!;

    public ICollection<Inventory> Inventories { get; set; } = new List<Inventory>();

    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
}
