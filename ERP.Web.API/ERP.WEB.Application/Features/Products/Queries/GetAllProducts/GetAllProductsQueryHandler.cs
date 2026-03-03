using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Products.Queries.GetAllProducts;

public class GetAllProductsQueryHandler : IRequestHandler<GetAllProductsQuery, IEnumerable<ProductDto>>
{
    private readonly IProductRepository _repository;

    public GetAllProductsQueryHandler(IProductRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<IEnumerable<ProductDto>> Handle(GetAllProductsQuery request, CancellationToken cancellationToken)
    {
        var products = await _repository.GetAllAsync();

        return products.Select(p => new ProductDto(
            p.ProductId,
            p.Name,
            p.Description,
            p.BrandId,
            p.Brand?.Name,
            p.ReferenceLink,
            p.PurchaseLocation,
            p.Status,
            p.CategoryId,
            p.Category?.Name,
            p.CreatedAt,
            p.IsFavorite,
            p.StockStatus,
            p.Inventory is not null,
            p.Inventory?.CurrentStock,
            p.Variants.Count
        ));
    }
}
