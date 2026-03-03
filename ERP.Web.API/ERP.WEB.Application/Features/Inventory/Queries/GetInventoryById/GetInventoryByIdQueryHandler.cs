using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Inventory.Queries.GetInventoryById;

public class GetInventoryByIdQueryHandler : IRequestHandler<GetInventoryByIdQuery, InventoryDto?>
{
    private readonly IInventoryRepository _repository;

    public GetInventoryByIdQueryHandler(IInventoryRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<InventoryDto?> Handle(GetInventoryByIdQuery request, CancellationToken cancellationToken)
    {
        var inventory = await _repository.GetByIdAsync(request.InventoryId);

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
