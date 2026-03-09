using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Inventory.Commands.CreateInventory;

public class CreateInventoryCommandHandler : IRequestHandler<CreateInventoryCommand, InventoryDto>
{
    private readonly IInventoryRepository _repository;

    public CreateInventoryCommandHandler(IInventoryRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<InventoryDto> Handle(CreateInventoryCommand request, CancellationToken cancellationToken)
    {
        var inventory = new ERP.WEB.Domain.Entities.Inventory
        {
            ProductId = request.InventoryDto.ProductId,
            PurchaseCost = request.InventoryDto.PurchaseCost,
            SuggestedRetailPrice = request.InventoryDto.SuggestedRetailPrice,
            CurrentStock = request.InventoryDto.CurrentStock,
            LastRestockDate = request.InventoryDto.LastRestockDate,
            LastSaleDate = request.InventoryDto.LastSaleDate,
            VariantId = request.InventoryDto.VariantId
        };

        var created = await _repository.AddAsync(inventory);

        return new InventoryDto(
            created.InventoryId,
            created.ProductId,
            created.Product?.Name,
            created.PurchaseCost,
            created.SuggestedRetailPrice,
            created.CurrentStock,
            created.SuggestedRetailPrice - created.PurchaseCost,
            created.LastRestockDate,
            created.LastSaleDate,
            created.NeedsRestock,
            created.VariantId,
            null  // Variant name not needed immediately after create
        );
    }
}
