using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using Mediator;
using InventoryEntity = ERP.WEB.Domain.Entities.Inventory;

namespace ERP.WEB.Application.Features.Orders.Commands.ConfirmOrder;

/// <summary>
/// Confirma una Order en estado Draft:
/// 1. Valida que todos los ítems tengan stock suficiente.
/// 2. Reduce CurrentStock de cada Inventory en memoria (entidades tracked).
/// 3. Cambia Status → "Confirmed".
/// 4. Llama SaveChangesAsync UNA sola vez — atomicidad via EF Core unit-of-work.
/// </summary>
public class ConfirmOrderCommandHandler : IRequestHandler<ConfirmOrderCommand, bool>
{
    private readonly IOrderRepository     _orderRepo;
    private readonly IInventoryRepository _inventoryRepo;

    public ConfirmOrderCommandHandler(IOrderRepository orderRepo, IInventoryRepository inventoryRepo)
    {
        _orderRepo     = orderRepo;
        _inventoryRepo = inventoryRepo;
    }

    public async ValueTask<bool> Handle(ConfirmOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _orderRepo.GetByIdAsync(request.OrderId, cancellationToken);
        if (order is null || order.Status != "Draft") return false;

        // Paso 1: cargar todos los inventarios y validar stock
        var inventories = new Dictionary<int, InventoryEntity>();
        foreach (var item in order.Items)
        {
            var inv = await _inventoryRepo.GetByIdAsync(item.InventoryId);
            if (inv is null || inv.CurrentStock < item.Quantity) return false;
            inventories[item.InventoryId] = inv;
        }

        // Paso 2: reducir stock en memoria (entidades ya tracked por el mismo DbContext)
        foreach (var item in order.Items)
        {
            var inv = inventories[item.InventoryId];
            inv.CurrentStock -= item.Quantity;
            inv.LastSaleDate  = DateTime.UtcNow;
            inv.NeedsRestock  = inv.CurrentStock == 0;
        }

        // Paso 3: confirmar orden — SaveChangesAsync guarda orden + inventarios en una sola transacción
        order.Status = "Confirmed";
        await _orderRepo.UpdateAsync(order, cancellationToken);

        return true;
    }
}
