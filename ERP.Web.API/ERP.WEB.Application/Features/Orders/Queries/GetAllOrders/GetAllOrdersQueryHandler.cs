using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Orders.Queries.GetAllOrders;

public class GetAllOrdersQueryHandler : IRequestHandler<GetAllOrdersQuery, CursorPagedResult<OrderDto>>
{
    private readonly IOrderRepository _repo;

    public GetAllOrdersQueryHandler(IOrderRepository repo) => _repo = repo;

    public async ValueTask<CursorPagedResult<OrderDto>> Handle(GetAllOrdersQuery request, CancellationToken cancellationToken)
    {
        var list    = await _repo.GetAllAsync(request.Params, cancellationToken);
        var hasMore = list.Count > request.Params.PageSize;
        if (hasMore) list.RemoveAt(list.Count - 1);

        var nextCursor = hasMore ? CursorHelper.Encode(list[^1].OrderId) : null;

        var items = list.Select(o => new OrderDto(
            o.OrderId,
            o.Status,
            o.Notes,
            o.TotalAmount,
            o.CreatedAt,
            o.Items.Select(i => new OrderItemDto(
                i.OrderItemId,
                i.InventoryId,
                i.Inventory?.Product?.Name ?? "Unknown",
                i.Quantity,
                i.UnitPrice,
                i.Quantity * i.UnitPrice
            )).ToList(),
            o.PaymentMethod
        ));

        return new CursorPagedResult<OrderDto>(items, nextCursor, hasMore);
    }
}
