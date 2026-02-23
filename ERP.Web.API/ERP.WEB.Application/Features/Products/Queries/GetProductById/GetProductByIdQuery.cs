using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Products.Queries.GetProductById;

public record GetProductByIdQuery(int ProductId) : IRequest<ProductDto?>;
