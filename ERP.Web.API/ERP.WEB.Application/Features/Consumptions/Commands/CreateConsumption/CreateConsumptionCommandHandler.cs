using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Consumptions.Commands.CreateConsumption;

public class CreateConsumptionCommandHandler : IRequestHandler<CreateConsumptionCommand, ConsumptionDto>
{
    private readonly IConsumptionRepository _consumptionRepository;
    private readonly IInventoryRepository   _inventoryRepository;
    private readonly IActivityLogger        _activityLogger;

    public CreateConsumptionCommandHandler(
        IConsumptionRepository consumptionRepository,
        IInventoryRepository inventoryRepository,
        IActivityLogger activityLogger)
    {
        _consumptionRepository = consumptionRepository;
        _inventoryRepository   = inventoryRepository;
        _activityLogger        = activityLogger;
    }

    public async ValueTask<ConsumptionDto> Handle(CreateConsumptionCommand request, CancellationToken cancellationToken)
    {
        var dto = request.ConsumptionDto;

        var inventory = await _inventoryRepository.GetByIdAsync(dto.InventoryId)
            ?? throw new InvalidOperationException($"Inventory {dto.InventoryId} not found.");

        // Reduce stock and mark for restock
        inventory.CurrentStock = Math.Max(0, inventory.CurrentStock - dto.Quantity);
        inventory.NeedsRestock = true;
        await _inventoryRepository.UpdateAsync(inventory);

        var consumption = new Consumption
        {
            InventoryId = dto.InventoryId,
            Quantity = dto.Quantity,
            ConsumedAt = dto.ConsumedAt,
            Notes = dto.Notes,
        };

        var created = await _consumptionRepository.AddAsync(consumption);

        var ganancia = inventory.SuggestedRetailPrice * dto.Quantity;
        await _activityLogger.LogAsync(
            "consumption",
            $"Consumo: {inventory.Product?.Name ?? "Producto"}",
            $"{dto.Quantity} unidad(es) consumida(s)",
            ganancia,
            cancellationToken);

        return new ConsumptionDto(
            created.ConsumptionId,
            created.InventoryId,
            inventory.ProductId,
            inventory.Product?.Name,
            inventory.Product?.Category?.Name,
            created.Quantity,
            created.ConsumedAt,
            created.Notes
        );
    }
}
