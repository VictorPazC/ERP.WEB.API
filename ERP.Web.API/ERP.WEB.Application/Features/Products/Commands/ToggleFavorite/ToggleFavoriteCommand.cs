using Mediator;

namespace ERP.WEB.Application.Features.Products.Commands.ToggleFavorite;

public record ToggleFavoriteCommand(int ProductId) : IRequest<bool?>;
