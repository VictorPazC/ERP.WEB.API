using ERP.WEB.Application.DTOs;
using Mediator;
using ERP.WEB.Application.Features.Products.Commands.CreateProduct;
using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;

namespace ERP.WEB.Application.Features.Products.Commands.CreateProduct;

public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, ProductDto>
{
    private readonly IProductRepository _repository;

    public CreateProductCommandHandler(IProductRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<ProductDto> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        var product = new Product
        {
            Name = request.ProductDto.Name,
            Description = request.ProductDto.Description,
            BrandId = request.ProductDto.BrandId,
            ReferenceLink = request.ProductDto.ReferenceLink,
            PurchaseLocation = request.ProductDto.PurchaseLocation,
            CategoryId = request.ProductDto.CategoryId,
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };

        var created = await _repository.AddAsync(product);

        return new ProductDto(
            created.ProductId,
            created.Name,
            created.Description,
            created.BrandId,
            created.Brand?.Name,
            created.ReferenceLink,
            created.PurchaseLocation,
            created.Status,
            created.CategoryId,
            created.Category?.Name,
            created.CreatedAt,
            created.IsFavorite,
            created.StockStatus,
            false,
            null
        );
    }
}
