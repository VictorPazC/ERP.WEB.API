using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Consumptions.Queries.GetAllConsumptions;

public class GetAllConsumptionsQueryHandler : IRequestHandler<GetAllConsumptionsQuery, IEnumerable<ConsumptionDto>>
{
    private readonly IConsumptionRepository _consumptionRepository;

    public GetAllConsumptionsQueryHandler(IConsumptionRepository consumptionRepository)
    {
        _consumptionRepository = consumptionRepository;
    }

    public async ValueTask<IEnumerable<ConsumptionDto>> Handle(GetAllConsumptionsQuery request, CancellationToken cancellationToken)
    {
        var consumptions = await _consumptionRepository.GetAllAsync();
        return consumptions.Select(c => new ConsumptionDto(
            c.ConsumptionId,
            c.InventoryId,
            c.Inventory.ProductId,
            c.Inventory.Product?.Name,
            c.Inventory.Product?.Category?.Name,
            c.Quantity,
            c.ConsumedAt,
            c.Notes
        ));
    }
}
