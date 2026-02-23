using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Categories.Queries.GetAllCategories;

public record GetAllCategoriesQuery : IRequest<IEnumerable<CategoryDto>>;
