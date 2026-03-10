using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Categories.Queries.GetSubCategories;

public class GetSubCategoriesQueryHandler : IRequestHandler<GetSubCategoriesQuery, IEnumerable<CategoryDto>>
{
    private readonly ICategoryRepository _repository;

    public GetSubCategoriesQueryHandler(ICategoryRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<IEnumerable<CategoryDto>> Handle(GetSubCategoriesQuery request, CancellationToken cancellationToken)
    {
        var categories = await _repository.GetSubCategoriesAsync(request.ParentCategoryId);

        return categories.Select(c => new CategoryDto(
            c.CategoryId,
            c.Name,
            c.Description,
            c.ParentCategoryId,
            c.ParentCategory?.Name,
            c.SubCategories?.Count ?? 0,
            c.Products?.Count ?? 0,
            c.ImagePath
        ));
    }
}
