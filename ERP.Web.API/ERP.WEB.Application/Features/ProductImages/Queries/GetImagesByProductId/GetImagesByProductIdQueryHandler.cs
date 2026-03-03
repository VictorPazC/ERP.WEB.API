using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.ProductImages.Queries.GetImagesByProductId;

public class GetImagesByProductIdQueryHandler : IRequestHandler<GetImagesByProductIdQuery, IEnumerable<ProductImageDto>>
{
    private readonly IProductImageRepository _repository;

    public GetImagesByProductIdQueryHandler(IProductImageRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<IEnumerable<ProductImageDto>> Handle(GetImagesByProductIdQuery request, CancellationToken cancellationToken)
    {
        var images = await _repository.GetByProductIdAsync(request.ProductId);

        return images.Select(i => new ProductImageDto(
            i.ImageId,
            i.ProductId,
            i.ImagePath,
            i.IsPrimary,
            i.DisplayOrder,
            i.RegisteredAt,
            i.VariantId
        ));
    }
}
