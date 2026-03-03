namespace ERP.WEB.Application.DTOs;

public record ProductVariantDto(
    int VariantId, int ProductId, string Name, string? Description,
    DateTime CreatedAt, bool HasInventory, int? CurrentStock, string? PrimaryImagePath);

public record CreateProductVariantDto(int ProductId, string? Name, string? Description);

public record UpdateProductVariantDto(int VariantId, string Name, string? Description);
