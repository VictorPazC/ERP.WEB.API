using ERP.WEB.Application.DTOs;
using ERP.WEB.Infrastructure.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace ERP.WEB.Application.Features.ProductVariants.Queries.GetVariantsByProduct;

public class GetVariantsByProductQueryHandler : IRequestHandler<GetVariantsByProductQuery, List<ProductVariantDto>>
{
    private readonly ApplicationDbContext _db;

    public GetVariantsByProductQueryHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async ValueTask<List<ProductVariantDto>> Handle(GetVariantsByProductQuery request, CancellationToken cancellationToken)
    {
        var variants = await _db.ProductVariants
            .Where(v => v.ProductId == request.ProductId)
            .Include(v => v.Inventory)
            .Include(v => v.Images)
            .OrderBy(v => v.CreatedAt)
            .ToListAsync(cancellationToken);

        return variants.Select(v => new ProductVariantDto(
            v.VariantId,
            v.ProductId,
            v.Name,
            v.Description,
            v.CreatedAt,
            v.Inventory is not null,
            v.Inventory?.CurrentStock,
            v.Images.Where(i => i.IsPrimary).FirstOrDefault()?.ImagePath
                ?? v.Images.FirstOrDefault()?.ImagePath
        )).ToList();
    }
}
