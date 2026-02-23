using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.ProductImages.Queries.GetProductImageById;

public record GetProductImageByIdQuery(int ImageId) : IRequest<ProductImageDto?>;
