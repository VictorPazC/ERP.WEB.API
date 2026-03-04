using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Consumptions.Commands.UpdateConsumption;

// Decisión 7B: ajuste de stock por delta = nuevaQuantity - viejaQuantity.
//   delta > 0 → más consumo → baja stock.
//   delta < 0 → menos consumo → sube stock.
// consumption.Inventory ya viene cargado por ConsumptionRepository.GetByIdAsync (Include).
// Un solo UpdateAsync → SaveChangesAsync persiste Consumption e Inventory en la misma transacción.
public class UpdateConsumptionCommandHandler : IRequestHandler<UpdateConsumptionCommand, bool>
{
    private readonly IConsumptionRepository _consumptionRepository;

    public UpdateConsumptionCommandHandler(IConsumptionRepository consumptionRepository)
    {
        _consumptionRepository = consumptionRepository;
    }

    public async ValueTask<bool> Handle(UpdateConsumptionCommand request, CancellationToken cancellationToken)
    {
        var consumption = await _consumptionRepository.GetByIdAsync(request.ConsumptionId);
        if (consumption is null)
            return false;

        // Calcula delta y ajusta stock (nunca por debajo de 0).
        var delta = request.Quantity - consumption.Quantity;
        consumption.Inventory.CurrentStock = Math.Max(0, consumption.Inventory.CurrentStock - delta);

        // Actualiza campos del consumo.
        consumption.Quantity = request.Quantity;
        consumption.Notes    = request.Notes;

        await _consumptionRepository.UpdateAsync(consumption);
        return true;
    }
}
