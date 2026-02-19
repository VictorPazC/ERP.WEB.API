using ERP.WEB.Application.Features.Products.Commands.DeleteProduct;
using ERP.WEB.Domain.Interfaces;
using MediatR;

namespace ERP.WEB.Application.Features.Products.Commands.DeleteProduct;

public class DeleteProductCommandHandler : IRequestHandler<DeleteProductCommand, bool>
{
    private readonly IProductRepository _repository;

    public DeleteProductCommandHandler(IProductRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(DeleteProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _repository.GetByIdAsync(request.ProductId);
        
        if (product is null)
            return false;

        await _repository.DeleteAsync(request.ProductId);
        return true;
    }
}