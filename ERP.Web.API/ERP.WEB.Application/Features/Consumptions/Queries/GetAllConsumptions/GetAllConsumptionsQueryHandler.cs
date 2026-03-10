using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Consumptions.Queries.GetAllConsumptions;

public class GetAllConsumptionsQueryHandler : IRequestHandler<GetAllConsumptionsQuery, CursorPagedResult<ConsumptionDto>>
{
    private readonly IConsumptionRepository _consumptionRepository;

    public GetAllConsumptionsQueryHandler(IConsumptionRepository consumptionRepository)
    {
        _consumptionRepository = consumptionRepository;
    }

    public async ValueTask<CursorPagedResult<ConsumptionDto>> Handle(GetAllConsumptionsQuery request, CancellationToken cancellationToken)
    {
        var list = await _consumptionRepository.GetAllAsync(request.Params, cancellationToken);
        var hasMore = list.Count > request.Params.PageSize;
        if (hasMore) list.RemoveAt(list.Count - 1);
        var nextCursor = hasMore ? CursorHelper.Encode(list[^1].ConsumptionId) : null;
        var items = list.Select(c => new ConsumptionDto(
            c.ConsumptionId, c.InventoryId, c.Inventory.ProductId,
            c.Inventory.Product?.Name, c.Inventory.Product?.Category?.Name,
            c.Quantity, c.ConsumedAt, c.Notes, c.PaymentMethod));
        return new CursorPagedResult<ConsumptionDto>(items, nextCursor, hasMore);
    }
}
