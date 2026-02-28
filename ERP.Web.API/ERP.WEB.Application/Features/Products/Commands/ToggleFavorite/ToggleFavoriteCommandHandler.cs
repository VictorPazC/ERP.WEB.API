using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Products.Commands.ToggleFavorite;

public class ToggleFavoriteCommandHandler : IRequestHandler<ToggleFavoriteCommand, bool?>
{
    private readonly IProductRepository _repository;

    public ToggleFavoriteCommandHandler(IProductRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<bool?> Handle(ToggleFavoriteCommand request, CancellationToken cancellationToken)
    {
        return await _repository.ToggleFavoriteAsync(request.ProductId);
    }
}
