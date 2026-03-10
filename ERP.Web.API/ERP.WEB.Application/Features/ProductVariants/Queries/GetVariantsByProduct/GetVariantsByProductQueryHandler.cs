using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.ProductVariants.Queries.GetVariantsByProduct;

// Decisión 6B: reemplaza ApplicationDbContext por IProductVariantRepository.
public class GetVariantsByProductQueryHandler : IRequestHandler<GetVariantsByProductQuery, CursorPagedResult<ProductVariantDto>>
{
    private readonly IProductVariantRepository _repo;

    public GetVariantsByProductQueryHandler(IProductVariantRepository repo)
    {
        _repo = repo;
    }

    public async ValueTask<CursorPagedResult<ProductVariantDto>> Handle(GetVariantsByProductQuery request, CancellationToken cancellationToken)
    {
        var list = await _repo.GetAllByProductAsync(request.ProductId, request.Params, cancellationToken);
        var hasMore = list.Count > request.Params.PageSize;
        if (hasMore) list.RemoveAt(list.Count - 1);
        var nextCursor = hasMore ? CursorHelper.Encode(list[^1].VariantId) : null;
        var items = list.Select(v => new ProductVariantDto(
            v.VariantId, v.ProductId, v.Name, v.Description, v.CreatedAt,
            v.Inventories.Any(), v.Inventories.Any() ? v.Inventories.Sum(i => i.CurrentStock) : (int?)null,
            v.Images.FirstOrDefault(i => i.IsPrimary)?.ImagePath ?? v.Images.FirstOrDefault()?.ImagePath,
            v.StockStatus));
        return new CursorPagedResult<ProductVariantDto>(items, nextCursor, hasMore);
    }
}
