using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Inventory.Queries.GetInventoryByProductId;

public class GetInventoryByProductIdQueryHandler : IRequestHandler<GetInventoryByProductIdQuery, InventoryDto?>
{
    private readonly IInventoryRepository _repository;

    public GetInventoryByProductIdQueryHandler(IInventoryRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<InventoryDto?> Handle(GetInventoryByProductIdQuery request, CancellationToken cancellationToken)
    {
        var inventory = await _repository.GetByProductIdAsync(request.ProductId);

        if (inventory is null)
            return null;

        return new InventoryDto(
            inventory.InventoryId,
            inventory.ProductId,
            inventory.Product?.Name,
            inventory.PurchaseCost,
            inventory.SuggestedRetailPrice,
            inventory.CurrentStock,
            inventory.SuggestedRetailPrice - inventory.PurchaseCost,
            inventory.LastRestockDate,
            inventory.LastSaleDate,
            inventory.NeedsRestock,
            inventory.VariantId
        );
    }
}
