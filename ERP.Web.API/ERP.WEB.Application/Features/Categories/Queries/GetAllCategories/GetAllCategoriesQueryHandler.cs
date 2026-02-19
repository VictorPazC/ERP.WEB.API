using System;
using System.Collections.Generic;
using System.Text;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using MediatR;

namespace ERP.WEB.Application.Features.Categories.Queries.GetAllCategories;

public class GetAllCategoriesQueryHandler : IRequestHandler<GetAllCategoriesQuery, IEnumerable<CategoryDto>>
{
    private readonly ICategoryRepository _repository;

    public GetAllCategoriesQueryHandler(ICategoryRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<CategoryDto>> Handle(GetAllCategoriesQuery request, CancellationToken cancellationToken)
    {
        var categories = await _repository.GetAllAsync();
        
        return categories.Select(c => new CategoryDto(
            c.CategoryId,
            c.Name,
            c.Description,
            c.ParentCategoryId,
            c.ParentCategory?.Name,
            c.SubCategories?.Count ?? 0,
            c.Products?.Count ?? 0
        ));
    }
}
