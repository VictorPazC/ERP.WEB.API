using ERP.WEB.Application.DTOs;
using MediatR;

namespace ERP.WEB.Application.Features.Products.Commands.CreateProduct;

public record CreateProductCommand(CreateProductDto ProductDto) : IRequest<ProductDto>;