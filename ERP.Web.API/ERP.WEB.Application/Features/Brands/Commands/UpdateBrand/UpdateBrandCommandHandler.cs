using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Brands.Commands.UpdateBrand;

public class UpdateBrandCommandHandler : IRequestHandler<UpdateBrandCommand, BrandDto?>
{
    private readonly IBrandRepository _repository;

    public UpdateBrandCommandHandler(IBrandRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<BrandDto?> Handle(UpdateBrandCommand request, CancellationToken cancellationToken)
    {
        var brand = await _repository.GetByIdAsync(request.BrandDto.BrandId);
        if (brand is null) return null;

        brand.Name = request.BrandDto.Name;
        brand.Description = request.BrandDto.Description;

        await _repository.UpdateAsync(brand);
        return new BrandDto(brand.BrandId, brand.Name, brand.Description, brand.Products?.Count ?? 0, brand.IsDefault);
    }
}
