using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using ERP.WEB.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.WEB.Infrastructure.Repositories;

public class PromotionRepository : IPromotionRepository
{
    private readonly ApplicationDbContext _context;

    public PromotionRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Promotion>> GetAllAsync()
    {
        return await _context.Promotions
            .Include(pr => pr.Product)
            .ToListAsync();
    }

    public async Task<Promotion?> GetByIdAsync(int id)
    {
        return await _context.Promotions
            .Include(pr => pr.Product)
            .FirstOrDefaultAsync(pr => pr.PromoId == id);
    }

    public async Task<IEnumerable<Promotion>> GetByProductIdAsync(int productId)
    {
        return await _context.Promotions
            .Include(pr => pr.Product)
            .Where(pr => pr.ProductId == productId)
            .ToListAsync();
    }

    public async Task<IEnumerable<Promotion>> GetActiveAsync()
    {
        var now = DateTime.UtcNow;
        return await _context.Promotions
            .Include(pr => pr.Product)
            .Where(pr => pr.StartDate <= now && pr.EndDate >= now)
            .ToListAsync();
    }

    public async Task<Promotion> AddAsync(Promotion promotion)
    {
        _context.Promotions.Add(promotion);
        await _context.SaveChangesAsync();
        return promotion;
    }

    public async Task UpdateAsync(Promotion promotion)
    {
        _context.Promotions.Update(promotion);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var promotion = await _context.Promotions.FindAsync(id);
        if (promotion is not null)
        {
            _context.Promotions.Remove(promotion);
            await _context.SaveChangesAsync();
        }
    }
}
