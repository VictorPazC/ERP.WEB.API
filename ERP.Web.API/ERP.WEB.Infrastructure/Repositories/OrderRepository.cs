using ERP.WEB.Application.Common;
using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using ERP.WEB.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.WEB.Infrastructure.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly ApplicationDbContext _context;

    public OrderRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Order>> GetAllAsync(CursorParams p, CancellationToken ct = default)
    {
        var afterId = CursorHelper.Decode(p.Cursor) ?? 0;
        return await _context.Orders
            .Include(o => o.Items)
                .ThenInclude(i => i.Inventory)
                    .ThenInclude(inv => inv!.Product)
            .Where(o => o.OrderId > afterId)
            .OrderBy(o => o.OrderId)
            .Take(p.PageSize + 1)
            .ToListAsync(ct);
    }

    public async Task<Order?> GetByIdAsync(int id, CancellationToken ct = default)
        => await _context.Orders
            .Include(o => o.Items)
                .ThenInclude(i => i.Inventory)
                    .ThenInclude(inv => inv!.Product)
            .FirstOrDefaultAsync(o => o.OrderId == id, ct);

    public async Task<List<Order>> GetByStatusAsync(string status, CursorParams p, CancellationToken ct = default)
    {
        var afterId = CursorHelper.Decode(p.Cursor) ?? 0;
        return await _context.Orders
            .Include(o => o.Items)
                .ThenInclude(i => i.Inventory)
                    .ThenInclude(inv => inv!.Product)
            .Where(o => o.Status == status && o.OrderId > afterId)
            .OrderBy(o => o.OrderId)
            .Take(p.PageSize + 1)
            .ToListAsync(ct);
    }

    public async Task<Order> AddAsync(Order order, CancellationToken ct = default)
    {
        _context.Orders.Add(order);
        await _context.SaveChangesAsync(ct);
        return order;
    }

    public async Task UpdateAsync(Order order, CancellationToken ct = default)
    {
        _context.Orders.Update(order);
        await _context.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var order = await _context.Orders.FindAsync(new object[] { id }, ct);
        if (order is null) return;
        _context.Orders.Remove(order);
        await _context.SaveChangesAsync(ct);
    }
}
