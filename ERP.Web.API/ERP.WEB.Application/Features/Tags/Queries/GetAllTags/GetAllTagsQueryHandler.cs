using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Tags.Queries.GetAllTags;

public class GetAllTagsQueryHandler : IRequestHandler<GetAllTagsQuery, IEnumerable<TagDto>>
{
    private readonly ITagRepository _repository;

    public GetAllTagsQueryHandler(ITagRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<IEnumerable<TagDto>> Handle(GetAllTagsQuery request, CancellationToken cancellationToken)
    {
        var tags = await _repository.GetAllAsync();

        return tags.Select(t => new TagDto(
            t.TagId,
            t.TagName,
            t.Products.Count
        ));
    }
}
