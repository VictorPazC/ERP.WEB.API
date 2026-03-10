using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Products.Queries.GetAllProducts;

public class GetAllProductsQueryHandler : IRequestHandler<GetAllProductsQuery, CursorPagedResult<ProductDto>>
{
    private readonly IProductRepository _repository;

    public GetAllProductsQueryHandler(IProductRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<CursorPagedResult<ProductDto>> Handle(GetAllProductsQuery request, CancellationToken cancellationToken)
    {
        var list = await _repository.GetAllAsync(request.Params, cancellationToken);
        var hasMore = list.Count > request.Params.PageSize;
        if (hasMore) list.RemoveAt(list.Count - 1);
        var nextCursor = hasMore ? CursorHelper.Encode(list[^1].ProductId) : null;
        var items = list.Select(p => new ProductDto(
            p.ProductId, p.Name, p.Description, p.BrandId, p.Brand?.Name,
            p.ReferenceLink, p.PurchaseLocation, p.Status, p.CategoryId, p.Category?.Name,
            p.CreatedAt, p.IsFavorite, p.StockStatus, p.Inventories.Any(),
            p.Inventories.Any() ? p.Inventories.Sum(i => i.CurrentStock) : (int?)null, p.Variants.Count));
        return new CursorPagedResult<ProductDto>(items, nextCursor, hasMore);
    }
}
