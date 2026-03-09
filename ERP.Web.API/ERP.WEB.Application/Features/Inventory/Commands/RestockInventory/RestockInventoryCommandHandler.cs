using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Inventory.Commands.RestockInventory;

public class RestockInventoryCommandHandler : IRequestHandler<RestockInventoryCommand, InventoryDto?>
{
    private readonly IInventoryRepository _repository;

    public RestockInventoryCommandHandler(IInventoryRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<InventoryDto?> Handle(RestockInventoryCommand request, CancellationToken cancellationToken)
    {
        var inventory = await _repository.GetByIdAsync(request.InventoryId);

        if (inventory is null)
            return null;

        inventory.CurrentStock += request.Dto.AdditionalStock;
        inventory.NeedsRestock = request.Dto.NeedsRestock;
        inventory.LastRestockDate = DateTime.UtcNow;

        await _repository.UpdateAsync(inventory);

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
            inventory.VariantId,
            null  // Variant not loaded in this query
        );
    }
}
