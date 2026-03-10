namespace ERP.WEB.Application.DTOs;

public record OrderDto(
    int OrderId,
    string Status,
    string? Notes,
    decimal TotalAmount,
    DateTime CreatedAt,
    List<OrderItemDto> Items,
    string? PaymentMethod = null
);

public record OrderItemDto(
    int OrderItemId,
    int InventoryId,
    string ProductName,
    int Quantity,
    decimal UnitPrice,
    decimal Subtotal
);

public record CreateOrderDto(
    string? Notes,
    List<CreateOrderItemDto> Items,
    string? PaymentMethod = null
);

public record CreateOrderItemDto(
    int InventoryId,
    int Quantity,
    decimal UnitPrice
);
