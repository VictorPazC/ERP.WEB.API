using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.ProductImages.Queries.GetImagesByProductId;

public record GetImagesByProductIdQuery(int ProductId) : IRequest<IEnumerable<ProductImageDto>>;
