using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Inventory.Commands.RestockInventory;

public record RestockInventoryCommand(int InventoryId, RestockInventoryDto Dto) : IRequest<InventoryDto?>;
