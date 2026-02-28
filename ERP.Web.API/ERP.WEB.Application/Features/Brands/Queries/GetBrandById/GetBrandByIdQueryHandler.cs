using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Brands.Queries.GetBrandById;

public class GetBrandByIdQueryHandler : IRequestHandler<GetBrandByIdQuery, BrandDto?>
{
    private readonly IBrandRepository _repository;

    public GetBrandByIdQueryHandler(IBrandRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<BrandDto?> Handle(GetBrandByIdQuery request, CancellationToken cancellationToken)
    {
        var brand = await _repository.GetByIdAsync(request.BrandId);
        if (brand is null) return null;
        return new BrandDto(brand.BrandId, brand.Name, brand.Description, brand.Products?.Count ?? 0);
    }
}
