using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Products.Queries.GetAllProducts;

public record GetAllProductsQuery : IRequest<IEnumerable<ProductDto>>;
