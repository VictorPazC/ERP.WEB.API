using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.ProductImages.Queries.GetAllProductImages;

public record GetAllProductImagesQuery : IRequest<IEnumerable<ProductImageDto>>;
