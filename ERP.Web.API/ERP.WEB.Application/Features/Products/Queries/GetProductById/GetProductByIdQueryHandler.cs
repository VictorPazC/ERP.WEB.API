using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Products.Queries.GetProductById;

public class GetProductByIdQueryHandler : IRequestHandler<GetProductByIdQuery, ProductDto?>
{
    private readonly IProductRepository _repository;

    public GetProductByIdQueryHandler(IProductRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<ProductDto?> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
    {
        var product = await _repository.GetByIdAsync(request.ProductId);

        if (product is null)
            return null;

        return new ProductDto(
            product.ProductId,
            product.Name,
            product.Description,
            product.BrandId,
            product.Brand?.Name,
            product.ReferenceLink,
            product.PurchaseLocation,
            product.Status,
            product.CategoryId,
            product.Category?.Name,
            product.CreatedAt,
            product.IsFavorite,
            product.StockStatus,
            product.Inventory is not null,
            product.Inventory?.CurrentStock,
            product.Variants.Count
        );
    }
}
