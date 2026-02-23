using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Categories.Queries.GetCategoryById;

public class GetCategoryByIdQueryHandler : IRequestHandler<GetCategoryByIdQuery, CategoryDto?>
{
    private readonly ICategoryRepository _repository;

    public GetCategoryByIdQueryHandler(ICategoryRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<CategoryDto?> Handle(GetCategoryByIdQuery request, CancellationToken cancellationToken)
    {
        var category = await _repository.GetByIdAsync(request.CategoryId);

        if (category is null)
            return null;

        return new CategoryDto(
            category.CategoryId,
            category.Name,
            category.Description,
            category.ParentCategoryId,
            category.ParentCategory?.Name,
            category.SubCategories?.Count ?? 0,
            category.Products?.Count ?? 0
        );
    }
}
