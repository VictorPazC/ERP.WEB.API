using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using ERP.WEB.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.WEB.Infrastructure.Repositories;

public class BrandRepository : IBrandRepository
{
    private readonly ApplicationDbContext _context;

    public BrandRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Brand>> GetAllAsync(CursorParams p, CancellationToken ct = default)
    {
        var afterId = CursorHelper.Decode(p.Cursor) ?? 0;
        return await _context.Brands
            .Where(b => b.BrandId > afterId)
            .Include(b => b.Products)
            .OrderBy(b => b.BrandId)
            .Take(p.PageSize + 1)
            .ToListAsync(ct);
    }

    public async Task<Brand?> GetByIdAsync(int id)
    {
        return await _context.Brands
            .Include(b => b.Products)
            .FirstOrDefaultAsync(b => b.BrandId == id);
    }

    public async Task<Brand> AddAsync(Brand brand)
    {
        _context.Brands.Add(brand);
        await _context.SaveChangesAsync();
        return brand;
    }

    public async Task UpdateAsync(Brand brand)
    {
        _context.Brands.Update(brand);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> SetDefaultAsync(int id)
    {
        var brands = await _context.Brands.ToListAsync();
        var target = brands.FirstOrDefault(b => b.BrandId == id);
        if (target is null) return false;
        foreach (var b in brands) b.IsDefault = false;
        target.IsDefault = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task DeleteAsync(int id)
    {
        var brand = await _context.Brands.FindAsync(id);
        if (brand is not null)
        {
            _context.Brands.Remove(brand);
            await _context.SaveChangesAsync();
        }
    }
}
