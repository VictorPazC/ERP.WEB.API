using Mediator;

namespace ERP.WEB.Application.Features.Inventory.Commands.DeleteInventory;

public record DeleteInventoryCommand(int InventoryId) : IRequest<bool>;
