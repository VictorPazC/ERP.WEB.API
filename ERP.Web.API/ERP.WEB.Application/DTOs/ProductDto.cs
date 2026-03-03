namespace ERP.WEB.Application.DTOs;

public record ProductDto(
    int ProductId,
    string Name,
    string? Description,
    int? BrandId,
    string? BrandName,
    string? ReferenceLink,
    string? PurchaseLocation,
    string Status,
    int? CategoryId,
    string? CategoryName,
    DateTime CreatedAt,
    bool IsFavorite,
    string? StockStatus,
    bool HasInventory,
    int? CurrentStock,
    int VariantCount
);