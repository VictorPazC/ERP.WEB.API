using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.ProductImages.Queries.GetAllProductImages;

public class GetAllProductImagesQueryHandler : IRequestHandler<GetAllProductImagesQuery, IEnumerable<ProductImageDto>>
{
    private readonly IProductImageRepository _repository;

    public GetAllProductImagesQueryHandler(IProductImageRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<IEnumerable<ProductImageDto>> Handle(GetAllProductImagesQuery request, CancellationToken cancellationToken)
    {
        var images = await _repository.GetAllAsync();

        return images.Select(i => new ProductImageDto(
            i.ImageId,
            i.ProductId,
            i.ImagePath,
            i.IsPrimary,
            i.DisplayOrder,
            i.RegisteredAt
        ));
    }
}
