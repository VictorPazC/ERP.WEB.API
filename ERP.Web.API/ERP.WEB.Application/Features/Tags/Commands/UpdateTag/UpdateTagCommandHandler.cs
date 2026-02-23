using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Tags.Commands.UpdateTag;

public class UpdateTagCommandHandler : IRequestHandler<UpdateTagCommand, TagDto?>
{
    private readonly ITagRepository _repository;

    public UpdateTagCommandHandler(ITagRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<TagDto?> Handle(UpdateTagCommand request, CancellationToken cancellationToken)
    {
        var tag = await _repository.GetByIdAsync(request.TagDto.TagId);

        if (tag is null)
            return null;

        tag.TagName = request.TagDto.TagName;

        await _repository.UpdateAsync(tag);

        return new TagDto(
            tag.TagId,
            tag.TagName,
            tag.Products.Count
        );
    }
}
