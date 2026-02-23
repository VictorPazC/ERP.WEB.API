using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Promotions.Commands.UpdatePromotion;

public class UpdatePromotionCommandHandler : IRequestHandler<UpdatePromotionCommand, PromotionDto?>
{
    private readonly IPromotionRepository _repository;

    public UpdatePromotionCommandHandler(IPromotionRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<PromotionDto?> Handle(UpdatePromotionCommand request, CancellationToken cancellationToken)
    {
        var promotion = await _repository.GetByIdAsync(request.PromotionDto.PromoId);

        if (promotion is null)
            return null;

        promotion.DiscountPercentage = request.PromotionDto.DiscountPercentage;
        promotion.StartDate = request.PromotionDto.StartDate;
        promotion.EndDate = request.PromotionDto.EndDate;

        await _repository.UpdateAsync(promotion);
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
