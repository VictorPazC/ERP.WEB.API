using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Consumptions.Commands.CreateConsumption;

public record CreateConsumptionCommand(CreateConsumptionDto ConsumptionDto) : IRequest<ConsumptionDto>;
