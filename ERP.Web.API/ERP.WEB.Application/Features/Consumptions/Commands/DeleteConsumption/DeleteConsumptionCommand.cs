using Mediator;

namespace ERP.WEB.Application.Features.Consumptions.Commands.DeleteConsumption;

public record DeleteConsumptionCommand(int ConsumptionId) : IRequest<bool>;
