using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using ERP.WEB.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.WEB.Infrastructure.Repositories;

public class InventoryRepository : IInventoryRepository
{
    private readonly ApplicationDbContext _context;

    public InventoryRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Inventory>> GetAllAsync(CursorParams p, CancellationToken ct = default)
    {
        var afterId = CursorHelper.Decode(p.Cursor) ?? 0;
        return await _context.Inventories
            .Where(i => i.InventoryId > afterId)
            .Include(i => i.Product)
                .ThenInclude(p => p!.Category)
            .Include(i => i.Variant)
            .OrderBy(i => i.InventoryId)
            .Take(p.PageSize + 1)
            .ToListAsync(ct);
    }

    public async Task<Inventory?> GetByIdAsync(int id)
    {
        return await _context.Inventories
            .Include(i => i.Product)
                .ThenInclude(p => p!.Category)
            .FirstOrDefaultAsync(i => i.InventoryId == id);
    }

    public async Task<Inventory?> GetByProductIdAsync(int productId)
    {
        return await _context.Inventories
            .Include(i => i.Product)
                .ThenInclude(p => p!.Category)
            .FirstOrDefaultAsync(i => i.ProductId == productId);
    }

    public async Task<List<Inventory>> GetCriticalAsync(int threshold, CancellationToken ct = default)
    {
        return await _context.Inventories
            .Where(i => i.CurrentStock <= threshold)
            .Include(i => i.Product)
            .Include(i => i.Variant)
            .OrderBy(i => i.CurrentStock)
            .ToListAsync(ct);
    }

    public async Task<Inventory> AddAsync(Inventory inventory)
    {
        _context.Inventories.Add(inventory);
        await _context.SaveChangesAsync();
        return inventory;
    }

    public async Task UpdateAsync(Inventory inventory)
    {
        _context.Inventories.Update(inventory);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var inventory = await _context.Inventories.FindAsync(id);
        if (inventory is not null)
        {
            _context.Inventories.Remove(inventory);
            await _context.SaveChangesAsync();
        }
    }
}
