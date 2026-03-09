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

// Decisión 7B: edición de Quantity + Notes con ajuste de stock por delta.
public record UpdateConsumptionDto(
    int ConsumptionId,
    int Quantity,
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
    int CurrentStock,
    int? VariantId,
    string? VariantName
);
