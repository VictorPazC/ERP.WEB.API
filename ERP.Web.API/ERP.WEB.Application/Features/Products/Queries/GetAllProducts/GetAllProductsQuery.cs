using ERP.WEB.Application.DTOs;
using MediatR;

namespace ERP.WEB.Application.Features.Products.Queries.GetAllProducts;

public record GetAllProductsQuery : IRequest<IEnumerable<ProductDto>>;