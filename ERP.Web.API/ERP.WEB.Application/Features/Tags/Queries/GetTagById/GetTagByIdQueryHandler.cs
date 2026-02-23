using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Tags.Queries.GetTagById;

public class GetTagByIdQueryHandler : IRequestHandler<GetTagByIdQuery, TagDto?>
{
    private readonly ITagRepository _repository;

    public GetTagByIdQueryHandler(ITagRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<TagDto?> Handle(GetTagByIdQuery request, CancellationToken cancellationToken)
    {
        var tag = await _repository.GetByIdAsync(request.TagId);

        if (tag is null)
            return null;

        return new TagDto(
            tag.TagId,
            tag.TagName,
            tag.Products.Count
        );
    }
}
