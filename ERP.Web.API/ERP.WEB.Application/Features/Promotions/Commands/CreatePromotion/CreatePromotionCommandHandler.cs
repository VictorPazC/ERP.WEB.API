using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Promotions.Commands.CreatePromotion;

public class CreatePromotionCommandHandler : IRequestHandler<CreatePromotionCommand, PromotionDto>
{
    private readonly IPromotionRepository _repository;

    public CreatePromotionCommandHandler(IPromotionRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<PromotionDto> Handle(CreatePromotionCommand request, CancellationToken cancellationToken)
    {
        var promotion = new Promotion
        {
            ProductId = request.PromotionDto.ProductId,
            DiscountPercentage = request.PromotionDto.DiscountPercentage,
            StartDate = request.PromotionDto.StartDate,
            EndDate = request.PromotionDto.EndDate
        };

        var created = await _repository.AddAsync(promotion);
        var now = DateTime.UtcNow;

        return new PromotionDto(
            created.PromoId,
            created.ProductId,
            created.Product?.Name,
            created.DiscountPercentage,
            created.StartDate,
            created.EndDate,
            created.StartDate <= now && created.EndDate >= now
        );
    }
}
