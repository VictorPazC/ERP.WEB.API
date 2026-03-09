using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Dashboard.Queries.GetTopProducts;

public record GetTopProductsQuery(int Limit = 5, string Metric = "revenue") : IRequest<IEnumerable<TopProductDto>>;
