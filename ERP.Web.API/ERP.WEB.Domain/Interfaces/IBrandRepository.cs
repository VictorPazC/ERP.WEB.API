using ERP.WEB.Domain.Entities;

namespace ERP.WEB.Domain.Interfaces;

public interface IBrandRepository
{
    Task<IEnumerable<Brand>> GetAllAsync();
    Task<Brand?> GetByIdAsync(int id);
    Task<Brand> AddAsync(Brand brand);
    Task UpdateAsync(Brand brand);
    Task<bool> SetDefaultAsync(int id);
    Task DeleteAsync(int id);
}
