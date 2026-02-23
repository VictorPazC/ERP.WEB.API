using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Promotions.Queries.GetActivePromotions;

public record GetActivePromotionsQuery : IRequest<IEnumerable<PromotionDto>>;
