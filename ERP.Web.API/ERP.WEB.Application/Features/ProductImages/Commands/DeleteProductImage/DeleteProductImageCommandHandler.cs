using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.ProductImages.Commands.DeleteProductImage;

public class DeleteProductImageCommandHandler : IRequestHandler<DeleteProductImageCommand, bool>
{
    private readonly IProductImageRepository _repository;

    public DeleteProductImageCommandHandler(IProductImageRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<bool> Handle(DeleteProductImageCommand request, CancellationToken cancellationToken)
    {
        var image = await _repository.GetByIdAsync(request.ImageId);

        if (image is null)
            return false;

        await _repository.DeleteAsync(request.ImageId);
        return true;
    }
}
