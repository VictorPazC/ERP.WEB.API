using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Orders.Commands.CancelOrder;

/// <summary>
/// Cancela una Order (Draft o Confirmed).
/// Si estaba Confirmed, devuelve el stock a Inventory (entidades tracked — un solo SaveChangesAsync).
/// </summary>
public class CancelOrderCommandHandler : IRequestHandler<CancelOrderCommand, bool>
{
    private readonly IOrderRepository     _orderRepo;
    private readonly IInventoryRepository _inventoryRepo;

    public CancelOrderCommandHandler(IOrderRepository orderRepo, IInventoryRepository inventoryRepo)
    {
        _orderRepo     = orderRepo;
        _inventoryRepo = inventoryRepo;
    }

    public async ValueTask<bool> Handle(CancelOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _orderRepo.GetByIdAsync(request.OrderId, cancellationToken);
        if (order is null || order.Status == "Cancelled") return false;

        // Si estaba Confirmed, devolver stock
        if (order.Status == "Confirmed")
        {
            foreach (var item in order.Items)
            {
                var inv = await _inventoryRepo.GetByIdAsync(item.InventoryId);
                if (inv is not null)
                {
                    inv.CurrentStock += item.Quantity;
                    inv.NeedsRestock  = false;
                }
            }
        }

        order.Status = "Cancelled";
        await _orderRepo.UpdateAsync(order, cancellationToken);

        return true;
    }
}
