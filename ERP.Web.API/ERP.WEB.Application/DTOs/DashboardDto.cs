namespace ERP.WEB.Application.DTOs;

public record WeeklyStatDto(string Day, decimal Ganancia, int Pedidos);

public record TopProductDto(int ProductId, string Name, decimal Value, string Metric);

public record ActivityLogDto(
    int ActivityLogId,
    string Type,
    string Title,
    string? Description,
    decimal? Amount,
    DateTime Timestamp
);

public record CriticalInventoryDto(
    int InventoryId,
    int ProductId,
    string? ProductName,
    int CurrentStock,
    int? VariantId,
    string? VariantName
);
