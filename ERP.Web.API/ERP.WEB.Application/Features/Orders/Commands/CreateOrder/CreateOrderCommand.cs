using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Orders.Commands.CreateOrder;

public record CreateOrderCommand(CreateOrderDto Dto) : IRequest<OrderDto>;
