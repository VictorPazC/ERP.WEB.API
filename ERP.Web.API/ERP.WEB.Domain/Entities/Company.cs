using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERP.WEB.Domain.Entities;

[Table("Companies")]
public class Company
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int CompanyId { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    [MaxLength(100)]
    public string Slug { get; set; } = string.Empty;

    public string? LogoUrl { get; set; }

    [MaxLength(200)]
    public string? CustomDomain { get; set; }

    [MaxLength(7)]
    public string? PrimaryColor { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Product> Products { get; set; } = new List<Product>();
    public ICollection<Category> Categories { get; set; } = new List<Category>();
    public ICollection<Brand> Brands { get; set; } = new List<Brand>();
    public ICollection<Inventory> Inventories { get; set; } = new List<Inventory>();
    public ICollection<Tag> Tags { get; set; } = new List<Tag>();
    public ICollection<Promotion> Promotions { get; set; } = new List<Promotion>();
    public ICollection<ProductImage> ProductImages { get; set; } = new List<ProductImage>();
    public ICollection<ProductVariant> ProductVariants { get; set; } = new List<ProductVariant>();
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Consumption> Consumptions { get; set; } = new List<Consumption>();
}
