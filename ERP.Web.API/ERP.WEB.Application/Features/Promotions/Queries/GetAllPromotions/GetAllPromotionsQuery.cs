using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Promotions.Queries.GetAllPromotions;

public record GetAllPromotionsQuery : IRequest<IEnumerable<PromotionDto>>;
