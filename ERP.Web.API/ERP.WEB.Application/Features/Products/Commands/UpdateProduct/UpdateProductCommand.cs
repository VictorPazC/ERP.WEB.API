using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Products.Commands.UpdateProduct;

public record UpdateProductCommand(UpdateProductDto ProductDto) : IRequest<ProductDto?>;
