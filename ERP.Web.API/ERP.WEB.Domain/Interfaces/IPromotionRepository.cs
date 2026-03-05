using ERP.WEB.Domain.Common;
using ERP.WEB.Domain.Entities;

namespace ERP.WEB.Domain.Interfaces;

public interface IPromotionRepository
{
    Task<List<Promotion>> GetAllAsync(CursorParams p, CancellationToken ct = default);
    Task<Promotion?> GetByIdAsync(int id);
    Task<IEnumerable<Promotion>> GetByProductIdAsync(int productId);
    Task<IEnumerable<Promotion>> GetActiveAsync();
    Task<Promotion> AddAsync(Promotion promotion);
    Task UpdateAsync(Promotion promotion);
    Task DeleteAsync(int id);
}
