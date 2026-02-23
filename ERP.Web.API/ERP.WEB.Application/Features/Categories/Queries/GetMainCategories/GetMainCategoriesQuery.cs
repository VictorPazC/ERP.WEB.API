using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Categories.Queries.GetMainCategories;

public record GetMainCategoriesQuery : IRequest<IEnumerable<CategoryDto>>;
