namespace ERP.WEB.Application.DTOs;

public record UpdateProductDto(
    int ProductId,
    string Name,
    string? Description,
    string? Brand,
    string? ReferenceLink,
    string? PurchaseLocation,
    string Status,
    int? CategoryId
);