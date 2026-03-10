using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Categories.Commands.CreateCategory;

public class CreateCategoryCommandHandler : IRequestHandler<CreateCategoryCommand, CategoryDto>
{
    private readonly ICategoryRepository _repository;

    public CreateCategoryCommandHandler(ICategoryRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<CategoryDto> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = new Category
        {
            Name = request.CategoryDto.Name,
            Description = request.CategoryDto.Description,
            ParentCategoryId = request.CategoryDto.ParentCategoryId,
            ImagePath = request.CategoryDto.ImagePath
        };

        var created = await _repository.AddAsync(category);

        return new CategoryDto(
            created.CategoryId,
            created.Name,
            created.Description,
            created.ParentCategoryId,
            created.ParentCategory?.Name,
            0,
            0,
            created.ImagePath
        );
    }
}
