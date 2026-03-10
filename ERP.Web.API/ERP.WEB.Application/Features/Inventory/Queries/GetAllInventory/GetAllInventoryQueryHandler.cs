using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Inventory.Queries.GetAllInventory;

public class GetAllInventoryQueryHandler : IRequestHandler<GetAllInventoryQuery, CursorPagedResult<InventoryDto>>
{
    private readonly IInventoryRepository _repository;

    public GetAllInventoryQueryHandler(IInventoryRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<CursorPagedResult<InventoryDto>> Handle(GetAllInventoryQuery request, CancellationToken cancellationToken)
    {
        var list = await _repository.GetAllAsync(request.Params, cancellationToken);
        var hasMore = list.Count > request.Params.PageSize;
        if (hasMore) list.RemoveAt(list.Count - 1);
        var nextCursor = hasMore ? CursorHelper.Encode(list[^1].InventoryId) : null;
        var items = list.Select(i => new InventoryDto(
            i.InventoryId, i.ProductId, i.Product?.Name, i.PurchaseCost, i.SuggestedRetailPrice,
            i.CurrentStock, i.SuggestedRetailPrice - i.PurchaseCost, i.LastRestockDate,
            i.LastSaleDate, i.NeedsRestock, i.VariantId, i.Variant?.Name, i.LowStockThreshold));
        return new CursorPagedResult<InventoryDto>(items, nextCursor, hasMore);
    }
}
