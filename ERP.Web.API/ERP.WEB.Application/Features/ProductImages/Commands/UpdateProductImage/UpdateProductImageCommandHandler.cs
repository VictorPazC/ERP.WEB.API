using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.ProductImages.Commands.UpdateProductImage;

public class UpdateProductImageCommandHandler : IRequestHandler<UpdateProductImageCommand, ProductImageDto?>
{
    private readonly IProductImageRepository _repository;

    public UpdateProductImageCommandHandler(IProductImageRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<ProductImageDto?> Handle(UpdateProductImageCommand request, CancellationToken cancellationToken)
    {
        var image = await _repository.GetByIdAsync(request.ImageDto.ImageId);

        if (image is null)
            return null;

        image.ImagePath = request.ImageDto.ImagePath;
        image.IsPrimary = request.ImageDto.IsPrimary;
        image.DisplayOrder = request.ImageDto.DisplayOrder;

        await _repository.UpdateAsync(image);

        return new ProductImageDto(
            image.ImageId,
            image.ProductId,
            image.ImagePath,
            image.IsPrimary,
            image.DisplayOrder,
            image.RegisteredAt,
            image.VariantId
        );
    }
}
