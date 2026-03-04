using Mediator;

namespace ERP.WEB.Application.Features.Orders.Commands.DeleteOrder;

public record DeleteOrderCommand(int OrderId) : IRequest<bool>;
