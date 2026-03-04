using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Promotions.Queries.GetAllPromotions;

public class GetAllPromotionsQueryHandler : IRequestHandler<GetAllPromotionsQuery, CursorPagedResult<PromotionDto>>
{
    private readonly IPromotionRepository _repository;

    public GetAllPromotionsQueryHandler(IPromotionRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<CursorPagedResult<PromotionDto>> Handle(GetAllPromotionsQuery request, CancellationToken cancellationToken)
    {
        var list = await _repository.GetAllAsync(request.Params, cancellationToken);
        var hasMore = list.Count > request.Params.PageSize;
        if (hasMore) list.RemoveAt(list.Count - 1);
        var now = DateTime.UtcNow;
        var nextCursor = hasMore ? CursorHelper.Encode(list[^1].PromoId) : null;
        var items = list.Select(pr => new PromotionDto(pr.PromoId, pr.ProductId, pr.Product?.Name, pr.DiscountPercentage, pr.StartDate, pr.EndDate, pr.StartDate <= now && pr.EndDate >= now));
        return new CursorPagedResult<PromotionDto>(items, nextCursor, hasMore);
    }
}
