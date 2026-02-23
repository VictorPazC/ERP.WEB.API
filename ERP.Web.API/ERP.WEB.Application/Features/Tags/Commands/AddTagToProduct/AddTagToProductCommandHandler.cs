using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Tags.Commands.AddTagToProduct;

public class AddTagToProductCommandHandler : IRequestHandler<AddTagToProductCommand, bool>
{
    private readonly ITagRepository _repository;

    public AddTagToProductCommandHandler(ITagRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<bool> Handle(AddTagToProductCommand request, CancellationToken cancellationToken)
    {
        await _repository.AddTagToProductAsync(request.TagId, request.ProductId);
        return true;
    }
}
