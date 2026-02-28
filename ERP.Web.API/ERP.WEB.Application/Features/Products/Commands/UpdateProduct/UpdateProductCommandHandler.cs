using ERP.WEB.Application.Features.Products.Commands.UpdateProduct;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Products.Commands.UpdateProduct;

public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, ProductDto?>
{
    private readonly IProductRepository _repository;

    public UpdateProductCommandHandler(IProductRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<ProductDto?> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _repository.GetByIdAsync(request.ProductDto.ProductId);

        if (product is null)
            return null;

        product.Name = request.ProductDto.Name;
        product.Description = request.ProductDto.Description;
        product.BrandId = request.ProductDto.BrandId;
        product.ReferenceLink = request.ProductDto.ReferenceLink;
        product.PurchaseLocation = request.ProductDto.PurchaseLocation;
        product.Status = request.ProductDto.Status;
        product.CategoryId = request.ProductDto.CategoryId;

        await _repository.UpdateAsync(product);

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
            product.CreatedAt
        );
    }
}
