using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Inventory.Queries.GetAllInventory;

public record GetAllInventoryQuery(CursorParams Params) : IRequest<CursorPagedResult<InventoryDto>>;
