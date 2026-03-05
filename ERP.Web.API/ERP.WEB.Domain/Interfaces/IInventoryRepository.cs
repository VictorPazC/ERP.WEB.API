using ERP.WEB.Domain.Common;
using ERP.WEB.Domain.Entities;

namespace ERP.WEB.Domain.Interfaces;

public interface IInventoryRepository
{
    Task<List<Inventory>> GetAllAsync(CursorParams p, CancellationToken ct = default);
    Task<Inventory?> GetByIdAsync(int id);
    Task<Inventory?> GetByProductIdAsync(int productId);
    Task<Inventory> AddAsync(Inventory inventory);
    Task UpdateAsync(Inventory inventory);
    Task DeleteAsync(int id);
}
