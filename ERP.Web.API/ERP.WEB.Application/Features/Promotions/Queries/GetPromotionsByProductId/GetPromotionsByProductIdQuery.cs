using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Promotions.Queries.GetPromotionsByProductId;

public record GetPromotionsByProductIdQuery(int ProductId) : IRequest<IEnumerable<PromotionDto>>;
