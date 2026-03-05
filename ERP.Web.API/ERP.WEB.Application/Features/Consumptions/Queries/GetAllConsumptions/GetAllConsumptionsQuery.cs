using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Consumptions.Queries.GetAllConsumptions;

public record GetAllConsumptionsQuery(CursorParams Params) : IRequest<CursorPagedResult<ConsumptionDto>>;
