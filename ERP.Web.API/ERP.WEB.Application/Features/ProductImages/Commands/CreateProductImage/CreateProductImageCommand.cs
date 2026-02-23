using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.ProductImages.Commands.CreateProductImage;

public record CreateProductImageCommand(CreateProductImageDto ImageDto) : IRequest<ProductImageDto>;
