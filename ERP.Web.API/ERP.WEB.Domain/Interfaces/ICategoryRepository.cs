using ERP.WEB.Domain.Common;
using ERP.WEB.Domain.Entities;

namespace ERP.WEB.Domain.Interfaces;

public interface ICategoryRepository
{
	Task<List<Category>> GetAllAsync(CursorParams p, CancellationToken ct = default);
	Task<Category?> GetByIdAsync(int id);
	Task<IEnumerable<Category>> GetMainCategoriesAsync(); // Categorías principales (sin padre)
	Task<IEnumerable<Category>> GetSubCategoriesAsync(int parentId); // Subcategorías de una categoría
	Task<Category> AddAsync(Category category);
	Task UpdateAsync(Category category);
	Task DeleteAsync(int id);
}