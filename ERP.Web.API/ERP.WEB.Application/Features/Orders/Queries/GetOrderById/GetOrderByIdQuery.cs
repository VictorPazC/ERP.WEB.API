using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Orders.Queries.GetOrderById;

public record GetOrderByIdQuery(int OrderId) : IRequest<OrderDto?>;
