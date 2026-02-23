using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Inventory.Commands.UpdateInventory;

public record UpdateInventoryCommand(UpdateInventoryDto InventoryDto) : IRequest<InventoryDto?>;
