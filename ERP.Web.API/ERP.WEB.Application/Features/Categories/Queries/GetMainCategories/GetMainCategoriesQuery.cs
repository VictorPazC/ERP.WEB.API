using System;
using System.Collections.Generic;
using System.Text;
using ERP.WEB.Application.DTOs;
using MediatR;

namespace ERP.WEB.Application.Features.Categories.Queries.GetMainCategories;

public record GetMainCategoriesQuery : IRequest<IEnumerable<CategoryDto>>;
