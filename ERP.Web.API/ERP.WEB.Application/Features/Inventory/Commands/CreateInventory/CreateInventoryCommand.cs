using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Inventory.Commands.CreateInventory;

public record CreateInventoryCommand(CreateInventoryDto InventoryDto) : IRequest<InventoryDto>;
