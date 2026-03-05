using ERP.WEB.Domain.Enums;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Products.Commands.SetStockStatus;

// Decisión 5A: valida el valor de Status contra el enum StockStatus antes de persistir.
// Devuelve false si el valor no es válido (FASE 3 — FluentValidation devolverá 400 con mensaje claro).
public class SetStockStatusCommandHandler : IRequestHandler<SetStockStatusCommand, bool>
{
    private readonly IProductRepository _repository;

    public SetStockStatusCommandHandler(IProductRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<bool> Handle(SetStockStatusCommand request, CancellationToken cancellationToken)
    {
        // Rechaza valores que no coincidan con los definidos en el enum.
        if (!Enum.TryParse<StockStatus>(request.Status, ignoreCase: true, out _))
            return false;

        return await _repository.SetStockStatusAsync(request.ProductId, request.Status);
    }
}
