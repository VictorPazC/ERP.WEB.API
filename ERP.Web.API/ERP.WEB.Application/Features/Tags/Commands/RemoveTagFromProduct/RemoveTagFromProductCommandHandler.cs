using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Tags.Commands.RemoveTagFromProduct;

public class RemoveTagFromProductCommandHandler : IRequestHandler<RemoveTagFromProductCommand, bool>
{
    private readonly ITagRepository _repository;

    public RemoveTagFromProductCommandHandler(ITagRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<bool> Handle(RemoveTagFromProductCommand request, CancellationToken cancellationToken)
    {
        await _repository.RemoveTagFromProductAsync(request.TagId, request.ProductId);
        return true;
    }
}
