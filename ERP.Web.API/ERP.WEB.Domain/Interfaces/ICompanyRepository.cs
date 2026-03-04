using ERP.WEB.Application.Common;
using ERP.WEB.Domain.Entities;

namespace ERP.WEB.Domain.Interfaces;

public interface ICompanyRepository
{
    Task<List<Company>> GetAllAsync(CursorParams p, CancellationToken ct = default);
    Task<Company?> GetByIdAsync(int id);
    Task<Company?> GetBySlugAsync(string slug);
    Task<Company> AddAsync(Company company);
    Task UpdateAsync(Company company);
    Task DeleteAsync(int id);
}
