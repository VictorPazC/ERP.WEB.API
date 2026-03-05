using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using ERP.WEB.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.WEB.Infrastructure.Repositories;

public class ConsumptionRepository : IConsumptionRepository
{
    private readonly ApplicationDbContext _context;

    public ConsumptionRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Consumption>> GetAllAsync(CursorParams p, CancellationToken ct = default)
    {
        var afterId = CursorHelper.Decode(p.Cursor) ?? 0;
        return await _context.Consumptions
            .Where(c => c.ConsumptionId > afterId)
            .Include(c => c.Inventory)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p!.Category)
            .OrderBy(c => c.ConsumptionId)
            .Take(p.PageSize + 1)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<Consumption>> GetByInventoryIdAsync(int inventoryId)
    {
        return await _context.Consumptions
            .Include(c => c.Inventory)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p!.Category)
            .Where(c => c.InventoryId == inventoryId)
            .OrderByDescending(c => c.ConsumedAt)
            .ToListAsync();
    }

    public async Task<Consumption?> GetByIdAsync(int id)
    {
        return await _context.Consumptions
            .Include(c => c.Inventory)
            .FirstOrDefaultAsync(c => c.ConsumptionId == id);
    }

    public async Task<Consumption> AddAsync(Consumption consumption)
    {
        _context.Consumptions.Add(consumption);
        await _context.SaveChangesAsync();
        return consumption;
    }

    public async Task UpdateAsync(Consumption consumption)
    {
        // Persiste cambios en Consumption e Inventory en un solo SaveChanges
        // (ambas entidades están tracked por el mismo DbContext desde GetByIdAsync).
        _context.Consumptions.Update(consumption);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var consumption = await _context.Consumptions.FindAsync(id);
        if (consumption is not null)
        {
            _context.Consumptions.Remove(consumption);
            await _context.SaveChangesAsync();
        }
    }
}
