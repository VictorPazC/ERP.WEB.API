using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Tags.Commands.DeleteTag;

public class DeleteTagCommandHandler : IRequestHandler<DeleteTagCommand, bool>
{
    private readonly ITagRepository _repository;

    public DeleteTagCommandHandler(ITagRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<bool> Handle(DeleteTagCommand request, CancellationToken cancellationToken)
    {
        var tag = await _repository.GetByIdAsync(request.TagId);

        if (tag is null)
            return false;

        await _repository.DeleteAsync(request.TagId);
        return true;
    }
}
