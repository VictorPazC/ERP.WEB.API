using ERP.WEB.Domain.Entities;

namespace ERP.WEB.Domain.Interfaces;

public interface IConsumptionRepository
{
    Task<IEnumerable<Consumption>> GetAllAsync();
    Task<IEnumerable<Consumption>> GetByInventoryIdAsync(int inventoryId);
    Task<Consumption?> GetByIdAsync(int id);
    Task<Consumption> AddAsync(Consumption consumption);
    Task DeleteAsync(int id);
}
