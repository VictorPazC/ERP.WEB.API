using ERP.WEB.Domain.Common;
using ERP.WEB.Domain.Entities;

namespace ERP.WEB.Domain.Interfaces;

public interface IProductRepository
{
    Task<List<Product>> GetAllAsync(CursorParams p, CancellationToken ct = default);
    Task<Product?> GetByIdAsync(int id);
    Task<Product> AddAsync(Product product);
    Task UpdateAsync(Product product);
    Task DeleteAsync(int id);
    Task<bool?> ToggleFavoriteAsync(int id);
    Task<bool> SetStockStatusAsync(int id, string? status);
}