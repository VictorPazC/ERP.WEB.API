using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Brands.Queries.GetAllBrands;

public class GetAllBrandsQueryHandler : IRequestHandler<GetAllBrandsQuery, IEnumerable<BrandDto>>
{
    private readonly IBrandRepository _repository;

    public GetAllBrandsQueryHandler(IBrandRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<IEnumerable<BrandDto>> Handle(GetAllBrandsQuery request, CancellationToken cancellationToken)
    {
        var brands = await _repository.GetAllAsync();
        return brands.Select(b => new BrandDto(b.BrandId, b.Name, b.Description, b.Products?.Count ?? 0, b.IsDefault));
    }
}
