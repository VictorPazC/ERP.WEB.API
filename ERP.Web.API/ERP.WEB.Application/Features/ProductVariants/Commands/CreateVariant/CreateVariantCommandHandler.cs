using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.ProductVariants.Commands.CreateVariant;

// Decisión 6B: reemplaza ApplicationDbContext por IProductVariantRepository.
// La lógica de auto-nombre "v{n+1}" se mantiene usando CountByProductAsync.
public class CreateVariantCommandHandler : IRequestHandler<CreateVariantCommand, int>
{
    private readonly IProductVariantRepository _repo;

    public CreateVariantCommandHandler(IProductVariantRepository repo)
    {
        _repo = repo;
    }

    public async ValueTask<int> Handle(CreateVariantCommand request, CancellationToken cancellationToken)
    {
        var name = request.Dto.Name;

        if (string.IsNullOrWhiteSpace(name))
        {
            // Auto-nombre: cuenta variantes existentes del producto para generar "v{n+1}".
            var count = await _repo.CountByProductAsync(request.Dto.ProductId);
            name = $"v{count + 1}";
        }

        var variant = new ProductVariant
        {
            ProductId   = request.Dto.ProductId,
            Name        = name,
            Description = request.Dto.Description,
            CreatedAt   = DateTime.UtcNow
        };

        await _repo.AddAsync(variant);
        return variant.VariantId;
    }
}
