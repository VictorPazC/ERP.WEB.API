using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Dashboard.Queries.GetTopProducts;

public class GetTopProductsHandler : IRequestHandler<GetTopProductsQuery, IEnumerable<TopProductDto>>
{
    private readonly IDashboardRepository _repo;

    public GetTopProductsHandler(IDashboardRepository repo) => _repo = repo;

    public async ValueTask<IEnumerable<TopProductDto>> Handle(
        GetTopProductsQuery request, CancellationToken ct)
    {
        var products = await _repo.GetTopProductsAsync(request.Limit, request.Metric, ct);
        return products.Select(p => new TopProductDto(p.ProductId, p.ProductName, p.Value, request.Metric));
    }
}
