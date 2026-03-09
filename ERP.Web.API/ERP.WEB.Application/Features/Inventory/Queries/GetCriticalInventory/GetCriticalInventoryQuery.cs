using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Inventory.Queries.GetCriticalInventory;

public record GetCriticalInventoryQuery(int Threshold = 5) : IRequest<IEnumerable<CriticalInventoryDto>>;
