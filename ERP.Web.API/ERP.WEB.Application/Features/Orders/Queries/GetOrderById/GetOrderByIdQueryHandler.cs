using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Orders.Queries.GetOrderById;

public class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, OrderDto?>
{
    private readonly IOrderRepository _repo;

    public GetOrderByIdQueryHandler(IOrderRepository repo) => _repo = repo;

    public async ValueTask<OrderDto?> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var order = await _repo.GetByIdAsync(request.OrderId, cancellationToken);
        if (order is null) return null;

        return new OrderDto(
            order.OrderId,
            order.Status,
            order.Notes,
            order.TotalAmount,
            order.CreatedAt,
            order.Items.Select(i => new OrderItemDto(
                i.OrderItemId,
                i.InventoryId,
                i.Inventory?.Product?.Name ?? "Unknown",
                i.Quantity,
                i.UnitPrice,
                i.Quantity * i.UnitPrice
            )).ToList()
        );
    }
}
