using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Consumptions.Commands.DeleteConsumption;

public class DeleteConsumptionCommandHandler : IRequestHandler<DeleteConsumptionCommand, bool>
{
    private readonly IConsumptionRepository _consumptionRepository;

    public DeleteConsumptionCommandHandler(IConsumptionRepository consumptionRepository)
    {
        _consumptionRepository = consumptionRepository;
    }

    public async ValueTask<bool> Handle(DeleteConsumptionCommand request, CancellationToken cancellationToken)
    {
        var consumption = await _consumptionRepository.GetByIdAsync(request.ConsumptionId);
        if (consumption is null) return false;

        await _consumptionRepository.DeleteAsync(request.ConsumptionId);
        return true;
    }
}
