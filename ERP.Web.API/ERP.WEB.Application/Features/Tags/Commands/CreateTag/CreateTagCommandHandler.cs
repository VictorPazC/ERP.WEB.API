using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Tags.Commands.CreateTag;

public class CreateTagCommandHandler : IRequestHandler<CreateTagCommand, TagDto>
{
    private readonly ITagRepository _repository;

    public CreateTagCommandHandler(ITagRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<TagDto> Handle(CreateTagCommand request, CancellationToken cancellationToken)
    {
        var tag = new Tag
        {
            TagName = request.TagDto.TagName
        };

        var created = await _repository.AddAsync(tag);

        return new TagDto(
            created.TagId,
            created.TagName,
            created.Products.Count
        );
    }
}
