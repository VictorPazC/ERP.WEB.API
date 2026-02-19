namespace ERP.WEB.Application.DTOs;

public record ProductDto(
    int ProductId,
    string Name,
    string? Description,
    string? Brand,
    string? ReferenceLink,
    string? PurchaseLocation,
    string Status,
    int? CategoryId,
    string? CategoryName,
    DateTime CreatedAt
);