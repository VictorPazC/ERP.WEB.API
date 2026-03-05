using Mediator;

namespace ERP.WEB.Application.Features.Orders.Commands.CancelOrder;

public record CancelOrderCommand(int OrderId) : IRequest<bool>;
