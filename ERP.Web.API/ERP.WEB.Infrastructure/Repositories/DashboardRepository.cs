using ERP.WEB.Domain.Common;
using ERP.WEB.Domain.Interfaces;
using ERP.WEB.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.WEB.Infrastructure.Repositories;

public class DashboardRepository : IDashboardRepository
{
    private readonly ApplicationDbContext _context;

    public DashboardRepository(ApplicationDbContext context) => _context = context;

    public async Task<List<WeeklyStatResult>> GetWeeklyStatsAsync(int days, CancellationToken ct = default)
    {
        var startDate = DateTime.UtcNow.Date.AddDays(-days + 1);

        // Ganancia realizada: Quantity * (SuggestedRetailPrice - PurchaseCost) por consumo
        var consumptionStats = await (
            from c in _context.Consumptions
            join inv in _context.Inventories on c.InventoryId equals inv.InventoryId
            where c.ConsumedAt >= startDate
            group new { c.Quantity, inv.SuggestedRetailPrice, inv.PurchaseCost }
                by c.ConsumedAt.Date
            into g
            select new
            {
                Day = g.Key,
                Ganancia = g.Sum(x => x.Quantity * (x.SuggestedRetailPrice - x.PurchaseCost))
            }
        ).ToListAsync(ct);

        // Pedidos confirmados por día
        var orderStats = await _context.Orders
            .Where(o => o.Status == "Confirmed" && o.CreatedAt >= startDate)
            .GroupBy(o => o.CreatedAt.Date)
            .Select(g => new { Day = g.Key, Pedidos = g.Count() })
            .ToListAsync(ct);

        // Merge both datasets
        var allDays = consumptionStats.Select(c => c.Day)
            .Union(orderStats.Select(o => o.Day))
            .Distinct()
            .OrderBy(d => d);

        var cByDay = consumptionStats.ToDictionary(x => x.Day, x => x.Ganancia);
        var oByDay = orderStats.ToDictionary(x => x.Day, x => x.Pedidos);

        return allDays
            .Select(d => new WeeklyStatResult(
                d,
                cByDay.TryGetValue(d, out var g) ? g : 0m,
                oByDay.TryGetValue(d, out var p) ? p : 0))
            .ToList();
    }

    public async Task<List<TopProductResult>> GetTopProductsAsync(
        int limit, string metric, CancellationToken ct = default)
    {
        return metric switch
        {
            "units"        => await GetTopByUnitsAsync(limit, ct),
            "consumptions" => await GetTopByConsumptionsAsync(limit, ct),
            _              => await GetTopByRevenueAsync(limit, ct)
        };
    }

    private async Task<List<TopProductResult>> GetTopByRevenueAsync(int limit, CancellationToken ct)
    {
        var rows = await (
            from oi in _context.OrderItems
            join o   in _context.Orders      on oi.OrderId     equals o.OrderId
            join inv in _context.Inventories on oi.InventoryId equals inv.InventoryId
            join p   in _context.Products    on inv.ProductId  equals p.ProductId
            where o.Status == "Confirmed"
            group new { oi.Quantity, oi.UnitPrice } by new { inv.ProductId, p.Name }
            into g
            orderby g.Sum(x => x.Quantity * x.UnitPrice) descending
            select new
            {
                g.Key.ProductId,
                Name  = g.Key.Name,
                Total = g.Sum(x => x.Quantity * x.UnitPrice)
            }
        ).Take(limit).ToListAsync(ct);

        return rows.Select(r => new TopProductResult(r.ProductId, r.Name, r.Total)).ToList();
    }

    private async Task<List<TopProductResult>> GetTopByUnitsAsync(int limit, CancellationToken ct)
    {
        var rows = await (
            from oi in _context.OrderItems
            join o   in _context.Orders      on oi.OrderId     equals o.OrderId
            join inv in _context.Inventories on oi.InventoryId equals inv.InventoryId
            join p   in _context.Products    on inv.ProductId  equals p.ProductId
            where o.Status == "Confirmed"
            group oi.Quantity by new { inv.ProductId, p.Name }
            into g
            orderby g.Sum() descending
            select new { g.Key.ProductId, Name = g.Key.Name, Total = g.Sum() }
        ).Take(limit).ToListAsync(ct);

        return rows.Select(r => new TopProductResult(r.ProductId, r.Name, r.Total)).ToList();
    }

    private async Task<List<TopProductResult>> GetTopByConsumptionsAsync(int limit, CancellationToken ct)
    {
        var rows = await (
            from c   in _context.Consumptions
            join inv in _context.Inventories on c.InventoryId  equals inv.InventoryId
            join p   in _context.Products    on inv.ProductId  equals p.ProductId
            group c.Quantity by new { inv.ProductId, p.Name }
            into g
            orderby g.Sum() descending
            select new { g.Key.ProductId, Name = g.Key.Name, Total = g.Sum() }
        ).Take(limit).ToListAsync(ct);

        return rows.Select(r => new TopProductResult(r.ProductId, r.Name, r.Total)).ToList();
    }
}
