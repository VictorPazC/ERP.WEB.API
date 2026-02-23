using ERP.WEB.Domain.Entities;

namespace ERP.WEB.Domain.Interfaces;

public interface IProductImageRepository
{
    Task<IEnumerable<ProductImage>> GetAllAsync();
    Task<ProductImage?> GetByIdAsync(int id);
    Task<IEnumerable<ProductImage>> GetByProductIdAsync(int productId);
    Task<ProductImage?> GetPrimaryByProductIdAsync(int productId);
    Task<ProductImage> AddAsync(ProductImage image);
    Task UpdateAsync(ProductImage image);
    Task DeleteAsync(int id);
}
