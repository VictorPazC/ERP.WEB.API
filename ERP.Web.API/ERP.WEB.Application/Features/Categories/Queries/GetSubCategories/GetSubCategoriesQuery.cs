using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Categories.Queries.GetSubCategories;

public record GetSubCategoriesQuery(int ParentCategoryId) : IRequest<IEnumerable<CategoryDto>>;
