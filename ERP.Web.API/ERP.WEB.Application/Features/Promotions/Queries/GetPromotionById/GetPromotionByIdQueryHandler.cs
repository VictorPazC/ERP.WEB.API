using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Promotions.Queries.GetPromotionById;

public class GetPromotionByIdQueryHandler : IRequestHandler<GetPromotionByIdQuery, PromotionDto?>
{
    private readonly IPromotionRepository _repository;

    public GetPromotionByIdQueryHandler(IPromotionRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<PromotionDto?> Handle(GetPromotionByIdQuery request, CancellationToken cancellationToken)
    {
        var promotion = await _repository.GetByIdAsync(request.PromoId);

        if (promotion is null)
            return null;

        var now = DateTime.UtcNow;

        return new PromotionDto(
            promotion.PromoId,
            promotion.ProductId,
            promotion.Product?.Name,
            promotion.DiscountPercentage,
            promotion.StartDate,
            promotion.EndDate,
            promotion.StartDate <= now && promotion.EndDate >= now
        );
    }
}
