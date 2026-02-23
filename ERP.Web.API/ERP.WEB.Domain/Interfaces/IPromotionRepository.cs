using ERP.WEB.Domain.Entities;

namespace ERP.WEB.Domain.Interfaces;

public interface IPromotionRepository
{
    Task<IEnumerable<Promotion>> GetAllAsync();
    Task<Promotion?> GetByIdAsync(int id);
    Task<IEnumerable<Promotion>> GetByProductIdAsync(int productId);
    Task<IEnumerable<Promotion>> GetActiveAsync();
    Task<Promotion> AddAsync(Promotion promotion);
    Task UpdateAsync(Promotion promotion);
    Task DeleteAsync(int id);
}
