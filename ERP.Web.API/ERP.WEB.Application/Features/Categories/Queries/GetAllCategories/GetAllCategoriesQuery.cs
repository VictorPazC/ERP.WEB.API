using ERP.WEB.Application.DTOs;
using MediatR;

namespace ERP.WEB.Application.Features.Categories.Queries.GetAllCategories;

public record GetAllCategoriesQuery : IRequest<IEnumerable<CategoryDto>>;
