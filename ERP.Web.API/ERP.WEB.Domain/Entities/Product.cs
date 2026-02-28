using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERP.WEB.Domain.Entities;

[Table("Products")]
public class Product
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ProductId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int? BrandId { get; set; }

    public string? ReferenceLink { get; set; }

    [MaxLength(200)]
    public string? PurchaseLocation { get; set; }

    [MaxLength(50)]
    public string Status { get; set; } = "Active";

    public int? CategoryId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(CategoryId))]
    public Category? Category { get; set; }

    [ForeignKey(nameof(BrandId))]
    public Brand? Brand { get; set; }

    public Inventory? Inventory { get; set; }

    public ICollection<Tag> Tags { get; set; } = new List<Tag>();

    public ICollection<Promotion> Promotions { get; set; } = new List<Promotion>();

    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
}
