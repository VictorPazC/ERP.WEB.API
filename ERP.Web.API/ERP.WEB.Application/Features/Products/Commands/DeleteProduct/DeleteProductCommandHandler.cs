using ERP.WEB.Domain.Common;
using ERP.WEB.Domain.Interfaces;
using Mediator;
using Microsoft.AspNetCore.Hosting;

namespace ERP.WEB.Application.Features.Products.Commands.DeleteProduct;

public class DeleteProductCommandHandler : IRequestHandler<DeleteProductCommand, bool>
{
    private readonly IProductRepository _repository;
    private readonly IProductVariantRepository _variantRepo;
    private readonly IProductImageRepository _imageRepo;
    private readonly IInventoryRepository _inventoryRepo;
    private readonly IPromotionRepository _promotionRepo;
    private readonly IWebHostEnvironment _env;

    public DeleteProductCommandHandler(
        IProductRepository repository,
        IProductVariantRepository variantRepo,
        IProductImageRepository imageRepo,
        IInventoryRepository inventoryRepo,
        IPromotionRepository promotionRepo,
        IWebHostEnvironment env)
    {
        _repository    = repository;
        _variantRepo   = variantRepo;
        _imageRepo     = imageRepo;
        _inventoryRepo = inventoryRepo;
        _promotionRepo = promotionRepo;
        _env           = env;
    }

    public async ValueTask<bool> Handle(DeleteProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _repository.GetByIdAsync(request.ProductId);

        if (product is null)
            return false;

        // ── 1. Pre-fetch data before any deletion ──────────────────────────
        // GetAllByProductAsync already Includes Images + Inventory per variant.
        var variants = await _variantRepo.GetAllByProductAsync(
            request.ProductId, new CursorParams(null, 1000), cancellationToken);

        // Only product-level images (VariantId == null); variant images are
        // handled by each variant's DeleteAsync below.
        var productImages = (await _imageRepo.GetByProductIdAsync(request.ProductId))
            .Where(i => i.VariantId == null)
            .ToList();

        var promotions = await _promotionRepo.GetByProductIdAsync(request.ProductId);

        // ── 2. Delete variants (cascade: their images + inventory) ──────────
        foreach (var variant in variants)
        {
            // Delete physical files for variant images.
            foreach (var image in variant.Images)
            {
                if (image.ImagePath.StartsWith("/uploads/"))
                {
                    var full = Path.Combine(_env.ContentRootPath, "wwwroot", image.ImagePath.TrimStart('/'));
                    if (File.Exists(full)) File.Delete(full);
                }
            }

            // Repository handles: ProductImages → Inventory → ProductVariant.
            await _variantRepo.DeleteAsync(variant);
        }

        // ── 3. Delete product-level images ─────────────────────────────────
        foreach (var image in productImages)
        {
            if (image.ImagePath.StartsWith("/uploads/"))
            {
                var full = Path.Combine(_env.ContentRootPath, "wwwroot", image.ImagePath.TrimStart('/'));
                if (File.Exists(full)) File.Delete(full);
            }

            await _imageRepo.DeleteAsync(image.ImageId);
        }

        // ── 4. Delete product-level inventory ──────────────────────────────
        // After step 2, only the base inventory (VariantId = null) remains.
        var baseInventory = await _inventoryRepo.GetByProductIdAsync(request.ProductId);
        if (baseInventory is not null)
            await _inventoryRepo.DeleteAsync(baseInventory.InventoryId);

        // ── 5. Delete promotions ────────────────────────────────────────────
        foreach (var promo in promotions)
            await _promotionRepo.DeleteAsync(promo.PromoId);

        // ── 6. Delete the product (EF handles Product_Tags join table) ──────
        await _repository.DeleteAsync(request.ProductId);
        return true;
    }
}
