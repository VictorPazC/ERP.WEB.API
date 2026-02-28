using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Products.Commands.SetStockStatus;

public class SetStockStatusCommandHandler : IRequestHandler<SetStockStatusCommand, bool>
{
    private readonly IProductRepository _repository;

    public SetStockStatusCommandHandler(IProductRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<bool> Handle(SetStockStatusCommand request, CancellationToken cancellationToken)
    {
        return await _repository.SetStockStatusAsync(request.ProductId, request.Status);
    }
}
