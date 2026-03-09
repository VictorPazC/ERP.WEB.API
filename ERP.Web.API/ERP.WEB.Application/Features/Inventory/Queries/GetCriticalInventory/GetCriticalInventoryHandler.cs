using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Inventory.Queries.GetCriticalInventory;

public class GetCriticalInventoryHandler : IRequestHandler<GetCriticalInventoryQuery, IEnumerable<CriticalInventoryDto>>
{
    private readonly IInventoryRepository _repo;

    public GetCriticalInventoryHandler(IInventoryRepository repo) => _repo = repo;

    public async ValueTask<IEnumerable<CriticalInventoryDto>> Handle(
        GetCriticalInventoryQuery request, CancellationToken ct)
    {
        var items = await _repo.GetCriticalAsync(request.Threshold, ct);
        return items.Select(i => new CriticalInventoryDto(
            i.InventoryId, i.ProductId, i.Product?.Name, i.CurrentStock,
            i.VariantId, i.Variant?.Name));
    }
}
