using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Orders.Commands.DeleteOrder;

/// <summary>Solo se pueden eliminar Orders en estado Draft.</summary>
public class DeleteOrderCommandHandler : IRequestHandler<DeleteOrderCommand, bool>
{
    private readonly IOrderRepository _repo;

    public DeleteOrderCommandHandler(IOrderRepository repo) => _repo = repo;

    public async ValueTask<bool> Handle(DeleteOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _repo.GetByIdAsync(request.OrderId, cancellationToken);
        if (order is null || order.Status != "Draft") return false;

        await _repo.DeleteAsync(request.OrderId, cancellationToken);
        return true;
    }
}
