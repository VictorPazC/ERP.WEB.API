using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Inventory.Queries.GetAllInventory;

public class GetAllInventoryQueryHandler : IRequestHandler<GetAllInventoryQuery, IEnumerable<InventoryDto>>
{
    private readonly IInventoryRepository _repository;

    public GetAllInventoryQueryHandler(IInventoryRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<IEnumerable<InventoryDto>> Handle(GetAllInventoryQuery request, CancellationToken cancellationToken)
    {
        var inventories = await _repository.GetAllAsync();

        return inventories.Select(i => new InventoryDto(
            i.InventoryId,
            i.ProductId,
            i.Product?.Name,
            i.PurchaseCost,
            i.SuggestedRetailPrice,
            i.CurrentStock,
            i.SuggestedRetailPrice - i.PurchaseCost,
            i.LastRestockDate,
            i.LastSaleDate,
            i.NeedsRestock,
            i.VariantId
        ));
    }
}
