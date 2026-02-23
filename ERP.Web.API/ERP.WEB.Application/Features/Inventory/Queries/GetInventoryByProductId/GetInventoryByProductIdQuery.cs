using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Inventory.Queries.GetInventoryByProductId;

public record GetInventoryByProductIdQuery(int ProductId) : IRequest<InventoryDto?>;
