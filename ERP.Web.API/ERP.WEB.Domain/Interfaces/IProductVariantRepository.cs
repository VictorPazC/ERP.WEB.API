using ERP.WEB.Domain.Common;
using ERP.WEB.Domain.Entities;

namespace ERP.WEB.Domain.Interfaces;

// Decisión 6B: extraer IProductVariantRepository para que los handlers de Application
// no dependan directamente de ApplicationDbContext (viola Clean Architecture).
public interface IProductVariantRepository
{
    // Consultas
    Task<List<ProductVariant>> GetAllByProductAsync(int productId, CursorParams p, CancellationToken ct = default);
    Task<ProductVariant?> GetByIdAsync(int variantId);
    Task<ProductVariant?> GetByIdWithDetailsAsync(int variantId); // incluye Images + Inventory
    Task<int> CountByProductAsync(int productId);                 // usado para auto-nombre "v{n+1}"

    // Escritura
    Task<ProductVariant> AddAsync(ProductVariant variant);
    Task UpdateAsync(ProductVariant variant);

    // Eliminación en cascada DB: Images → Inventory → Variant (en un solo SaveChanges).
    // El borrado de archivos físicos queda en el handler (responsabilidad de Application).
    Task DeleteAsync(ProductVariant variant);
}
