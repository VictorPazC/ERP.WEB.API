using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.ProductVariants.Queries.GetVariantById;

// Usa GetByIdWithDetailsAsync (incluye Images e Inventory) para construir el DTO completo.
// Mismo mapeo que GetVariantsByProductQueryHandler para consistencia de respuesta.
public class GetVariantByIdQueryHandler : IRequestHandler<GetVariantByIdQuery, ProductVariantDto?>
{
    private readonly IProductVariantRepository _repo;

    public GetVariantByIdQueryHandler(IProductVariantRepository repo)
    {
        _repo = repo;
    }

    public async ValueTask<ProductVariantDto?> Handle(GetVariantByIdQuery request, CancellationToken cancellationToken)
    {
        var v = await _repo.GetByIdWithDetailsAsync(request.VariantId);
        if (v is null)
            return null;

        return new ProductVariantDto(
            v.VariantId,
            v.ProductId,
            v.Name,
            v.Description,
            v.CreatedAt,
            v.Inventory is not null,
            v.Inventory?.CurrentStock,
            v.Images.FirstOrDefault(i => i.IsPrimary)?.ImagePath
                ?? v.Images.FirstOrDefault()?.ImagePath,
            v.StockStatus
        );
    }
}
