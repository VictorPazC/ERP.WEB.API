using Mediator;

namespace ERP.WEB.Application.Features.Tags.Commands.AddTagToProduct;

public record AddTagToProductCommand(int TagId, int ProductId) : IRequest<bool>;
