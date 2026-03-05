using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using ERP.WEB.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.WEB.Infrastructure.Repositories;

public class ProductImageRepository : IProductImageRepository
{
    private readonly ApplicationDbContext _context;

    public ProductImageRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProductImage>> GetAllAsync(CursorParams p, CancellationToken ct = default)
    {
        var afterId = CursorHelper.Decode(p.Cursor) ?? 0;
        return await _context.ProductImages
            .Where(i => i.ImageId > afterId)
            .Include(i => i.Product)
            .OrderBy(i => i.ImageId)
            .Take(p.PageSize + 1)
            .ToListAsync(ct);
    }

    public async Task<ProductImage?> GetByIdAsync(int id)
    {
        return await _context.ProductImages
            .Include(i => i.Product)
            .FirstOrDefaultAsync(i => i.ImageId == id);
    }

    public async Task<IEnumerable<ProductImage>> GetByProductIdAsync(int productId)
    {
        return await _context.ProductImages
            .Include(i => i.Product)
            .Where(i => i.ProductId == productId)
            .OrderBy(i => i.DisplayOrder)
            .ToListAsync();
    }

    public async Task<ProductImage?> GetPrimaryByProductIdAsync(int productId)
    {
        return await _context.ProductImages
            .Include(i => i.Product)
            .FirstOrDefaultAsync(i => i.ProductId == productId && i.IsPrimary);
    }

    public async Task<ProductImage> AddAsync(ProductImage image)
    {
        _context.ProductImages.Add(image);
        await _context.SaveChangesAsync();
        return image;
    }

    public async Task UpdateAsync(ProductImage image)
    {
        _context.ProductImages.Update(image);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var image = await _context.ProductImages.FindAsync(id);
        if (image is not null)
        {
            _context.ProductImages.Remove(image);
            await _context.SaveChangesAsync();
        }
    }
}
