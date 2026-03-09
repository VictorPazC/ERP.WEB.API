using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.ProductImages.Queries.GetAllProductImages;

public class GetAllProductImagesQueryHandler : IRequestHandler<GetAllProductImagesQuery, CursorPagedResult<ProductImageDto>>
{
    private readonly IProductImageRepository _repository;

    public GetAllProductImagesQueryHandler(IProductImageRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<CursorPagedResult<ProductImageDto>> Handle(GetAllProductImagesQuery request, CancellationToken cancellationToken)
    {
        var list = await _repository.GetAllAsync(request.Params, cancellationToken);
        var hasMore = list.Count > request.Params.PageSize;
        if (hasMore) list.RemoveAt(list.Count - 1);
        var nextCursor = hasMore ? CursorHelper.Encode(list[^1].ImageId) : null;
        var items = list.Select(i => new ProductImageDto(i.ImageId, i.ProductId, i.ImagePath, i.IsPrimary, i.DisplayOrder, i.RegisteredAt, i.VariantId, i.Variant?.Name));
        return new CursorPagedResult<ProductImageDto>(items, nextCursor, hasMore);
    }
}
