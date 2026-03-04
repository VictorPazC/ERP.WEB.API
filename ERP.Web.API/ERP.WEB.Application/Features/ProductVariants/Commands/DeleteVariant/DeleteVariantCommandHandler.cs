using ERP.WEB.Domain.Interfaces;
using Mediator;
using Microsoft.AspNetCore.Hosting;

namespace ERP.WEB.Application.Features.ProductVariants.Commands.DeleteVariant;

// Decisión 6B: reemplaza ApplicationDbContext por IProductVariantRepository.
// IWebHostEnvironment se mantiene: el borrado de archivos físicos es responsabilidad
// de la capa de Application (no del repositorio de infraestructura).
public class DeleteVariantCommandHandler : IRequestHandler<DeleteVariantCommand, bool>
{
    private readonly IProductVariantRepository _repo;
    private readonly IWebHostEnvironment _env;

    public DeleteVariantCommandHandler(IProductVariantRepository repo, IWebHostEnvironment env)
    {
        _repo = repo;
        _env  = env;
    }

    public async ValueTask<bool> Handle(DeleteVariantCommand request, CancellationToken cancellationToken)
    {
        // GetByIdWithDetailsAsync incluye Images e Inventory — necesarios para borrado físico y cascade DB.
        var variant = await _repo.GetByIdWithDetailsAsync(request.VariantId);

        if (variant is null)
            return false;

        // Borrar archivos de imagen del disco (responsabilidad de Application layer).
        foreach (var image in variant.Images)
        {
            if (image.ImagePath.StartsWith("/uploads/"))
            {
                var fullPath = Path.Combine(_env.ContentRootPath, "wwwroot", image.ImagePath.TrimStart('/'));
                if (File.Exists(fullPath))
                    File.Delete(fullPath);
            }
        }

        // Eliminar de DB en cascada (Images → Inventory → Variant) vía repositorio.
        await _repo.DeleteAsync(variant);
        return true;
    }
}
