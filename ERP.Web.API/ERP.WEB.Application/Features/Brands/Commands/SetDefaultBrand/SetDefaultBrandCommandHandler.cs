using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Brands.Commands.SetDefaultBrand;

public class SetDefaultBrandCommandHandler : IRequestHandler<SetDefaultBrandCommand, bool>
{
    private readonly IBrandRepository _repository;

    public SetDefaultBrandCommandHandler(IBrandRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<bool> Handle(SetDefaultBrandCommand request, CancellationToken cancellationToken)
    {
        return await _repository.SetDefaultAsync(request.BrandId);
    }
}
