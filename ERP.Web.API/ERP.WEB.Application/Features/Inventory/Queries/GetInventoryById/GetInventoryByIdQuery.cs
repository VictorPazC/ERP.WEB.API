using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Inventory.Queries.GetInventoryById;

public record GetInventoryByIdQuery(int InventoryId) : IRequest<InventoryDto?>;
