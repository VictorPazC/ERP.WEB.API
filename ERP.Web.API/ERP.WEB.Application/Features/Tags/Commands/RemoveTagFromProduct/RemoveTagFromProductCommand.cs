using Mediator;

namespace ERP.WEB.Application.Features.Tags.Commands.RemoveTagFromProduct;

public record RemoveTagFromProductCommand(int TagId, int ProductId) : IRequest<bool>;
