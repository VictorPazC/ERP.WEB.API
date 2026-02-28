using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Brands.Commands.DeleteBrand;

public class DeleteBrandCommandHandler : IRequestHandler<DeleteBrandCommand, bool>
{
    private readonly IBrandRepository _repository;

    public DeleteBrandCommandHandler(IBrandRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<bool> Handle(DeleteBrandCommand request, CancellationToken cancellationToken)
    {
        var brand = await _repository.GetByIdAsync(request.BrandId);
        if (brand is null) return false;

        await _repository.DeleteAsync(request.BrandId);
        return true;
    }
}
