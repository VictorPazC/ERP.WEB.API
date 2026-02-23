using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Promotions.Commands.CreatePromotion;

public record CreatePromotionCommand(CreatePromotionDto PromotionDto) : IRequest<PromotionDto>;
