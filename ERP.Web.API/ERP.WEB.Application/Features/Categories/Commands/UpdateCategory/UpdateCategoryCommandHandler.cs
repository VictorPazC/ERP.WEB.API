using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Categories.Commands.UpdateCategory;

public class UpdateCategoryCommandHandler : IRequestHandler<UpdateCategoryCommand, CategoryDto?>
{
    private readonly ICategoryRepository _repository;

    public UpdateCategoryCommandHandler(ICategoryRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<CategoryDto?> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _repository.GetByIdAsync(request.CategoryDto.CategoryId);

        if (category is null)
            return null;

        category.Name = request.CategoryDto.Name;
        category.Description = request.CategoryDto.Description;
        category.ParentCategoryId = request.CategoryDto.ParentCategoryId;
        category.ImagePath = request.CategoryDto.ImagePath;

        await _repository.UpdateAsync(category);

        return new CategoryDto(
            category.CategoryId,
            category.Name,
            category.Description,
            category.ParentCategoryId,
            category.ParentCategory?.Name,
            category.SubCategories?.Count ?? 0,
            category.Products?.Count ?? 0,
            category.ImagePath
        );
    }
}
