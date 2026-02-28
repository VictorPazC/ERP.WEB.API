using Mediator;

namespace ERP.WEB.Application.Features.Products.Commands.SetStockStatus;

public record SetStockStatusCommand(int ProductId, string? Status) : IRequest<bool>;
