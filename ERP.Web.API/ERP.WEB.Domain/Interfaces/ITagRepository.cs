using ERP.WEB.Domain.Common;
using ERP.WEB.Domain.Entities;

namespace ERP.WEB.Domain.Interfaces;

public interface ITagRepository
{
    Task<List<Tag>> GetAllAsync(CursorParams p, CancellationToken ct = default);
    Task<Tag?> GetByIdAsync(int id);
    Task<IEnumerable<Tag>> GetByProductIdAsync(int productId);
    Task<Tag> AddAsync(Tag tag);
    Task UpdateAsync(Tag tag);
    Task DeleteAsync(int id);
    Task AddTagToProductAsync(int tagId, int productId);
    Task RemoveTagFromProductAsync(int tagId, int productId);
}
