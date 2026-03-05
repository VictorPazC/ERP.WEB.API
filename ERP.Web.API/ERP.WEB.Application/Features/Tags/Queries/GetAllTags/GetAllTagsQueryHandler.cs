using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Tags.Queries.GetAllTags;

public class GetAllTagsQueryHandler : IRequestHandler<GetAllTagsQuery, CursorPagedResult<TagDto>>
{
    private readonly ITagRepository _repository;

    public GetAllTagsQueryHandler(ITagRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<CursorPagedResult<TagDto>> Handle(GetAllTagsQuery request, CancellationToken cancellationToken)
    {
        var list = await _repository.GetAllAsync(request.Params, cancellationToken);
        var hasMore = list.Count > request.Params.PageSize;
        if (hasMore) list.RemoveAt(list.Count - 1);
        var nextCursor = hasMore ? CursorHelper.Encode(list[^1].TagId) : null;
        var items = list.Select(t => new TagDto(t.TagId, t.TagName, t.Products.Count));
        return new CursorPagedResult<TagDto>(items, nextCursor, hasMore);
    }
}
