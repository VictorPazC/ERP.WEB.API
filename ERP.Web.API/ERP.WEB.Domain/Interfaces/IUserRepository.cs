using ERP.WEB.Domain.Common;
using ERP.WEB.Domain.Entities;

namespace ERP.WEB.Domain.Interfaces;

public interface IUserRepository
{
    Task<List<User>> GetAllAsync(CursorParams p, CancellationToken ct = default);
    Task<User?> GetByIdAsync(int id);
    Task<User?> GetByEmailAsync(string email);
    Task<User> AddAsync(User user);
    Task UpdateAsync(User user);
    Task DeleteAsync(int id);
    Task<bool> AnySuperAdminAsync(CancellationToken ct = default);
}
