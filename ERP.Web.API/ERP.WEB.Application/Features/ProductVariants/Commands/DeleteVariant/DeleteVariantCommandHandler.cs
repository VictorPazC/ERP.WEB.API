using ERP.WEB.Infrastructure.Data;
using Mediator;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;

namespace ERP.WEB.Application.Features.ProductVariants.Commands.DeleteVariant;

public class DeleteVariantCommandHandler : IRequestHandler<DeleteVariantCommand, bool>
{
    private readonly ApplicationDbContext _db;
    private readonly IWebHostEnvironment _env;

    public DeleteVariantCommandHandler(ApplicationDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    public async ValueTask<bool> Handle(DeleteVariantCommand request, CancellationToken cancellationToken)
    {
        var variant = await _db.ProductVariants
            .Include(v => v.Images)
            .Include(v => v.Inventory)
            .FirstOrDefaultAsync(v => v.VariantId == request.VariantId, cancellationToken);

        if (variant is null)
            return false;

        // Delete image files from disk
        foreach (var image in variant.Images)
        {
            if (image.ImagePath.StartsWith("/uploads/"))
            {
                var fullPath = Path.Combine(_env.ContentRootPath, "wwwroot", image.ImagePath.TrimStart('/'));
                if (File.Exists(fullPath))
                    File.Delete(fullPath);
            }
        }

        // Remove related entities from DB
        _db.ProductImages.RemoveRange(variant.Images);

        if (variant.Inventory is not null)
            _db.Inventories.Remove(variant.Inventory);

        _db.ProductVariants.Remove(variant);

        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
