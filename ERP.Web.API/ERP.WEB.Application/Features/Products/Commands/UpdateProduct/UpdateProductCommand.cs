using ERP.WEB.Application.DTOs;
using MediatR;

namespace ERP.WEB.Application.Features.Products.Commands.UpdateProduct;

public record UpdateProductCommand(UpdateProductDto ProductDto) : IRequest<ProductDto?>;