using Mediator;

namespace ERP.WEB.Application.Features.Consumptions.Commands.UpdateConsumption;

// Decisión 7B: alcance de edición = Quantity + Notes con ajuste de stock (delta).
// Retorna false si el consumo no existe.
public record UpdateConsumptionCommand(int ConsumptionId, int Quantity, string? Notes) : IRequest<bool>;
