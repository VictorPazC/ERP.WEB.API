namespace ERP.WEB.Application.DTOs;

public record InventoryDto(
    int InventoryId,
    int ProductId,
    string? ProductName,
    decimal PurchaseCost,
    decimal SuggestedRetailPrice,
    int CurrentStock,
    decimal EstimatedProfit,
    DateTime LastRestockDate,
    DateTime? LastSaleDate,
    bool NeedsRestock,
    int? VariantId,
    string? VariantName
);
