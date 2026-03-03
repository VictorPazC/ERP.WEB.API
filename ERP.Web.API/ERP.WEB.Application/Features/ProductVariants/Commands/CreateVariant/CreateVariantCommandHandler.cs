using ERP.WEB.Domain.Entities;
using ERP.WEB.Infrastructure.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace ERP.WEB.Application.Features.ProductVariants.Commands.CreateVariant;

public class CreateVariantCommandHandler : IRequestHandler<CreateVariantCommand, int>
{
    private readonly ApplicationDbContext _db;

    public CreateVariantCommandHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async ValueTask<int> Handle(CreateVariantCommand request, CancellationToken cancellationToken)
    {
        var name = request.Dto.Name;

        if (string.IsNullOrWhiteSpace(name))
        {
            var count = await _db.ProductVariants
                .Where(v => v.ProductId == request.Dto.ProductId)
                .CountAsync(cancellationToken);
            name = $"v{count + 1}";
        }

        var variant = new ProductVariant
        {
            ProductId = request.Dto.ProductId,
            Name = name,
            Description = request.Dto.Description,
            CreatedAt = DateTime.UtcNow
        };

        _db.ProductVariants.Add(variant);
        await _db.SaveChangesAsync(cancellationToken);

        return variant.VariantId;
    }
}
