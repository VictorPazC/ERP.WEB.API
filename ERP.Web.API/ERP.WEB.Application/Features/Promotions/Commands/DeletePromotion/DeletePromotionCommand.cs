using Mediator;

namespace ERP.WEB.Application.Features.Promotions.Commands.DeletePromotion;

public record DeletePromotionCommand(int PromoId) : IRequest<bool>;
