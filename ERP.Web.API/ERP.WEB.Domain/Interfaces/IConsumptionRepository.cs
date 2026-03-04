using ERP.WEB.Application.Common;
using ERP.WEB.Domain.Entities;

namespace ERP.WEB.Domain.Interfaces;

public interface IConsumptionRepository
{
    Task<List<Consumption>> GetAllAsync(CursorParams p, CancellationToken ct = default);
    Task<IEnumerable<Consumption>> GetByInventoryIdAsync(int inventoryId);
    Task<Consumption?> GetByIdAsync(int id);
    Task<Consumption> AddAsync(Consumption consumption);
    Task UpdateAsync(Consumption consumption); // Decisión 7B: edición de Quantity + Notes con ajuste de stock
    Task DeleteAsync(int id);
}
