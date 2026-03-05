using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERP.WEB.Domain.Entities;

[Table("Users")]
public class User
{
    /// <summary>
    /// Null for SuperAdmin users who are not tied to a single company.
    /// All regular users must have a CompanyId.
    /// </summary>
    public int? CompanyId { get; set; }

    [ForeignKey(nameof(CompanyId))]
    public Company? Company { get; set; }

    public bool IsSuperAdmin { get; set; }

    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Role { get; set; } = "Viewer";

    [MaxLength(50)]
    public string Status { get; set; } = "Active";

    /// <summary>BCrypt hash of the password. Null means login not allowed.</summary>
    [MaxLength(256)]
    public string? PasswordHash { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
