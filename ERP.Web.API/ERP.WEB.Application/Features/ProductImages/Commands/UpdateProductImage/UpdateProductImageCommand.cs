using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.ProductImages.Commands.UpdateProductImage;

public record UpdateProductImageCommand(UpdateProductImageDto ImageDto) : IRequest<ProductImageDto?>;
