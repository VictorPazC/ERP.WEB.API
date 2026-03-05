using ERP.WEB.Domain.Common;
using ERP.WEB.Domain.Entities;

namespace ERP.WEB.Domain.Interfaces;

public interface IBrandRepository
{
    Task<List<Brand>> GetAllAsync(CursorParams p, CancellationToken ct = default);
    Task<Brand?> GetByIdAsync(int id);
    Task<Brand> AddAsync(Brand brand);
    Task UpdateAsync(Brand brand);
    Task<bool> SetDefaultAsync(int id);
    Task DeleteAsync(int id);
}
