using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Inventory.Commands.DeleteInventory;

public class DeleteInventoryCommandHandler : IRequestHandler<DeleteInventoryCommand, bool>
{
    private readonly IInventoryRepository _repository;

    public DeleteInventoryCommandHandler(IInventoryRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<bool> Handle(DeleteInventoryCommand request, CancellationToken cancellationToken)
    {
        var inventory = await _repository.GetByIdAsync(request.InventoryId);

        if (inventory is null)
            return false;

        await _repository.DeleteAsync(request.InventoryId);
        return true;
    }
}
