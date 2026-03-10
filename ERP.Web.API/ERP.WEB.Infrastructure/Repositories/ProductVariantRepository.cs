using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using ERP.WEB.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.WEB.Infrastructure.Repositories;

// Implementación de IProductVariantRepository (Decisión 6B).
// Los handlers de Application ya no referencian ApplicationDbContext directamente.
public class ProductVariantRepository : IProductVariantRepository
{
    private readonly ApplicationDbContext _context;

    public ProductVariantRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProductVariant>> GetAllByProductAsync(int productId, CursorParams p, CancellationToken ct = default)
    {
        var afterId = CursorHelper.Decode(p.Cursor) ?? 0;
        return await _context.ProductVariants
            .Where(v => v.ProductId == productId && v.VariantId > afterId)
            .Include(v => v.Inventories)
            .Include(v => v.Images)
            .OrderBy(v => v.VariantId)
            .Take(p.PageSize + 1)
            .ToListAsync(ct);
    }

    public async Task<ProductVariant?> GetByIdAsync(int variantId)
    {
        return await _context.ProductVariants
            .FirstOrDefaultAsync(v => v.VariantId == variantId);
    }

    public async Task<ProductVariant?> GetByIdWithDetailsAsync(int variantId)
    {
        // Carga Images e Inventories — necesario para GetVariantById y DeleteVariantHandler.
        return await _context.ProductVariants
            .Include(v => v.Images)
            .Include(v => v.Inventories)
            .FirstOrDefaultAsync(v => v.VariantId == variantId);
    }

    public async Task<int> CountByProductAsync(int productId)
    {
        // Usado en CreateVariant para auto-nombrar "v{n+1}" cuando Name está vacío.
        return await _context.ProductVariants
            .CountAsync(v => v.ProductId == productId);
    }

    public async Task<ProductVariant> AddAsync(ProductVariant variant)
    {
        _context.ProductVariants.Add(variant);
        await _context.SaveChangesAsync();
        return variant;
    }

    public async Task UpdateAsync(ProductVariant variant)
    {
        _context.ProductVariants.Update(variant);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(ProductVariant variant)
    {
        // Elimina en cascada: Images → Inventories → Variant en un solo SaveChanges.
        // El borrado de archivos físicos queda en DeleteVariantCommandHandler.
        _context.ProductImages.RemoveRange(variant.Images);
        _context.Inventories.RemoveRange(variant.Inventories);
        _context.ProductVariants.Remove(variant);
        await _context.SaveChangesAsync();
    }
}
