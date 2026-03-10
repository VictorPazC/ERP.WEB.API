using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using ERP.WEB.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.WEB.Infrastructure.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly ApplicationDbContext _context;

    public ProductRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Product>> GetAllAsync(CursorParams p, CancellationToken ct = default)
    {
        var afterId = CursorHelper.Decode(p.Cursor) ?? 0;
        return await _context.Products
            .Where(p => p.ProductId > afterId)
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Inventories)
            .Include(p => p.Variants)
            .OrderBy(p => p.ProductId)
            .Take(p.PageSize + 1)
            .ToListAsync(ct);
    }

    public async Task<Product?> GetByIdAsync(int id)
    {
        return await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Inventories)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.ProductId == id);
    }

    public async Task<Product> AddAsync(Product product)
    {
        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        return product;
    }

    public async Task UpdateAsync(Product product)
    {
        _context.Products.Update(product);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product is not null)
        {
            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool?> ToggleFavoriteAsync(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product is null) return null;
        product.IsFavorite = !product.IsFavorite;
        await _context.SaveChangesAsync();
        return product.IsFavorite;
    }

    public async Task<bool> SetStockStatusAsync(int id, string? status)
    {
        var product = await _context.Products.FindAsync(id);
        if (product is null) return false;
        product.StockStatus = status;
        await _context.SaveChangesAsync();
        return true;
    }
}