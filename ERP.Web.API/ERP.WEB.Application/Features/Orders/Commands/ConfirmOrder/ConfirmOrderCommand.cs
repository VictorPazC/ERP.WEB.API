using Mediator;

namespace ERP.WEB.Application.Features.Orders.Commands.ConfirmOrder;

public record ConfirmOrderCommand(int OrderId) : IRequest<bool>;
