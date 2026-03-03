using ERP.WEB.Domain.Entities;

namespace ERP.WEB.Domain.Interfaces;

public interface ICompanyRepository
{
    Task<IEnumerable<Company>> GetAllAsync();
    Task<Company?> GetByIdAsync(int id);
    Task<Company?> GetBySlugAsync(string slug);
    Task<Company> AddAsync(Company company);
    Task UpdateAsync(Company company);
    Task DeleteAsync(int id);
}
