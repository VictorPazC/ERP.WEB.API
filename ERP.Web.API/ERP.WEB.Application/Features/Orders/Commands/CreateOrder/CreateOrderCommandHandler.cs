using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Orders.Commands.CreateOrder;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, OrderDto>
{
    private readonly IOrderRepository _repo;
    private readonly IActivityLogger  _activityLogger;

    public CreateOrderCommandHandler(IOrderRepository repo, IActivityLogger activityLogger)
    {
        _repo           = repo;
        _activityLogger = activityLogger;
    }

    public async ValueTask<OrderDto> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var items = request.Dto.Items.Select(i => new OrderItem
        {
            InventoryId = i.InventoryId,
            Quantity    = i.Quantity,
            UnitPrice   = i.UnitPrice
        }).ToList();

        var order = new Order
        {
            Status        = "Draft",
            Notes         = request.Dto.Notes,
            PaymentMethod = request.Dto.PaymentMethod,
            TotalAmount   = items.Sum(i => i.Quantity * i.UnitPrice),
            Items         = items
        };

        var saved = await _repo.AddAsync(order, cancellationToken);

        await _activityLogger.LogAsync(
            "order_created",
            $"Pedido #{saved.OrderId} creado",
            $"Total: ${saved.TotalAmount:N2} — {saved.Items.Count} artículo(s)",
            saved.TotalAmount,
            cancellationToken);

        return new OrderDto(
            saved.OrderId,
            saved.Status,
            saved.Notes,
            saved.TotalAmount,
            saved.CreatedAt,
            saved.Items.Select(i => new OrderItemDto(
                i.OrderItemId,
                i.InventoryId,
                string.Empty,
                i.Quantity,
                i.UnitPrice,
                i.Quantity * i.UnitPrice
            )).ToList(),
            saved.PaymentMethod
        );
    }
}
