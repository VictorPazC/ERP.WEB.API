using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Promotions.Queries.GetPromotionById;

public record GetPromotionByIdQuery(int PromoId) : IRequest<PromotionDto?>;
