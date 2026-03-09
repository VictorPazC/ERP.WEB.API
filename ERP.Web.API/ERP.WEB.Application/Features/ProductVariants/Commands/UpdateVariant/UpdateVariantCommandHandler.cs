using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.ProductVariants.Commands.UpdateVariant;

// Decisión 6B: reemplaza ApplicationDbContext por IProductVariantRepository.
public class UpdateVariantCommandHandler : IRequestHandler<UpdateVariantCommand, bool>
{
    private readonly IProductVariantRepository _repo;

    public UpdateVariantCommandHandler(IProductVariantRepository repo)
    {
        _repo = repo;
    }

    public async ValueTask<bool> Handle(UpdateVariantCommand request, CancellationToken cancellationToken)
    {
        var variant = await _repo.GetByIdAsync(request.Dto.VariantId);

        if (variant is null)
            return false;

        variant.Name        = request.Dto.Name;
        variant.Description = request.Dto.Description;
        variant.StockStatus = request.Dto.StockStatus;

        await _repo.UpdateAsync(variant);
        return true;
    }
}
