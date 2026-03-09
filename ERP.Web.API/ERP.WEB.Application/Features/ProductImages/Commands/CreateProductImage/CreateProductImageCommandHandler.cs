using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.ProductImages.Commands.CreateProductImage;

public class CreateProductImageCommandHandler : IRequestHandler<CreateProductImageCommand, ProductImageDto>
{
    private readonly IProductImageRepository _repository;

    public CreateProductImageCommandHandler(IProductImageRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<ProductImageDto> Handle(CreateProductImageCommand request, CancellationToken cancellationToken)
    {
        var image = new ProductImage
        {
            ProductId = request.ImageDto.ProductId,
            ImagePath = request.ImageDto.ImagePath,
            IsPrimary = request.ImageDto.IsPrimary,
            DisplayOrder = request.ImageDto.DisplayOrder,
            VariantId = request.ImageDto.VariantId,
            RegisteredAt = DateTime.UtcNow
        };

        var created = await _repository.AddAsync(image);

        return new ProductImageDto(
            created.ImageId,
            created.ProductId,
            created.ImagePath,
            created.IsPrimary,
            created.DisplayOrder,
            created.RegisteredAt,
            created.VariantId,
            null  // Variant name not needed immediately after create
        );
    }
}
