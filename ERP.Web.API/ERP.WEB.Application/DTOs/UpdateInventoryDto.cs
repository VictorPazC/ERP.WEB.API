namespace ERP.WEB.Application.DTOs;

public record UpdateInventoryDto(
    int InventoryId,
    decimal PurchaseCost,
    decimal SuggestedRetailPrice,
    int CurrentStock,
    DateTime LastRestockDate,
    DateTime? LastSaleDate
);
