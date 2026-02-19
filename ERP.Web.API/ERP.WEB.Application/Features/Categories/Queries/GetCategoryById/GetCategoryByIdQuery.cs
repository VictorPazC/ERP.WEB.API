using ERP.WEB.Application.DTOs;
using MediatR;

namespace ERP.WEB.Application.Features.Categories.Queries.GetCategoryById;

public record GetCategoryByIdQuery(int CategoryId) : IRequest<CategoryDto?>;
