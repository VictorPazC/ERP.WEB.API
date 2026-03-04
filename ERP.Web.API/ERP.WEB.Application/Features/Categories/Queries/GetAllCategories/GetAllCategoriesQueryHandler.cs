using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Categories.Queries.GetAllCategories;

public class GetAllCategoriesQueryHandler : IRequestHandler<GetAllCategoriesQuery, CursorPagedResult<CategoryDto>>
{
    private readonly ICategoryRepository _repository;

    public GetAllCategoriesQueryHandler(ICategoryRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<CursorPagedResult<CategoryDto>> Handle(GetAllCategoriesQuery request, CancellationToken cancellationToken)
    {
        var list = await _repository.GetAllAsync(request.Params, cancellationToken);
        var hasMore = list.Count > request.Params.PageSize;
        if (hasMore) list.RemoveAt(list.Count - 1);
        var nextCursor = hasMore ? CursorHelper.Encode(list[^1].CategoryId) : null;
        var items = list.Select(c => new CategoryDto(c.CategoryId, c.Name, c.Description, c.ParentCategoryId, c.ParentCategory?.Name, c.SubCategories?.Count ?? 0, c.Products?.Count ?? 0));
        return new CursorPagedResult<CategoryDto>(items, nextCursor, hasMore);
    }
}
