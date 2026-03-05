using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Orders.Queries.GetAllOrders;

public record GetAllOrdersQuery(CursorParams Params) : IRequest<CursorPagedResult<OrderDto>>;
