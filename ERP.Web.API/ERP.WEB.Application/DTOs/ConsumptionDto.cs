namespace ERP.WEB.Application.DTOs;

public record ConsumptionDto(
    int ConsumptionId,
    int InventoryId,
    int ProductId,
    string? ProductName,
    string? CategoryName,
    int Quantity,
    DateTime ConsumedAt,
    string? Notes
);

public record CreateConsumptionDto(
    int InventoryId,
    int Quantity,
    DateTime ConsumedAt,
    string? Notes
);

public record AvailableArticleDto(
    int InventoryId,
    int ProductId,
    string ProductName,
    string? CategoryName,
    int CategoryId,
    decimal PurchaseCost,
    decimal SuggestedRetailPrice,
    int CurrentStock
);
