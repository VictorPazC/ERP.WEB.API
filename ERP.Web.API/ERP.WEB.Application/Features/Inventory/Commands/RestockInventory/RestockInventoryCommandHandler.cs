using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Inventory.Commands.RestockInventory;

public class RestockInventoryCommandHandler : IRequestHandler<RestockInventoryCommand, InventoryDto?>
{
    private readonly IInventoryRepository _repository;
    private readonly IActivityLogger      _activityLogger;

    public RestockInventoryCommandHandler(IInventoryRepository repository, IActivityLogger activityLogger)
    {
        _repository     = repository;
        _activityLogger = activityLogger;
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

        await _activityLogger.LogAsync(
            "restock",
            $"Reposición: {inventory.Product?.Name ?? "Producto"}",
            $"+{request.Dto.AdditionalStock} unidades — Stock actual: {inventory.CurrentStock}",
            null,
            cancellationToken);

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
