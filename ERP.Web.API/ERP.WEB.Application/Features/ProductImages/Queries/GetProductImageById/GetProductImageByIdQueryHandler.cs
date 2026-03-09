using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.ProductImages.Queries.GetProductImageById;

public class GetProductImageByIdQueryHandler : IRequestHandler<GetProductImageByIdQuery, ProductImageDto?>
{
    private readonly IProductImageRepository _repository;

    public GetProductImageByIdQueryHandler(IProductImageRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<ProductImageDto?> Handle(GetProductImageByIdQuery request, CancellationToken cancellationToken)
    {
        var image = await _repository.GetByIdAsync(request.ImageId);

        if (image is null)
            return null;

        return new ProductImageDto(
            image.ImageId,
            image.ProductId,
            image.ImagePath,
            image.IsPrimary,
            image.DisplayOrder,
            image.RegisteredAt,
            image.VariantId,
            image.Variant?.Name
        );
    }
}
