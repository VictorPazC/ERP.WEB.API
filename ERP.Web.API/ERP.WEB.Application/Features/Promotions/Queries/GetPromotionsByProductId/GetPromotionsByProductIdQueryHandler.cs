using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Promotions.Queries.GetPromotionsByProductId;

public class GetPromotionsByProductIdQueryHandler : IRequestHandler<GetPromotionsByProductIdQuery, IEnumerable<PromotionDto>>
{
    private readonly IPromotionRepository _repository;

    public GetPromotionsByProductIdQueryHandler(IPromotionRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<IEnumerable<PromotionDto>> Handle(GetPromotionsByProductIdQuery request, CancellationToken cancellationToken)
    {
        var promotions = await _repository.GetByProductIdAsync(request.ProductId);
        var now = DateTime.UtcNow;

        return promotions.Select(pr => new PromotionDto(
            pr.PromoId,
            pr.ProductId,
            pr.Product?.Name,
            pr.DiscountPercentage,
            pr.StartDate,
            pr.EndDate,
            pr.StartDate <= now && pr.EndDate >= now
        ));
    }
}
