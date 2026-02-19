using System.Collections.Generic;
using ERP.WEB.Application.DTOs;
using MediatR;

namespace ERP.WEB.Application.Features.Categories.Queries.GetSubCategories;

public record GetSubCategoriesQuery(int ParentCategoryId) : IRequest<IEnumerable<CategoryDto>>;
