using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Brands.Queries.GetAllBrands;

public class GetAllBrandsQueryHandler : IRequestHandler<GetAllBrandsQuery, CursorPagedResult<BrandDto>>
{
    private readonly IBrandRepository _repository;

    public GetAllBrandsQueryHandler(IBrandRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<CursorPagedResult<BrandDto>> Handle(GetAllBrandsQuery request, CancellationToken cancellationToken)
    {
        var list = await _repository.GetAllAsync(request.Params, cancellationToken);
        var hasMore = list.Count > request.Params.PageSize;
        if (hasMore) list.RemoveAt(list.Count - 1);
        var nextCursor = hasMore ? CursorHelper.Encode(list[^1].BrandId) : null;
        var items = list.Select(b => new BrandDto(b.BrandId, b.Name, b.Description, b.Products?.Count ?? 0, b.IsDefault));
        return new CursorPagedResult<BrandDto>(items, nextCursor, hasMore);
    }
}
