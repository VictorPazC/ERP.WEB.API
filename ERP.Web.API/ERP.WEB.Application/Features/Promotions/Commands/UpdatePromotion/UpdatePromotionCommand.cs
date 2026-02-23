using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Promotions.Commands.UpdatePromotion;

public record UpdatePromotionCommand(UpdatePromotionDto PromotionDto) : IRequest<PromotionDto?>;
