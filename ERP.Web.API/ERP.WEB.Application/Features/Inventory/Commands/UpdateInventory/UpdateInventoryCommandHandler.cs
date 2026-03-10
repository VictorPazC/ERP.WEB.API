using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Inventory.Commands.UpdateInventory;

public class UpdateInventoryCommandHandler : IRequestHandler<UpdateInventoryCommand, InventoryDto?>
{
    private readonly IInventoryRepository _repository;

    public UpdateInventoryCommandHandler(IInventoryRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<InventoryDto?> Handle(UpdateInventoryCommand request, CancellationToken cancellationToken)
    {
        var inventory = await _repository.GetByIdAsync(request.InventoryDto.InventoryId);

        if (inventory is null)
            return null;

        inventory.PurchaseCost = request.InventoryDto.PurchaseCost;
        inventory.SuggestedRetailPrice = request.InventoryDto.SuggestedRetailPrice;
        inventory.CurrentStock = request.InventoryDto.CurrentStock;
        inventory.LastRestockDate = request.InventoryDto.LastRestockDate;
        inventory.LastSaleDate = request.InventoryDto.LastSaleDate;
        inventory.NeedsRestock = request.InventoryDto.NeedsRestock;
        inventory.LowStockThreshold = request.InventoryDto.LowStockThreshold;
        inventory.VariantId = request.InventoryDto.VariantId;

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
            inventory.Variant?.Name,
            inventory.LowStockThreshold
        );
    }
}
