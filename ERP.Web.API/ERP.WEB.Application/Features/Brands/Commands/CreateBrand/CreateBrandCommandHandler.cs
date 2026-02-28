using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Brands.Commands.CreateBrand;

public class CreateBrandCommandHandler : IRequestHandler<CreateBrandCommand, BrandDto>
{
    private readonly IBrandRepository _repository;

    public CreateBrandCommandHandler(IBrandRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<BrandDto> Handle(CreateBrandCommand request, CancellationToken cancellationToken)
    {
        var brand = new Brand
        {
            Name = request.BrandDto.Name,
            Description = request.BrandDto.Description,
        };

        var created = await _repository.AddAsync(brand);
        return new BrandDto(created.BrandId, created.Name, created.Description, 0);
    }
}
