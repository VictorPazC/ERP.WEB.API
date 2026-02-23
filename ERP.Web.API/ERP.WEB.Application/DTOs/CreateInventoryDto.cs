namespace ERP.WEB.Application.DTOs;

public record CreateInventoryDto(
    int ProductId,
    decimal PurchaseCost,
    decimal SuggestedRetailPrice,
    int CurrentStock,
    DateTime LastRestockDate,
    DateTime? LastSaleDate
);
