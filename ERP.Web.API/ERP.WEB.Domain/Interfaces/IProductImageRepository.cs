using ERP.WEB.Application.Common;
using ERP.WEB.Domain.Entities;

namespace ERP.WEB.Domain.Interfaces;

public interface IProductImageRepository
{
    Task<List<ProductImage>> GetAllAsync(CursorParams p, CancellationToken ct = default);
    Task<ProductImage?> GetByIdAsync(int id);
    Task<IEnumerable<ProductImage>> GetByProductIdAsync(int productId);
    Task<ProductImage?> GetPrimaryByProductIdAsync(int productId);
    Task<ProductImage> AddAsync(ProductImage image);
    Task UpdateAsync(ProductImage image);
    Task DeleteAsync(int id);
}
