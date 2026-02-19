using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERP.WEB.Domain.Entities;

[Table("Categories")]
public class Category
{
	[Key]
	[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
	public int CategoryId { get; set; }

	[Required]
	[MaxLength(100)]
	public string Name { get; set; } = string.Empty;

	public string? Description { get; set; }

	public int? ParentCategoryId { get; set; }

	// Navigation Properties
	[ForeignKey(nameof(ParentCategoryId))]
	public Category? ParentCategory { get; set; }

	public ICollection<Category> SubCategories { get; set; } = new List<Category>();

	public ICollection<Product> Products { get; set; } = new List<Product>();
}