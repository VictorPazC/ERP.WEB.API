using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Tags.Queries.GetTagsByProductId;

public class GetTagsByProductIdQueryHandler : IRequestHandler<GetTagsByProductIdQuery, IEnumerable<TagDto>>
{
    private readonly ITagRepository _repository;

    public GetTagsByProductIdQueryHandler(ITagRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<IEnumerable<TagDto>> Handle(GetTagsByProductIdQuery request, CancellationToken cancellationToken)
    {
        var tags = await _repository.GetByProductIdAsync(request.ProductId);

        return tags.Select(t => new TagDto(
            t.TagId,
            t.TagName,
            t.Products.Count
        ));
    }
}
